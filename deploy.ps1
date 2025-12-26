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

# Colors for output - Define these FIRST before using them
function Write-Success { 
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green 
}

function Write-Error { 
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red 
}

function Write-Info { 
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan 
}

function Write-Step { 
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Yellow 
}

Write-Host "`n=========================================="
Write-Host "MediaHub Production Deployment"
Write-Host "=========================================="
Write-Info "Server: $ServerUser@$ServerIP"
Write-Info "Target: $ProjectPath"
Write-Host "==========================================`n"

# Get local project directory
$LocalProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Info "Local project: $LocalProjectPath"

# Step 1: Sync source files
if (-not $SkipSync) {
    Write-Step "Step 1: Synchronizing source files to production server"
    
    # Sync src folder
    Write-Info "Syncing src/ folder..."
    $srcPath = Join-Path $LocalProjectPath "src"
    scp -r -o StrictHostKeyChecking=no "$srcPath" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "src/ folder synced"
    }
    else {
        Write-Error "Failed to sync src/ folder"
        exit 1
    }
    
    # Sync server folder
    Write-Info "Syncing server/ folder..."
    $serverPath = Join-Path $LocalProjectPath "server"
    scp -r -o StrictHostKeyChecking=no "$serverPath" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "server/ folder synced"
    }
    else {
        Write-Error "Failed to sync server/ folder"
        exit 1
    }
    
    # Sync package.json
    Write-Info "Syncing package.json..."
    $packageJson = Join-Path $LocalProjectPath "package.json"
    scp -o StrictHostKeyChecking=no "$packageJson" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "package.json synced"
    }
    else {
        Write-Error "Failed to sync package.json"
        exit 1
    }
    
    # Sync Dockerfile
    Write-Info "Syncing Dockerfile..."
    $dockerfile = Join-Path $LocalProjectPath "Dockerfile"
    scp -o StrictHostKeyChecking=no "$dockerfile" "${ServerUser}@${ServerIP}:${ProjectPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dockerfile synced"
    }
    else {
        Write-Error "Failed to sync Dockerfile"
        exit 1
    }
    
    Write-Success "All source files synchronized successfully"
}
else {
    Write-Info "Skipping file synchronization (--SkipSync flag set)"
}

# Step 2: Upload deployment script
Write-Step "Step 2: Uploading deployment script"
$deployScript = Join-Path $LocalProjectPath "deploy.sh"
scp -o StrictHostKeyChecking=no "$deployScript" "${ServerUser}@${ServerIP}:/root/deploy.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Success "Deployment script uploaded"
}
else {
    Write-Error "Failed to upload deployment script"
    exit 1
}

# Step 3: Execute deployment
Write-Step "Step 3: Executing remote deployment"
Write-Info "This may take several minutes..."
Write-Info "The deployment script will:"
Write-Info "  1. Clean previous build artifacts"
Write-Info "  2. Install dependencies"
Write-Info "  3. Build frontend"
Write-Info "  4. Rebuild Docker container"
Write-Info "  5. Restart application"
Write-Host ""

# Execute deployment and capture output
ssh -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "bash /root/deploy.sh"
$deployExitCode = $LASTEXITCODE

# Step 4: Fetch and display deployment log
Write-Step "Step 4: Deployment log"
ssh -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "cat /root/deploy_log.txt"

# Step 5: Verify deployment
Write-Step "Step 5: Verifying deployment"

if ($deployExitCode -eq 0) {
    Write-Success "Deployment completed successfully!"
    
    # Verify container is running
    Write-Info "Checking container status..."
    $containerStatus = ssh -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "docker ps --filter 'name=mediahub' --format '{{.Status}}'"
    
    if ($containerStatus -match "Up") {
        Write-Success "Container is running: $containerStatus"
    }
    else {
        Write-Error "Container status: $containerStatus"
    }
    
    Write-Host "`n=========================================="
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "=========================================="
    Write-Info "Application URL: https://media.broikiservices.com"
    Write-Info "Next steps:"
    Write-Info "  1. Test the application in your browser"
    Write-Info "  2. Verify all features are working correctly"
    Write-Info "  3. Monitor logs: ssh $ServerUser@$ServerIP 'docker logs -f mediahub'"
    Write-Host "==========================================`n"
}
else {
    Write-Error "Deployment failed with exit code: $deployExitCode"
    Write-Info "Check the deployment log above for details"
    Write-Info "To view full logs: ssh $ServerUser@$ServerIP 'cat /root/deploy_log.txt'"
    exit 1
}
