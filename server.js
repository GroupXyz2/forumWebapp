const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const dotenvPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), '.env');
require('dotenv').config({ path: dotenvPath });
console.log('Loaded dotenv file:', dotenvPath);
console.log('Loaded environment variables:', Object.entries(process.env).filter(([k]) => k.startsWith('USE_SSL') || k.startsWith('SSL_') || k.startsWith('NODE_ENV') || k.startsWith('PORT') || k.startsWith('HOST')));

// Read environment variables
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const useSSL = process.env.USE_SSL === 'true';
console.log(`Using SSL: ${useSSL}`);
const sslKeyFile = process.env.SSL_KEY_FILE || './localhost-key.pem';
const sslCertFile = process.env.SSL_CERT_FILE || './localhost.pem';

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  let server;

  if (useSSL) {
    try {
      // Read SSL certificate files
      const sslOptions = {
        key: fs.readFileSync(path.resolve(process.cwd(), sslKeyFile)),
        cert: fs.readFileSync(path.resolve(process.cwd(), sslCertFile)),
      };
      console.log('🔒 Starting HTTPS server with SSL');
      server = createHttpsServer(sslOptions, handleRequest);
    } catch (error) {
      console.error('Error loading SSL certificates:', error);
      console.log('⚠️ Falling back to HTTP server');
      server = createServer(handleRequest);
    }
  } else {
    console.log('Starting HTTP server without SSL');
    server = createServer(handleRequest);
  }

  function handleRequest(req, res) {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on ${useSSL ? 'https' : 'http'}://${hostname}:${port}`);
  });
});
