# SSL Configuration Guide

This document provides detailed information on configuring and using SSL in this application.

## SSL in Development

### Method 1: Using mkcert (Recommended)

[mkcert](https://github.com/FiloSottile/mkcert) is a tool that makes locally-trusted development certificates with zero configuration.

#### Installation

**Windows (PowerShell with Chocolatey):**
```powershell
choco install mkcert
```

**macOS (with Homebrew):**
```bash
brew install mkcert
brew install nss  # if you use Firefox
```

**Linux:**
```bash
sudo apt install libnss3-tools
# Then download mkcert from https://github.com/FiloSottile/mkcert/releases
```

#### Generate Certificates

1. Set up the local Certificate Authority:
```bash
mkcert -install
```

2. Generate certificates for localhost:
```bash
# From the project root directory
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1
```

#### Configure Environment

Update your `.env.local` file:
```
USE_SSL=true
SSL_KEY_FILE=./certificates/localhost-key.pem
SSL_CERT_FILE=./certificates/localhost.pem
NEXTAUTH_URL=https://localhost:3000
PORT=3000  # Make sure this matches the port in NEXTAUTH_URL
```

Note: SSL is handled by our custom server.js file which reads these environment variables.

### Method 2: OpenSSL (Alternative)

If you prefer using OpenSSL directly:

```bash
# Generate a private key
openssl genrsa -out certificates/localhost-key.pem 2048

# Generate a certificate signing request
openssl req -new -key certificates/localhost-key.pem -out certificates/localhost.csr -subj "/CN=localhost"

# Generate a self-signed certificate
openssl x509 -req -in certificates/localhost.csr -signkey certificates/localhost-key.pem -out certificates/localhost.pem -days 365
```

## SSL in Production

For production environments, you have several options:

### Option 1: Let your hosting service handle it

If you deploy on platforms like Vercel, Netlify, or Heroku, they automatically handle SSL certificates and HTTPS for you. In this case, you don't need to manually configure SSL.

### Option 2: Use Let's Encrypt

For self-hosted environments, [Let's Encrypt](https://letsencrypt.org/) provides free SSL certificates:

1. Install Certbot: Follow the instructions at [certbot.eff.org](https://certbot.eff.org/)
2. Generate certificates:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```
3. Update your `.env.local` with the paths to the generated certificates:
   ```
   USE_SSL=true
   SSL_KEY_FILE=/etc/letsencrypt/live/yourdomain.com/privkey.pem
   SSL_CERT_FILE=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
   NEXTAUTH_URL=https://yourdomain.com
   ```

### Option 3: Use existing certificates

If you already have SSL certificates, simply update the paths in your `.env.local` file:

```
USE_SSL=true
SSL_KEY_FILE=/path/to/your/private_key.pem
SSL_CERT_FILE=/path/to/your/certificate.pem
NEXTAUTH_URL=https://yourdomain.com
```

## Troubleshooting

### Certificate Trust Issues

If your browser doesn't trust the certificates:

1. For mkcert: Run `mkcert -install` again
2. For self-signed certificates: Add a security exception in your browser

### CORS Issues

When using different domains, update your CORS settings in your application code.

### Cookie Issues

If you're experiencing cookie-related issues:

1. Ensure `NEXTAUTH_URL` matches your actual domain with the correct protocol (https)
2. Check that cookies have the `secure` flag set when using HTTPS

## Starting the Custom Server with SSL

Once you have your certificates in place and your `.env.local` file configured, you can start the custom server with SSL support using the following steps:

### 1. Update your .env.local file

Make sure your `.env.local` file has the following settings:

```
# SSL Configuration
USE_SSL=true
SSL_KEY_FILE=./certificates/localhost-key.pem
SSL_CERT_FILE=./certificates/localhost.pem

# NextAuth Configuration - Update protocol to https
NEXTAUTH_URL=https://localhost:3456

# Server Configuration
NODE_ENV=development
HOST=localhost
PORT=3456
```

### 2. Start the server in development mode

Run the following command to start the development server with SSL:

```bash
npm run dev:ssl
```

### 3. Start the server in production mode

After building your application with `npm run build`, start the production server with SSL:

```bash
npm run start:ssl
# On Windows, you may need to use:
# set NODE_ENV=production && node server.js
```

### 4. Verify the server is running with SSL

Open your browser and navigate to `https://localhost:3456` (or whatever port you specified). You should see the padlock icon in your browser indicating a secure connection.

If you encounter a certificate warning, this is expected with self-signed certificates in development. You can add a security exception in your browser.
