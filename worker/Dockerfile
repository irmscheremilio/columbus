# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci || npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production - Use official Playwright image with browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (skip browser download - already in image)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --omit=dev || npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
