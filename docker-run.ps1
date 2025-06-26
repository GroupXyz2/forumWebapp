# Build and run the Docker container
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
    forum-webapp

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
