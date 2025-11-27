# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files (support both root and worker context)
COPY worker/package*.json ./
COPY worker/tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci || npm install

# Copy source code
COPY worker/src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY worker/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev || npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
