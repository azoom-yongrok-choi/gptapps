import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { parkingSearchLoad } from "./load.js";
import type { Context } from "./type.js";
import dotenv from "dotenv";
dotenv.config();

const NGROK_URL = process.env.NGROK_URL || "http://localhost:8000";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsDir = join(__dirname, "../../assets");

// ============================================================================
// Widget Types & Configuration
// ============================================================================

type WidgetConfig = {
  id: string;
  title: string;
  invoking: string;
  invoked: string;
  responseText: string;
};

type Widget = WidgetConfig & {
  templateUri: string;
  html: string;
};

type WidgetMeta = {
  "openai/outputTemplate": string;
  "openai/toolInvocation/invoking": string;
  "openai/toolInvocation/invoked": string;
  "openai/widgetAccessible": true;
  "openai/resultCanProduceWidget": true;
};

// ============================================================================
// Widget Factory Functions
// ============================================================================

function createWidgetLoaderScript(assetName: string, rootId: string): string {
  return `
<div id="${rootId}-root"></div>
<script>
  const loadWithHeaders = (url, type) => {
    fetch(url, { headers: { 'ngrok-skip-browser-warning': '1' } })
      .then(r => r.text())
      .then(content => {
        if (type === 'css') {
          const style = document.createElement('style');
          style.textContent = content;
          document.head.appendChild(style);
        } else if (type === 'js') {
          const script = document.createElement('script');
          script.type = 'module';
          script.textContent = content;
          document.body.appendChild(script);
        }
      });
  };
  loadWithHeaders('${NGROK_URL}/assets/${assetName}.css', 'css');
  loadWithHeaders('${NGROK_URL}/assets/${assetName}.js', 'js');
</script>
  `.trim();
}

function createWidget(config: WidgetConfig, assetName: string): Widget {
  return {
    ...config,
    templateUri: `ui://widget/${config.id}.html`,
    html: createWidgetLoaderScript(assetName, config.id),
  };
}

function createWidgetMeta(widget: Widget): WidgetMeta {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  };
}

// ============================================================================
// Widget Definitions
// ============================================================================

type WidgetToolMapping = {
  toolName: string;
  widgetConfig: WidgetConfig;
  assetName?: string; // Optional: defaults to widget id
};

const WIDGET_TOOL_MAPPINGS: WidgetToolMapping[] = [
  {
    toolName: "carparking-search",
    widgetConfig: {
      id: "carparking-carousel",
      title: "Show CarParking Carousel",
      invoking: "Carousel some car parking spots",
      invoked: "Served a fresh car parking carousel",
      responseText: "Rendered a CarParking carousel!",
    },
    assetName: "carparking-carousel-2d2b",
  },
  {
    toolName: "carparking-search-input",
    widgetConfig: {
      id: "carparking-search-input",
      title: "Show CarParking Search Input",
      invoking: "Opening car parking search form",
      invoked: "Served a car parking search input form",
      responseText: "Rendered a CarParking search input form!",
    },
    assetName: "carparking-search-input-2d2b",
  },
];

// Create widgets with their meta information, using tool name as the key
const widgets = new Map<string, { widget: Widget; meta: WidgetMeta }>();

for (const mapping of WIDGET_TOOL_MAPPINGS) {
  const assetName = mapping.assetName || mapping.widgetConfig.id;
  const widget = createWidget(mapping.widgetConfig, assetName);
  const meta = createWidgetMeta(widget);
  widgets.set(mapping.toolName, { widget, meta });
}

// ============================================================================
// Tool Input Schema
// ============================================================================

const toolInputParser = z.object({
  geoCircle: z.object({
    lat: z.number(),
    lng: z.number(),
    radiusKm: z.number(),
  }),
});

// ============================================================================
// MCP Tools, Resources, and Templates
// ============================================================================

const tools: Tool[] = [
  {
    name: "carparking-search",
    description:
      "指定された条件に基づいて駐車場を検索し、カルーセル形式で表示します",
    inputSchema: {
      type: "object",
      properties: {
        geoCircle: {
          type: "object",
          description: "検索範囲の円形エリア",
          properties: {
            lat: { type: "number", description: "中心座標の緯度" },
            lng: { type: "number", description: "中心座標の経度" },
            radiusKm: {
              type: "number",
              description: "検索半径（キロメートル）",
            },
          },
          required: ["lat", "lng", "radiusKm"],
        },
      },
      required: ["geoCircle"],
      additionalProperties: false,
    },
    title: "Show Parking List as Carousel Format",
    _meta: widgets.get("carparking-search")!.meta,
  },
  {
    name: "carparking-search-input",
    description:
      "駐車場を検索するための入力フォームを表示します。駅名と検索半径を入力できます",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    title: "Show Parking Search Input Form",
    _meta: widgets.get("carparking-search-input")!.meta,
  },
];

const resources: Resource[] = Array.from(widgets.values()).map(
  ({ widget, meta }) => ({
    uri: widget.templateUri,
    name: widget.title,
    description: `${widget.title} widget markup`,
    mimeType: "text/html+skybridge",
    _meta: meta,
  })
);

const resourceTemplates: ResourceTemplate[] = Array.from(widgets.values()).map(
  ({ widget, meta }) => ({
    uriTemplate: widget.templateUri,
    name: widget.title,
    description: `${widget.title} widget markup`,
    mimeType: "text/html+skybridge",
    _meta: meta,
  })
);

function createCarparkingServer(): Server {
  const server = new Server(
    {
      name: "carparking-node",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources,
    })
  );

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const uri = request.params.uri;

      // Find widget by templateUri
      const widgetEntry = Array.from(widgets.values()).find(
        ({ widget }) => widget.templateUri === uri
      );

      if (!widgetEntry) {
        throw new Error(`Unknown resource: ${uri}`);
      }

      const { widget, meta } = widgetEntry;

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: meta,
          },
        ],
      };
    }
  );

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates,
    })
  );

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools,
    })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const toolName = request.params.name;
      console.log("📤 Calling tool:", toolName);
      switch (toolName) {
        case "carparking-search": {
          const args = toolInputParser.parse(request.params.arguments ?? {});
          const context: Context = { session: {} };
          const result = await parkingSearchLoad(args, context);
          const resultText = JSON.stringify(result, null, 2);

          console.log(
            "📤 Returning response with",
            result.parkings.length,
            "parkings"
          );

          return {
            content: [{ type: "text", text: resultText }],
            structuredContent: {
              dataSetId: result.dataSetId,
              parkings: result.parkings,
              searchParams: args,
            },
            _meta: widgets.get("carparking-search")!.meta,
          };
        }

        case "carparking-search-input": {
          const widgetEntry = widgets.get(toolName);
          if (!widgetEntry) {
            throw new Error(`Unknown tool: ${toolName}`);
          }

          const { widget, meta } = widgetEntry;
          console.log(`📤 Returning ${widget.title}`);

          return {
            content: [{ type: "text", text: widget.responseText }],
            _meta: meta,
          };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    }
  );

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createCarparkingServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    console.log(`🌐 ${req.method} ${url.pathname}`);

    // CORS preflight 처리
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
        "Access-Control-Allow-Headers":
          "content-type, ngrok-skip-browser-warning",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    // Static assets 서빙
    if (
      (req.method === "GET" || req.method === "HEAD") &&
      url.pathname.startsWith("/assets/")
    ) {
      try {
        const filename = url.pathname.replace("/assets/", "");
        const filePath = join(assetsDir, filename);

        console.log("📄 Requested file:", filename);
        console.log("📍 Full path:", filePath);

        const content = readFileSync(filePath);

        const ext = filename.split(".").pop();
        const contentTypes: Record<string, string> = {
          js: "application/javascript",
          css: "text/css",
          html: "text/html",
        };

        res.writeHead(200, {
          "Content-Type": contentTypes[ext || ""] || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(content);
        console.log("✅ File served successfully");
        return;
      } catch (error) {
        console.error("❌ Failed to serve static file:", error);
        res.writeHead(404).end("File not found");
        return;
      }
    }

    res.writeHead(404).end("Not Found");
  }
);

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

httpServer.listen(port, async () => {
  console.log(`Carparking MCP server listening on http://localhost:${port}`);
  console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
  console.log(
    `  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`
  );
});
