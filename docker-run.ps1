# Build andWrite-Host "🔧 Building Docker image..." -ForegroundColor Cyan
docker build --no-cache -t forum-webapp . 2>&1 | Tee-Object -Variable buildOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed with standard Dockerfile." -ForegroundColor Red
    
    Write-Host "🔄 Trying simplified Dockerfile that skips build process..." -ForegroundColor Yellow
    Write-Host "Using Dockerfile.simple instead..." -ForegroundColor Yellow
    
    docker build --no-cache -t forum-webapp -f Dockerfile.simple . 2>&1 | Tee-Object -Variable buildOutput
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Both Docker builds failed. Cannot continue." -ForegroundColor Red
        Write-Host "Please check your MongoDB connection and SSL certificates." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ Simplified Docker build successful!" -ForegroundColor Green
        Write-Host "⚠️ Note: Using development mode inside container." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Standard Docker build successful!" -ForegroundColor Green
}e Docker container
# Windows PowerShell script

# Stop script on error
$ErrorActionPreference = "Stop"

# Stop and remove existing container if it exists
Write-Host "� Checking for existing containers..." -ForegroundColor Yellow
docker stop forum-webapp 2>$null
docker rm forum-webapp 2>$null

Write-Host "�🔧 Building Docker image..." -ForegroundColor Cyan
docker build --no-cache -t forum-webapp .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host "🚀 Starting the container..." -ForegroundColor Cyan

# Run in the background with port mapping and mounted volumes
docker run -d `
    --name forum-webapp `
    -p 3456:3456 `
    -v "$PWD\.env.local:/app/.env.local" `
    -v "$PWD\certificates:/app/certificates" `
    forum-webapp:latest

Write-Host "✨ Container started! Access the application at:" -ForegroundColor Green
Write-Host "🔒 https://localhost:3456" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Container logs:" -ForegroundColor Cyan
Write-Host "docker logs forum-webapp -f"
Write-Host ""
Write-Host "🛑 To stop the container:" -ForegroundColor Cyan
Write-Host "docker stop forum-webapp"
Write-Host ""
Write-Host "🗑️ To remove the container:" -ForegroundColor Cyan
Write-Host "docker rm forum-webapp"
