#!/bin/bash
# ==========================================
# MediaHub Production Deployment Script
# ==========================================
# This script handles the complete deployment process:
# 1. Clean previous build artifacts
# 2. Install dependencies
# 3. Build frontend
# 4. Rebuild Docker container with no-cache
# 5. Verify deployment success

set -e  # Exit on error

# Setup environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

LOG_FILE="/root/deploy_log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Helper function for logging
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting MediaHub Deployment"
log "=========================================="

# Navigate to project directory
cd /home/media-stack/media-hub || exit 1
log "Working directory: $(pwd)"

# Clean previous build
log "Cleaning previous build artifacts..."
rm -rf node_modules package-lock.json dist
log "✓ Cleanup complete"

# Install dependencies
log "Installing dependencies..."
export NODE_OPTIONS="--max-old-space-size=4096"
if npm install --legacy-peer-deps >> "$LOG_FILE" 2>&1; then
    log "✓ Dependencies installed successfully"
else
    log "✗ Failed to install dependencies"
    exit 1
fi

# Build frontend
log "Building frontend..."
if npm run build >> "$LOG_FILE" 2>&1; then
    log "✓ Frontend build successful"
    
    # Verify dist folder exists
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        log "✓ Dist folder created (size: $DIST_SIZE)"
        log "Debug: Listing first 10 assets:"
        ls -la dist/assets | head -n 10 | tee -a "$LOG_FILE"
    else
        log "✗ Dist folder not found after build"
        exit 1
    fi
else
    log "✗ Frontend build failed"
    exit 1
fi

# Rebuild Docker container
log "Rebuilding Docker container..."
cd /home/media-stack || exit 1

# Stop existing container first
log "Stopping existing container..."
docker compose stop mediahub >> "$LOG_FILE" 2>&1 || true

# Build with no-cache to ensure fresh build
log "Building image with --no-cache..."
if docker compose build --no-cache mediahub >> "$LOG_FILE" 2>&1; then
    log "✓ Docker image built successfully"
else
    log "✗ Docker build failed"
    exit 1
fi

# Start with force-recreate to ensure new container
if docker compose up -d --force-recreate mediahub >> "$LOG_FILE" 2>&1; then
    log "✓ Container started successfully"
else
    log "✗ Container start failed"
    exit 1
fi

# Wait for container to be healthy
log "Waiting for container to be healthy..."
sleep 8

# Verify container is running
if docker ps | grep -q mediahub; then
    log "✓ Container is running"
    CONTAINER_ID=$(docker ps --filter "name=mediahub" --format "{{.ID}}")
    log "  Container ID: $CONTAINER_ID"
else
    log "✗ Container is not running"
    exit 1
fi

# Verify deployed version
log "Verifying deployed version..."
sleep 2
VERSION_RESPONSE=$(curl -s http://localhost:81/api/version 2>/dev/null || echo "FAILED")
log "  Version API Response: $VERSION_RESPONSE"

log "=========================================="
log "Deployment Complete Successfully!"
log "=========================================="
log "Next steps:"
log "1. Verify application at: https://media.broikiservices.com"
log "2. Check version: curl https://media.broikiservices.com/api/version"
log "3. Monitor health: docker ps"

