---
description: How to deploy media-hub changes to production
---

# Media Hub Production Deployment

This workflow documents how to deploy changes from the local media-hub project to the production server.

## Production Server Details

- **Server IP**: 192.168.178.23
- **SSH User**: root
- **Password**: BCy1317!
- **Project Path on Production**: `/home/media-stack/media-hub`
- **Config Path on Production**: `/home/media-stack/config/mediahub`

## Steps to Deploy

### 1. Copy Changed Files to Production Server

From the local project directory (`c:\Users\BakiColakoglu\.gemini\antigravity\scratch\media-hub`), use SCP to copy files:

```powershell
# Example: Copy specific changed files
scp -o StrictHostKeyChecking=no <local-file-path> root@192.168.178.23:/home/media-stack/media-hub/<remote-path>

# Common file paths:
# - Backend files: server/routes/*.js, server/*.js
# - Frontend services: src/services/*.js
# - Frontend pages: src/pages/*.jsx
# - Frontend components: src/components/*.jsx
# - Styles: src/pages/*.module.css, src/components/*.css
```

### 2. SSH into Production Server

```powershell
ssh root@192.168.178.23
# Password: BCy1317!
```

### 3. Build the Frontend and Rebuild the Container

**IMPORTANT**: 
- The Docker build uses a pre-built `dist` folder, so you must run `npm run build` before rebuilding the container
- Only touch the media-hub container, do NOT restart or rebuild other containers!

```bash
cd /home/media-stack/media-hub

# Build the frontend (compiles src/ into dist/)
npm run build

# Go back to docker-compose directory and rebuild
cd /home/media-stack

# Rebuild and restart only the mediahub service
// turbo
docker compose up -d --build mediahub
```

### 4. Verify Deployment

- Access the application at http://192.168.178.23:81/
- Check logs if needed: `docker compose logs -f mediahub`

## Quick One-Liner Deploy (from local machine)

```powershell
# Copy all changed files, build frontend, and rebuild container
scp -o StrictHostKeyChecking=no server/routes/proxy.js src/services/api.js src/services/jellystat.js src/pages/Stats.jsx root@192.168.178.23:/home/media-stack/media-hub/ && ssh root@192.168.178.23 "cd /home/media-stack/media-hub && npm run build && cd /home/media-stack && docker compose up -d --build mediahub"
```

## File Structure on Production

```
/home/media-stack/
├── media-hub/               # Main project directory (source code)
│   ├── server/              # Backend code
│   │   ├── routes/
│   │   │   ├── proxy.js
│   │   │   ├── settings.js
│   │   │   └── auth.js
│   │   ├── index.js
│   │   └── database.js
│   ├── src/                 # Frontend code
│   │   ├── pages/
│   │   ├── services/
│   │   ├── components/
│   │   └── context/
│   ├── package.json
│   └── Dockerfile
├── config/
│   └── mediahub/           # Persistent config/data
└── docker-compose.yml
```
