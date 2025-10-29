# Multi-stage build for optimized production image
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root workspace files (for assets build)
COPY package.json pnpm-lock.yaml tsconfig*.json build-all.mts vite*.mts tailwind.config.ts ./
COPY src ./src

# Install root dependencies
RUN pnpm install --frozen-lockfile

# Build assets (React components)
RUN pnpm run build

# Copy carparking server files
COPY carparking ./carparking

# Install carparking dependencies and build TypeScript
WORKDIR /app/carparking
RUN pnpm install --frozen-lockfile
RUN pnpm exec tsc

# Production stage
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy carparking dependencies
COPY carparking/package.json carparking/pnpm-lock.yaml ./carparking/

# Install production dependencies only
WORKDIR /app/carparking
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/carparking/dist ./dist
COPY --from=builder /app/carparking/src ./src
COPY --from=builder /app/assets ../assets

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "--enable-source-maps", "dist/server.js"]

