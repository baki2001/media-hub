---
description: How to deploy media-hub changes to production
---

# Media Hub Production Deployment

This workflow documents the **recommended** way to deploy changes from the local media-hub project to the production server.

## Production Server Details

- **Server IP**: 192.168.178.23
- **SSH User**: root
- **Password**: BCy1317!
- **Project Path**: `/home/media-stack/media-hub`
- **Config Path**: `/home/media-stack/config/mediahub`

## Quick Start (Recommended)

### Option 1: PowerShell Deployment Script

The easiest and most reliable way to deploy:

```powershell
// turbo
.\deploy.ps1
```

This automated script will:
- ✓ Sync all source files (src, server, package.json, Dockerfile)
- ✓ Upload deployment script
- ✓ Execute remote deployment with verification
- ✓ Monitor progress in real-time
- ✓ Verify deployment success

**Parameters:**
```powershell
# Skip file sync (if you already synced manually)
.\deploy.ps1 -SkipSync

# Verbose output
.\deploy.ps1 -Verbose
```

### Option 2: Manual Deployment

See detailed steps below if you prefer manual control.

## Detailed Manual Deployment Steps

### Step 1: Synchronize Source Code

**Important**: Always sync entire folders to ensure new files are included.

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

### Step 2: Upload Deployment Script

```powershell
scp -o StrictHostKeyChecking=no deploy.sh root@192.168.178.23:/root/deploy.sh
```

### Step 3: Execute Deployment

```powershell
// turbo
ssh root@192.168.178.23 "bash /root/deploy.sh"
```

The deployment script will:
1. Clean previous build artifacts
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
2. Hard refresh: `Ctrl+Shift+R` to clear browser cache
3. Test critical functionality
4. Check browser console for errors

## Troubleshooting

### View Deployment Logs

```powershell
# Full log
ssh root@192.168.178.23 "cat /root/deploy_log.txt"

# Last 20 lines
ssh root@192.168.178.23 "tail -n 20 /root/deploy_log.txt"
```

### View Container Logs

```powershell
# Recent logs
ssh root@192.168.178.23 "docker logs --tail 50 mediahub"

# Follow logs in real-time
ssh root@192.168.178.23 "docker logs -f mediahub"
```

### Common Issues

**Issue**: Changes not reflected in browser
**Solution**: Hard refresh browser with `Ctrl+Shift+R` or clear browser cache

**Issue**: New files missing in production
**Solution**: Ensure you synced entire `src` folder with `-r` flag

**Issue**: Docker not rebuilding
**Solution**: The deployment script uses `--no-cache` flag to force rebuild

**Issue**: Build fails with out of memory
**Solution**: The deployment script sets `NODE_OPTIONS="--max-old-space-size=4096"`

## Additional Resources

For comprehensive deployment documentation, see:
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Complete deployment guide
- [deploy.ps1](../deploy.ps1) - PowerShell deployment script
- [deploy.sh](../deploy.sh) - Server-side deployment script
