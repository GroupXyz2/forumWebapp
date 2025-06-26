#!/bin/sh
# Run MongoDB and webapp in development mode

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "MongoDB is not installed. Please install MongoDB first."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data/db

# Start MongoDB in background
echo "Starting MongoDB..."
mongod --dbpath=./data/db --bind_ip 0.0.0.0 &
MONGO_PID=$!

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
sleep 5

# Start the webapp
echo "Starting webapp..."
npm run dev:ssl

# Cleanup function
cleanup() {
    echo "Stopping MongoDB..."
    kill $MONGO_PID
    exit 0
}

# Register the cleanup function on SIGINT
trap cleanup SIGINT

# Wait for both processes
wait
