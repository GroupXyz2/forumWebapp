# SSL Certificates for Local Development

This directory is where you should place your SSL certificates for local HTTPS development.

## Using mkcert (Recommended)

[mkcert](https://github.com/FiloSottile/mkcert) is a simple tool for creating locally-trusted development certificates.

### Installation

#### Windows
```powershell
choco install mkcert
```

#### macOS
```bash
brew install mkcert
brew install nss # if you use Firefox
```

#### Linux
```bash
sudo apt install libnss3-tools
# Download mkcert binary from https://github.com/FiloSottile/mkcert/releases
```

### Creating certificates

1. Create a local Certificate Authority (CA):
```bash
mkcert -install
```

2. Generate certificates for localhost:
```bash
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
```

3. Move the generated files to this directory:
```bash
# From the project root
mv localhost-key.pem localhost.pem certificates/
```

## Manual Configuration

If you're using your own certificates, name them as follows:
- Private key: `localhost-key.pem`
- Certificate: `localhost.pem`

Or update the paths in your `.env.local` file:
```
SSL_KEY_FILE=./path/to/your/key.pem
SSL_CERT_FILE=./path/to/your/cert.pem
```
