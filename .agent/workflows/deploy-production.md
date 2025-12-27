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

> **SSH Password Handling**: The deployment script requires entering the SSH password (`BCy1317!`) multiple times during execution (for each scp/ssh command). If running interactively, enter the password when prompted. For automation, consider setting up SSH key-based authentication.

This automated script will:
- ✓ Sync all source files (src, server, package.json, Dockerfile)
- ✓ Upload deployment script
- ✓ Execute remote deployment with verification
- ✓ Build with `--no-cache` to ensure fresh Docker image
- ✓ Verify container is running
- ✓ Call `/api/version` to confirm deployed version

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

**Quick verification using script:**
```powershell
// turbo
.\verify-deployment.ps1
```

**Manual verification:**
```powershell
# Check deployed version (should match local package.json)
Invoke-WebRequest -Uri "https://media.broikiservices.com/api/version" -UseBasicParsing | Select-Object -ExpandProperty Content

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
3. Check Settings page → version should match local package.json
4. Test critical functionality
5. Check browser console for errors

## Deployment Verification Checklist

Run this checklist after every deployment:

- [ ] `.\verify-deployment.ps1` shows version match
- [ ] Settings page shows correct version
- [ ] No console errors in browser DevTools
- [ ] Login/logout works correctly
- [ ] Dashboard loads with data
- [ ] At least one other feature tested (Library, Search, etc.)

## Cloudflare Cache

The site is behind Cloudflare which may cache responses. If changes don't appear:

1. **Purge cache** (recommended):
   - Log into Cloudflare dashboard
   - Select the domain
   - Go to Caching → Configuration
   - Click "Purge Everything"

2. **Development Mode** (for testing):
   - Go to Caching → Configuration
   - Enable "Development Mode" (disables caching for 3 hours)

3. **Page Rules** (permanent fix):
   - Create rule for `media.broikiservices.com/*.html`
   - Set Cache Level: Bypass

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

**Issue**: Version mismatch after deployment
**Cause**: Docker build cache or Cloudflare cache
**Solution**:
1. Check deployment log for errors
2. Purge Cloudflare cache
3. Hard refresh browser (`Ctrl+Shift+R`)

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
- [verify-deployment.ps1](../verify-deployment.ps1) - Deployment verification script

## Technical Reference

Key architecture details for troubleshooting:

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/version` | Returns `{version, buildTime, environment}` - use to verify deployment |
| `/api/health` | Health check returning `{status: "ok", timestamp}` |

### Docker Architecture

- **docker-compose.yml location**: `/home/media-stack/docker-compose.yml`
- **MediaHub service**: Built from `./media-hub` directory (not pulled from registry)
- **Build process**: `deploy.sh` runs npm build on server, then `docker compose build --no-cache`
- **Container name**: `mediahub`
- **Port mapping**: `81:3000`
- **Data volume**: `/home/media-stack/config/mediahub:/data` (SQLite database)

### Caching Behavior

- **index.html**: Served with `Cache-Control: no-store, no-cache` + `Surrogate-Control: no-store`
- **Hashed assets** (`/assets/*.js|css`): `immutable, max-age=1y` (fingerprinted filenames)
- **Cloudflare**: May cache unless purged - check CF-RAY header for cache status

### File Sync Requirements

When deploying, these files MUST be synced to the server:
- `src/` - Frontend source code
- `server/` - Backend Express server
- `package.json` - Dependencies
- `Dockerfile` - Build configuration
- `deploy.sh` - Server-side deployment script
