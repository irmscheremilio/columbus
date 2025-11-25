# This Dockerfile builds the worker service
# For the frontend, use a separate service with the frontend/ directory

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files from worker directory
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

# Install Playwright system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user FIRST
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs && \
    mkdir -p /home/nodejs/.cache && \
    chown -R nodejs:nodejs /home/nodejs

# Copy package files
COPY worker/package*.json ./

# Set Playwright browsers path to a location accessible by nodejs user
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright-browsers
RUN mkdir -p /app/.playwright-browsers

# Install production dependencies
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
RUN npm ci --omit=dev || npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Install Playwright browsers to the shared location
RUN npx playwright install chromium && \
    npx playwright install-deps chromium || true

# Fix permissions for the app and playwright browsers
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
