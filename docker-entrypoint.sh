#!/bin/sh
# This script sets up the MongoDB connection and starts the app

# Try to find the host IP
echo "Setting up MongoDB connection..."

# Check if we have a mounted .env.local with MongoDB settings
if grep -q "MONGODB_URI" /app/.env.local 2>/dev/null; then
  echo "Found MongoDB settings in mounted .env.local"
else
  echo "No MongoDB settings found in .env.local, attempting to configure automatically"
  
  # Check if we're running in Docker Compose with MongoDB service
  if ping -c 1 mongodb >/dev/null 2>&1; then
    echo "Detected MongoDB service in Docker Compose network"
    echo "MONGODB_URI=mongodb://mongodb:27017/forum" > .env.local.temp
  else
    # Try to connect to host.docker.internal 
    echo "Trying to connect to host machine MongoDB"
    
    # Try different methods to get the host IP
    if ping -c 1 host.docker.internal >/dev/null 2>&1; then
      echo "host.docker.internal DNS resolved successfully"
      HOST_IP="host.docker.internal"
    else
      echo "host.docker.internal not resolvable, getting gateway IP"
      HOST_IP=$(ip route | grep default | cut -d ' ' -f 3)
      echo "Using gateway IP: ${HOST_IP}"
    fi
    
    echo "Using host IP: ${HOST_IP} for MongoDB connection"
    echo "MONGODB_URI=mongodb://${HOST_IP}:27017/forum" > .env.local.temp
  fi
  
  # Add other settings
  echo "MONGODB_DB=forum" >> .env.local.temp
  echo "USE_SSL=false" >> .env.local.temp
  echo "PORT=3456" >> .env.local.temp
  echo "HOST=0.0.0.0" >> .env.local.temp
  
  # Only create .env.local if it doesn't exist
  if [ ! -f /app/.env.local ]; then
    cp .env.local.temp .env.local
  fi
fi

echo "Current environment:"
cat .env.local

# Start the application
echo "Starting the application..."
npm run dev:ssl
