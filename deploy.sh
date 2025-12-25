#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Starting Deployment..." > /root/deploy_log.txt

cd /home/media-stack/media-hub
echo "Cleaning previous build..." >> /root/deploy_log.txt
rm -rf node_modules package-lock.json dist

echo "Building Frontend..." >> /root/deploy_log.txt
export NODE_OPTIONS="--max-old-space-size=4096"
npm install --legacy-peer-deps >> /root/deploy_log.txt 2>&1
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
