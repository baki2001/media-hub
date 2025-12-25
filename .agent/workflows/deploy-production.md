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

### 1. Synchronize Source Code

Instead of copying individual files, it is safer to synchronize the entire `src` directory to ensure no new files (like contexts, components, or services) are missed.

From the local project directory (`c:\Users\BakiColakoglu\.gemini\antigravity\scratch\media-hub`):

```powershell
# Sync the entire src folder recursively
scp -r -o StrictHostKeyChecking=no src root@192.168.178.23:/home/media-stack/media-hub/

# If you modified backend files, sync server folder as well
# scp -r -o StrictHostKeyChecking=no server root@192.168.178.23:/home/media-stack/media-hub/
```

### 2. Prepare Deployment Script

The build process is complex and can fail if environment variables (like NVM) are missing. We use a server-side script to handle the build reliably.

**Create `deploy.sh` in your local project root if it doesn't exist:**

```bash
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Starting Deployment..." > /root/deploy_log.txt

cd /home/media-stack/media-hub
echo "Building Frontend..." >> /root/deploy_log.txt
npm install >> /root/deploy_log.txt 2>&1
npm run build >> /root/deploy_log.txt 2>&1

if [ $? -eq 0 ]; then
    echo "Frontend Build Success" >> /root/deploy_log.txt
    cd /home/media-stack
    echo "Rebuiding Container..." >> /root/deploy_log.txt
    docker compose up -d --build mediahub >> /root/deploy_log.txt 2>&1
    echo "Deployment Complete" >> /root/deploy_log.txt
else
    echo "Frontend Build Failed" >> /root/deploy_log.txt
fi
```

**Upload the script to the server:**

```powershell
scp -o StrictHostKeyChecking=no deploy.sh root@192.168.178.23:/root/deploy.sh
```

### 3. Execute Deployment

Run the script on the server via SSH. The script will:
1.  Source NVM environment.
2.  Install new dependencies (`npm install`).
3.  Build the frontend (`npm run build`).
4.  Rebuild and restart the Docker container.
5.  Log output to `/root/deploy_log.txt`.

```powershell
// turbo
ssh root@192.168.178.23 "bash /root/deploy.sh"
```

### 4. Verify Deployment

Check the status by reading the logs:

```powershell
ssh root@192.168.178.23 "tail -n 10 /root/deploy_log.txt"
```

Look for **"Deployment Complete"**.
- If it failed, check the full log: `ssh root@192.168.178.23 "cat /root/deploy_log.txt"`
- Access the application at: http://media.broikiservices.com (or http://192.168.178.23:81/)
