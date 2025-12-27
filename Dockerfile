# ==========================================
# MediaHub - Production Docker Build
# ==========================================
# Uses pre-built dist folder from local build

FROM node:20-alpine

WORKDIR /app

# Install build tools for better-sqlite3 (native module)
RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy pre-built frontend (built locally before docker build)
COPY dist ./dist
RUN echo "--- BUILDING DEBUG ---" && ls -la dist && echo "--- END DEBUG ---"

# Copy server files
COPY server ./server

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

# Create data directory with proper permissions
RUN mkdir -p /data && chown -R node:node /data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Fix permissions
RUN chown -R node:node /app

# Run as non-root
USER node

CMD ["node", "server/index.js"]
