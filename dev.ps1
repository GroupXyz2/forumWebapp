# Run MongoDB and forum webapp in development mode
# PowerShell script for Windows

# Check if MongoDB is installed
$mongoInstalled = $null -ne (Get-Command mongod -ErrorAction SilentlyContinue)
if (-not $mongoInstalled) {
    Write-Host "❌ MongoDB is not installed. Please install MongoDB first." -ForegroundColor Red
    Write-Host "Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    exit 1
}

# Create data directory if it doesn't exist
if (-not (Test-Path -Path ".\data\db")) {
    New-Item -ItemType Directory -Path ".\data\db" -Force
}

# Start MongoDB in background
Write-Host "🔄 Starting MongoDB..." -ForegroundColor Cyan
Start-Process -FilePath "mongod" -ArgumentList "--dbpath=./data/db", "--bind_ip", "0.0.0.0" -NoNewWindow

# Wait for MongoDB to start
Write-Host "⏳ Waiting for MongoDB to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if MongoDB is running
try {
    $null = New-Object System.Net.Sockets.TcpClient("localhost", 27017)
    Write-Host "✅ MongoDB started successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to connect to MongoDB. Please check if it's running." -ForegroundColor Red
    exit 1
}

# Ensure we have a .env.local file with MongoDB settings
if (-not (Test-Path -Path ".\.env.local")) {
    Write-Host "📄 Creating .env.local file with MongoDB settings..." -ForegroundColor Cyan
    @"
MONGODB_URI=mongodb://localhost:27017/forum
MONGODB_DB=forum
USE_SSL=true
PORT=3456
HOST=localhost
"@ | Out-File -FilePath ".\.env.local" -Encoding utf8
}

# Start the webapp
Write-Host "🚀 Starting webapp..." -ForegroundColor Cyan
npm run dev:ssl

# MongoDB will be terminated when PowerShell session ends
