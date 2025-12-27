# ==========================================
# MediaHub Deployment Verification Script
# ==========================================

param(
    [string]$BaseUrl = "https://media.broikiservices.com"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================="
Write-Host "MediaHub Deployment Verification"
Write-Host "==========================================" -ForegroundColor Cyan

# Read local version
$LocalProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$packageJsonPath = Join-Path $LocalProjectPath "package.json"
$packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
$localVersion = $packageJson.version

Write-Host "Local version: $localVersion" -ForegroundColor Yellow

# Check remote version
Write-Host ""
Write-Host "Checking deployed version..."
try {
    $versionResponse = Invoke-WebRequest -Uri "$BaseUrl/api/version" -UseBasicParsing
    $versionData = $versionResponse.Content | ConvertFrom-Json
    $remoteVersion = $versionData.version
    $buildTime = $versionData.buildTime
    
    Write-Host "Remote version: $remoteVersion" -ForegroundColor Cyan
    Write-Host "Build time: $buildTime" -ForegroundColor Cyan
    
    if ($remoteVersion -eq $localVersion) {
        Write-Host ""
        Write-Host "VERSION MATCH: Deployment successful!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "VERSION MISMATCH: Local=$localVersion, Remote=$remoteVersion" -ForegroundColor Red
        Write-Host "  Deployment may have failed or cache needs clearing" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "Failed to check remote version: $_" -ForegroundColor Red
    exit 1
}

# Check cache headers
Write-Host ""
Write-Host "Checking cache headers..."
try {
    $headResponse = Invoke-WebRequest -Uri "$BaseUrl/" -Method HEAD -UseBasicParsing
    $headers = $headResponse.Headers
    
    $cacheControl = $headers["Cache-Control"]
    if ($cacheControl -match "no-cache|no-store") {
        Write-Host "index.html has proper no-cache headers" -ForegroundColor Green
    }
    
    if ($headers["Server"] -match "cloudflare") {
        Write-Host "Site is behind Cloudflare - purge cache if changes not visible" -ForegroundColor Gray
    }
}
catch {
    Write-Host "Could not check headers: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Verification Complete!"
Write-Host "=========================================="
Write-Host ""
