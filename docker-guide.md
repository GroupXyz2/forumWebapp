# Docker Guide: Running the Forum Webapp with MongoDB Included

This guide explains how to build and run your Next.js forum webapp in a Docker container with MongoDB already included.

> **NEW**: The Dockerfile now includes MongoDB in the same container for simplicity!

---

## 1. Prepare Your Environment

- Ensure you have a valid `.env.local` file in your project root (not inside the container).
- Ensure your SSL certificates are in the `certificates` directory in your project root.

---

## 2. Build the Docker Image

From your project root, run:

```sh
docker build -t forum-webapp .
```

---

## 3. Run the Container

### Windows (PowerShell)

Background mode (recommended):
```powershell
docker run -d --name forum-webapp `
  -p 3456:3456 `
  -v "$PWD\.env.local:/app/.env.local" `
  -v "$PWD\certificates:/app/certificates" `
  forum-webapp
```

Interactive mode with console output:
```powershell
docker run -it --rm `
  -p 3456:3456 `
  -v "$PWD\.env.local:/app/.env.local" `
  -v "$PWD\certificates:/app/certificates" `
  forum-webapp
```

---

### Linux/macOS (bash/zsh)

Background mode (recommended):
```sh
docker run -d --name forum-webapp \
  -p 3456:3456 \
  -v "$(pwd)/.env.local:/app/.env.local" \
  -v "$(pwd)/certificates:/app/certificates" \
  forum-webapp
```

Interactive mode with console output:
```sh
docker run -it --rm \
  -p 3456:3456 \
  -v "$(pwd)/.env.local:/app/.env.local" \
  -v "$(pwd)/certificates:/app/certificates" \
  forum-webapp
```

---

## 4. Access the App

Open your browser and go to:

```
https://localhost:3456
```

---

## 5. Running with MongoDB (Simplified)

The forum webapp now includes MongoDB in the same container! Just run:

### Windows PowerShell (Easiest)

```powershell
.\docker-run-simple.ps1
```

### Manual Docker Commands

```powershell
# Build the image
docker build -t forum-webapp .

# Run the container
docker run -d --name forum-webapp -p 3456:3456 -v "$PWD\certificates:/app/certificates" forum-webapp
```

### Docker Compose

We've also simplified the docker-compose.yml:

```sh
# Start everything in one container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

## 6. What's Included

- MongoDB runs inside the Docker container
- Next.js application runs in development mode
- SSL certificates are mounted from your local directory
- No need for an external MongoDB server

## 6. Notes

- Any changes to `.env.local` or certificates on your host are reflected in the container immediately.
- If you change the port in `.env.local`, update the `-p` flag accordingly.
- For production, use production-grade SSL certificates and secure your environment variables.
- `host.docker.internal` is a special DNS name that resolves to the host IP from inside Docker.

---

## Docker Compose (Easiest Option)

We've included a `docker-compose.yml` that sets up both MongoDB and the forum webapp:

```sh
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

This automatically:
1. Creates a MongoDB container
2. Sets up the correct network between the app and MongoDB 
3. Persists MongoDB data between restarts
4. Mounts your `.env.local` and certificates
