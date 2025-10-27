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

type CarparkingWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

const carparkingMeta = {
  "openai/outputTemplate": "ui://widget/carparking-carousel.html",
  "openai/toolInvocation/invoking": "Carousel some car parking spots",
  "openai/toolInvocation/invoked": "Served a fresh car parking carousel",
  "openai/widgetAccessible": true,
  "openai/resultCanProduceWidget": true,
} as const;

const carparkingWidget: CarparkingWidget = {
  id: "carparking-carousel",
  title: "Show CarParking Carousel",
  templateUri: "ui://widget/carparking-carousel.html",
  invoking: "Carousel some car parking spots",
  invoked: "Served a fresh car parking carousel",
  html: `
<div id="carparking-carousel-root"></div>
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
  loadWithHeaders('${NGROK_URL}/assets/carparking-carousel-2d2b.css', 'css');
  loadWithHeaders('${NGROK_URL}/assets/carparking-carousel-2d2b.js', 'js');
</script>
    `.trim(),
  responseText: "Rendered a CarParking carousel!",
};

const rangeSchema = {
  type: ["object", "null"] as const,
  properties: { min: { type: "number" }, max: { type: "number" } },
};

const rangeZod = z
  .object({ min: z.number(), max: z.number() })
  .nullable()
  .optional();

const toolInputParser = z.object({
  geoCircle: z.object({
    lat: z.number(),
    lng: z.number(),
    radiusKm: z.number(),
  }),
  vehicleDimensions: z
    .object({
      length: rangeZod,
      width: rangeZod,
      height: rangeZod,
      weight: rangeZod,
    })
    .optional(),
  roofTypes: z.array(z.number()).optional(),
});

const toolInputSchema = {
  type: "object",
  properties: {
    geoCircle: {
      type: "object",
      description: "検索範囲の円形エリア",
      properties: {
        lat: { type: "number", description: "中心座標の緯度" },
        lng: { type: "number", description: "中心座標の経度" },
        radiusKm: { type: "number", description: "検索半径（キロメートル）" },
      },
      required: ["lat", "lng", "radiusKm"],
    },
    vehicleDimensions: {
      type: "object",
      description: "車の寸法（全長・全幅・全高・総重量）",
      properties: {
        length: rangeSchema,
        width: rangeSchema,
        height: rangeSchema,
        weight: rangeSchema,
      },
    },
    roofTypes: {
      type: "array",
      description: "屋根タイプ 1:屋内、2:屋外、-1:不明",
      items: { type: "number", enum: [1, 2, -1] },
    },
  },
  required: ["geoCircle"],
  additionalProperties: false,
} as const;

const tools: Tool[] = [
  {
    name: "carparking-search",
    description:
      "指定された条件に基づいて駐車場を検索し、カルーセル形式で表示します",
    inputSchema: toolInputSchema,
    title: "Show Parking List as Carousel Format",
    _meta: carparkingMeta,
  },
];

const resources: Resource[] = [
  {
    uri: carparkingWidget.templateUri,
    name: carparkingWidget.title,
    description: `${carparkingWidget.title} widget markup`,
    mimeType: "text/html+skybridge",
    _meta: carparkingMeta,
  },
];

const resourceTemplates: ResourceTemplate[] = [
  {
    uriTemplate: carparkingWidget.templateUri,
    name: carparkingWidget.title,
    description: `${carparkingWidget.title} widget markup`,
    mimeType: "text/html+skybridge",
    _meta: carparkingMeta,
  },
];

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
      const widget = carparkingWidget;

      if (!widget) {
        throw new Error(`Unknown resource: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: carparkingMeta,
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
      switch (request.params.name) {
        case "carparking-search": {
          const args = toolInputParser.parse(request.params.arguments ?? {});

          const context: Context = {
            session: {},
          };

          const result = await parkingSearchLoad(args, context);
          const resultText = JSON.stringify(result, null, 2);

          const response = {
            content: [
              {
                type: "text",
                text: resultText,
              },
            ],
            structuredContent: {
              dataSetId: result.dataSetId,
              parkings: result.parkings,
              searchParams: args,
            },
            _meta: carparkingMeta,
          };

          console.log(
            "📤 Returning response with",
            result.parkings.length,
            "parkings"
          );

          return response;
        }

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
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
