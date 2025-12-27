# ==========================================
# MediaHub Production Deployment (Windows)
# ==========================================
# This PowerShell script orchestrates the complete deployment process from Windows:
# 1. Sync source files to production server using SCP
# 2. Upload deployment script
# 3. Execute remote deployment
# 4. Monitor deployment progress
# 5. Verify deployment success

param(
    [string]$ServerIP = "192.168.178.23",
    [string]$ServerUser = "root",
    [string]$ServerPassword = "BCy1317!",
    [string]$ProjectPath = "/home/media-stack/media-hub",
    [switch]$SkipSync = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n=========================================="
Write-Host "MediaHub Production Deployment"
Write-Host "=========================================="
Write-Host "INFO: Server: $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host "INFO: Target: $ProjectPath" -ForegroundColor Cyan
Write-Host "==========================================`n"

# Get local project directory
$LocalProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "INFO: Local project: $LocalProjectPath" -ForegroundColor Cyan

# Step 1: Sync source files
if (-not $SkipSync) {
    Write-Host "`n==> Step 1: Synchronizing source files to production server" -ForegroundColor Yellow
    
    # Sync src folder
    Write-Host "INFO: Syncing src/ folder..." -ForegroundColor Cyan
    $srcPath = Join-Path $LocalProjectPath "src"
    scp -r -o StrictHostKeyChecking=no "$srcPath" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: src/ folder synced" -ForegroundColor Green
    }
    else {
        Write-Host "ERROR: Failed to sync src/ folder" -ForegroundColor Red
        exit 1
    }
    
    # Sync server folder
    Write-Host "INFO: Syncing server/ folder..." -ForegroundColor Cyan
    $serverPath = Join-Path $LocalProjectPath "server"
    scp -r -o StrictHostKeyChecking=no "$serverPath" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: server/ folder synced" -ForegroundColor Green
    }
    else {
        Write-Host "ERROR: Failed to sync server/ folder" -ForegroundColor Red
        exit 1
    }
    
    # Sync package.json
    Write-Host "INFO: Syncing package.json..." -ForegroundColor Cyan
    $packageJson = Join-Path $LocalProjectPath "package.json"
    scp -o StrictHostKeyChecking=no "$packageJson" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: package.json synced" -ForegroundColor Green
    }
    else {
        Write-Host "ERROR: Failed to sync package.json" -ForegroundColor Red
        exit 1
    }
    
    # Sync Dockerfile
    Write-Host "INFO: Syncing Dockerfile..." -ForegroundColor Cyan
    $dockerfile = Join-Path $LocalProjectPath "Dockerfile"
    scp -o StrictHostKeyChecking=no "$dockerfile" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Dockerfile synced" -ForegroundColor Green
    }
    else {
        Write-Host "ERROR: Failed to sync Dockerfile" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "SUCCESS: All source files synchronized successfully" -ForegroundColor Green
}
else {
    Write-Host "INFO: Skipping file synchronization (--SkipSync flag set)" -ForegroundColor Cyan
}

# Step 2: Upload deployment script
Write-Host "`n==> Step 2: Uploading deployment script" -ForegroundColor Yellow
$deployScript = Join-Path $LocalProjectPath "deploy.sh"
scp -o StrictHostKeyChecking=no "$deployScript" "${ServerUser}@${ServerIP}:/root/deploy.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Deployment script uploaded" -ForegroundColor Green
}
else {
    Write-Host "ERROR: Failed to upload deployment script" -ForegroundColor Red
    exit 1
}

# Step 3: Execute deployment
Write-Host "`n==> Step 3: Executing remote deployment" -ForegroundColor Yellow
Write-Host "INFO: This may take several minutes..." -ForegroundColor Cyan
Write-Host "INFO: The deployment script will:" -ForegroundColor Cyan
Write-Host "INFO:   1. Clean previous build artifacts" -ForegroundColor Cyan
Write-Host "INFO:   2. Install dependencies" -ForegroundColor Cyan
Write-Host "INFO:   3. Build frontend" -ForegroundColor Cyan
Write-Host "INFO:   4. Rebuild Docker container" -ForegroundColor Cyan
Write-Host "INFO:   5. Restart application" -ForegroundColor Cyan
Write-Host ""

# Execute deployment and capture output
ssh -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "sed -i 's/\r$//' /root/deploy.sh && bash /root/deploy.sh"
$deployExitCode = $LASTEXITCODE

# Step 4: Fetch and display deployment log
Write-Host "`n==> Step 4: Deployment log" -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "cat /root/deploy_log.txt"

# Step 5: Verify deployment
Write-Host "`n==> Step 5: Verifying deployment" -ForegroundColor Yellow

if ($deployExitCode -eq 0) {
    Write-Host "SUCCESS: Deployment completed successfully!" -ForegroundColor Green
    
    # Verify container is running
    Write-Host "INFO: Checking container status..." -ForegroundColor Cyan
    $containerStatus = ssh -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "docker ps --filter 'name=mediahub' --format '{{.Status}}'"
    
    if ($containerStatus -match "Up") {
        Write-Host "SUCCESS: Container is running: $containerStatus" -ForegroundColor Green
    }
    else {
        Write-Host "ERROR: Container status: $containerStatus" -ForegroundColor Red
    }
    
    Write-Host "`n=========================================="
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "=========================================="
    Write-Host "INFO: Application URL: https://media.broikiservices.com" -ForegroundColor Cyan
    Write-Host "INFO: Next steps:" -ForegroundColor Cyan
    Write-Host "INFO:   1. Test the application in your browser" -ForegroundColor Cyan
    Write-Host "INFO:   2. Verify all features are working correctly" -ForegroundColor Cyan
    Write-Host "INFO:   3. Monitor logs: ssh $ServerUser@$ServerIP 'docker logs -f mediahub'" -ForegroundColor Cyan
    Write-Host "==========================================`n"
}
else {
    Write-Host "ERROR: Deployment failed with exit code: $deployExitCode" -ForegroundColor Red
    Write-Host "INFO: Check the deployment log above for details" -ForegroundColor Cyan
    Write-Host "INFO: To view full logs: ssh $ServerUser@$ServerIP 'cat /root/deploy_log.txt'" -ForegroundColor Cyan
    exit 1
}
