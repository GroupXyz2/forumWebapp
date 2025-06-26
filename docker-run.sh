#!/bin/bash
# Build and run the Docker container
# Bash script for Linux/macOS

set -e # Stop on error

echo "🔧 Building Docker image..."
docker build -t forum-webapp .

echo "✅ Build successful!"
echo "🚀 Starting the container..."

# Run in the background with port mapping and mounted volumes
docker run -d \
    --name forum-webapp \
    -p 3456:3456 \
    -v "$(pwd)/.env.local:/app/.env.local" \
    -v "$(pwd)/certificates:/app/certificates" \
    forum-webapp

echo "✨ Container started! Access the application at:"
echo "🔒 https://localhost:3456"
echo ""
echo "📋 Container logs:"
echo "docker logs forum-webapp -f"
echo ""
echo "🛑 To stop the container:"
echo "docker stop forum-webapp"
echo ""
echo "🗑️ To remove the container:"
echo "docker rm forum-webapp"
