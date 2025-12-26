# MediaHub Production Deployment Guide

This document provides comprehensive instructions for deploying MediaHub to production.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Architecture](#deployment-architecture)
- [Quick Start](#quick-start)
- [Detailed Deployment Process](#detailed-deployment-process)
- [Troubleshooting](#troubleshooting)
- [Common Issues](#common-issues)

## Overview

MediaHub uses a Docker-based deployment architecture where:
1. The frontend is built locally on the production server
2. The built `dist` folder is copied into a Docker image
3. The Docker container serves the static frontend and runs the Node.js backend

## Prerequisites

### Local Machine (Windows)
- PowerShell 5.1 or later
- SSH client (OpenSSH, included in Windows 10+)
- SCP client (included with OpenSSH)
- Git (for version control)

### Production Server
- Ubuntu/Debian Linux
- Docker and Docker Compose installed
- Node.js 20+ (via NVM)
- SSH access with root privileges
- Minimum 4GB RAM (for build process)

### Server Details
- **IP Address**: 192.168.178.23
- **SSH User**: root
- **Project Path**: `/home/media-stack/media-hub`
- **Docker Compose Path**: `/home/media-stack/docker-compose.yml`
- **Data Path**: `/home/media-stack/config/mediahub`

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Local Development (Windows)                                 │
│                                                              │
│  1. Make code changes                                       │
│  2. Test locally                                            │
│  3. Run deploy.ps1                                          │
│     │                                                        │
│     └──> SCP sync files ──────────────────────┐            │
└───────────────────────────────────────────────┼─────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Production Server (192.168.178.23)                          │
│                                                              │
│  /home/media-stack/media-hub/                               │
│  ├── src/           ◄─── Synced from local                  │
│  ├── server/        ◄─── Synced from local                  │
│  ├── package.json   ◄─── Synced from local                  │
│  ├── Dockerfile     ◄─── Synced from local                  │
│  └── deploy.sh      ◄─── Synced from local                  │
│                                                              │
│  Deployment Process:                                        │
│  1. npm install --legacy-peer-deps                          │
│  2. npm run build → creates dist/                           │
│  3. docker compose build --no-cache mediahub                │
│     │                                                        │
│     └──> Dockerfile copies dist/ into image                 │
│                                                              │
│  4. docker compose up -d mediahub                           │
│     │                                                        │
│     └──> Container serves app on port 3000                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: PowerShell Script (Recommended)

```powershell
# From the project root directory
.\deploy.ps1
```

This will:
- ✓ Sync all source files to production
- ✓ Upload deployment script
- ✓ Execute remote deployment
- ✓ Monitor progress
- ✓ Verify deployment success

### Option 2: Manual Deployment

See [Detailed Deployment Process](#detailed-deployment-process) below.

## Detailed Deployment Process

### Step 1: Sync Source Files

The deployment script uses SCP to sync files. This ensures all changes (including new files) are uploaded.

```powershell
# Sync source code
scp -r -o StrictHostKeyChecking=no src root@192.168.178.23:/home/media-stack/media-hub/

# Sync server code
scp -r -o StrictHostKeyChecking=no server root@192.168.178.23:/home/media-stack/media-hub/

# Sync package.json
scp -o StrictHostKeyChecking=no package.json root@192.168.178.23:/home/media-stack/media-hub/

# Sync Dockerfile
scp -o StrictHostKeyChecking=no Dockerfile root@192.168.178.23:/home/media-stack/media-hub/
```

**Important**: Always sync the entire `src` and `server` folders to ensure new files are included.

### Step 2: Upload Deployment Script

```powershell
scp -o StrictHostKeyChecking=no deploy.sh root@192.168.178.23:/root/deploy.sh
```

### Step 3: Execute Deployment

```powershell
ssh root@192.168.178.23 "bash /root/deploy.sh"
```

The deployment script will:
1. Clean previous build artifacts (`node_modules`, `dist`, `package-lock.json`)
2. Install dependencies with `npm install --legacy-peer-deps`
3. Build frontend with `npm run build`
4. Rebuild Docker image with `docker compose build --no-cache mediahub`
5. Restart container with `docker compose up -d mediahub`
6. Verify container is running

### Step 4: Verify Deployment

```powershell
# Check deployment log
ssh root@192.168.178.23 "cat /root/deploy_log.txt"

# Check container status
ssh root@192.168.178.23 "docker ps --filter 'name=mediahub'"

# Check container logs
ssh root@192.168.178.23 "docker logs --tail 50 mediahub"
```

### Step 5: Test Application

1. Open browser to: https://media.broikiservices.com
2. Test critical functionality:
   - Login/Authentication
   - Search functionality
   - Indexers page
   - Library browsing
3. Check browser console for errors

## Troubleshooting

### Deployment Log Location

All deployment logs are written to `/root/deploy_log.txt` on the production server.

```powershell
# View full deployment log
ssh root@192.168.178.23 "cat /root/deploy_log.txt"

# View last 20 lines
ssh root@192.168.178.23 "tail -n 20 /root/deploy_log.txt"

# Follow logs in real-time (during deployment)
ssh root@192.168.178.23 "tail -f /root/deploy_log.txt"
```

### Container Logs

```powershell
# View container logs
ssh root@192.168.178.23 "docker logs mediahub"

# Follow container logs in real-time
ssh root@192.168.178.23 "docker logs -f mediahub"

# View last 50 lines
ssh root@192.168.178.23 "docker logs --tail 50 mediahub"
```

### Manual Container Management

```powershell
# Stop container
ssh root@192.168.178.23 "cd /home/media-stack && docker compose stop mediahub"

# Start container
ssh root@192.168.178.23 "cd /home/media-stack && docker compose start mediahub"

# Restart container
ssh root@192.168.178.23 "cd /home/media-stack && docker compose restart mediahub"

# Rebuild and restart
ssh root@192.168.178.23 "cd /home/media-stack && docker compose up -d --build --no-cache mediahub"
```

## Common Issues

### Issue 1: "handleSearch is not defined" or Similar Errors

**Cause**: Docker layer caching prevented rebuild from picking up new files.

**Solution**: The deployment script now uses `--no-cache` flag to force complete rebuild.

```bash
docker compose build --no-cache mediahub
docker compose up -d mediahub
```

### Issue 2: New Files Not Appearing in Production

**Cause**: SCP doesn't sync new files if parent directory wasn't synced.

**Solution**: Always sync entire `src` and `server` folders using `-r` flag:

```powershell
scp -r src root@192.168.178.23:/home/media-stack/media-hub/
```

### Issue 3: Build Fails with "Out of Memory"

**Cause**: Node.js build process exceeds default memory limit.

**Solution**: The deployment script sets `NODE_OPTIONS="--max-old-space-size=4096"` to increase memory limit to 4GB.

If still failing, increase the value:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Issue 4: Container Won't Start

**Cause**: Various reasons - port conflict, missing dependencies, corrupted image.

**Solution**:
```powershell
# Check container logs for error
ssh root@192.168.178.23 "docker logs mediahub"

# Remove container and rebuild
ssh root@192.168.178.23 "cd /home/media-stack && docker compose down mediahub"
ssh root@192.168.178.23 "cd /home/media-stack && docker compose up -d --build --no-cache mediahub"
```

### Issue 5: Changes Not Reflected in Browser

**Cause**: Browser caching old JavaScript bundles.

**Solution**:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Open in incognito/private window
4. Verify bundle hash changed in HTML source

### Issue 6: npm install Fails with Peer Dependency Conflicts

**Cause**: React 19 has peer dependency conflicts with some packages.

**Solution**: The deployment script uses `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

## Deployment Checklist

Before deploying:
- [ ] Test changes locally
- [ ] Commit changes to git
- [ ] Review what files changed
- [ ] Ensure no sensitive data in code

During deployment:
- [ ] Run `.\deploy.ps1` or manual deployment steps
- [ ] Monitor deployment log for errors
- [ ] Verify container starts successfully
- [ ] Check container logs for startup errors

After deployment:
- [ ] Test application in browser
- [ ] Verify all features work correctly
- [ ] Check browser console for errors
- [ ] Monitor server resources (CPU, memory)
- [ ] Tag release in git if successful

## Advanced Topics

### Rollback Procedure

If deployment fails and you need to rollback:

```powershell
# SSH into server
ssh root@192.168.178.23

# Navigate to project
cd /home/media-stack/media-hub

# Checkout previous version (if using git on server)
git checkout <previous-commit-hash>

# Rebuild and restart
cd /home/media-stack
docker compose build --no-cache mediahub
docker compose up -d mediahub
```

### Environment Variables

Environment variables are set in `/home/media-stack/docker-compose.yml`:

```yaml
services:
  mediahub:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATA_DIR=/data
```

To modify, edit the docker-compose.yml on the server and restart the container.

### Database Backups

MediaHub uses SQLite database stored in `/home/media-stack/config/mediahub/data`.

```powershell
# Backup database
ssh root@192.168.178.23 "cp /home/media-stack/config/mediahub/data/mediahub.db /root/backup-$(date +%Y%m%d).db"

# Restore database
ssh root@192.168.178.23 "cp /root/backup-YYYYMMDD.db /home/media-stack/config/mediahub/data/mediahub.db"
```

## Support

For issues or questions:
1. Check deployment logs: `/root/deploy_log.txt`
2. Check container logs: `docker logs mediahub`
3. Review this guide's troubleshooting section
4. Check project documentation in `.agent/` folder
