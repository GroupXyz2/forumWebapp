# Docker run with MongoDB host connection
# PowerShell script for Windows

# Stop script on error
$ErrorActionPreference = "Stop"

# Check if MongoDB is running on local machine
$mongoRunning = $false
try {
    $mongoStatus = Get-Process mongod -ErrorAction SilentlyContinue
    if ($mongoStatus) {
        $mongoRunning = $true
        Write-Host "✅ MongoDB is running on host machine." -ForegroundColor Green
    }
} catch {
    $mongoRunning = $false
}

if (-not $mongoRunning) {
    Write-Host "⚠️ MongoDB does not appear to be running on your host machine." -ForegroundColor Yellow
    Write-Host "Please start MongoDB before continuing or use docker-compose instead." -ForegroundColor Yellow
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Stop and remove existing container if it exists
Write-Host "🛑 Checking for existing containers..." -ForegroundColor Yellow
docker stop forum-webapp 2>$null
docker rm forum-webapp 2>$null

Write-Host "🔧 Building Docker image..." -ForegroundColor Cyan
docker build -t forum-webapp .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host "🚀 Starting the container..." -ForegroundColor Cyan

# Make MongoDB accessible from Docker
Write-Host "🔄 Using host.docker.internal for MongoDB connection" -ForegroundColor Cyan

# Run in the background with port mapping and mounted volumes
docker run -d `
    --name forum-webapp `
    -p 3456:3456 `
    -v "$PWD\.env.local:/app/.env.local" `
    -v "$PWD\certificates:/app/certificates" `
    --add-host=host.docker.internal:host-gateway `
    forum-webapp

Write-Host "✨ Container started! Access the application at:" -ForegroundColor Green
Write-Host "🔒 https://localhost:3456" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Container logs:" -ForegroundColor Cyan
Write-Host "docker logs -f forum-webapp"
Write-Host ""
Write-Host "🛑 To stop the container:" -ForegroundColor Cyan
Write-Host "docker stop forum-webapp"
Write-Host ""
Write-Host "🗑️ To remove the container:" -ForegroundColor Cyan
Write-Host "docker rm forum-webapp"
