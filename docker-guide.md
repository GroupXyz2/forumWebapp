# Docker Guide: Running the Forum Webapp with SSL

This guide explains how to build and run your Next.js forum webapp in a Docker container with SSL support, using an external `.env.local` and certificate directory for easy configuration.

---

## 1. Build the Docker Image

From your project root, run:

```sh
docker build -t forum-webapp .
```

---

## 2. Prepare Your Environment

- Ensure you have a valid `.env.local` file in your project root (not inside the container).
- Ensure your SSL certificates are in the `certificates` directory in your project root.

---

## 3. Run the Container

### Windows (PowerShell)

```powershell
docker run -it --rm `
  -p 3456:3456 `
  -v "$PWD\.env.local:/app/.env.local" `
  -v "$PWD\certificates:/app/certificates" `
  forum-webapp
```

Or as a single line:

```powershell
docker run -it --rm -p 3456:3456 -v "$PWD\.env.local:/app/.env.local" -v "$PWD\certificates:/app/certificates" forum-webapp
```

---

### Linux/macOS (bash/zsh)

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

## 5. Notes

- Any changes to `.env.local` or certificates on your host are reflected in the container immediately.
- If you change the port in `.env.local`, update the `-p` flag accordingly.
- For production, use production-grade SSL certificates and secure your environment variables.
- You can use this setup for local development or as a base for production deployments.

---

Need a `docker-compose.yml`? Just ask!
