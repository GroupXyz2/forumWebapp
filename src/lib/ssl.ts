/**
 * SSL Configuration Utility
 * 
 * This module provides utilities to check and handle SSL configuration
 * based on environment variables.
 */

/**
 * Checks if SSL is enabled based on environment variables
 */
export function isSSLEnabled(): boolean {
  return process.env.USE_SSL === 'true';
}

/**
 * Gets the protocol (http or https) based on SSL configuration
 */
export function getProtocol(): string {
  return isSSLEnabled() ? 'https' : 'http';
}

/**
 * Gets the base URL for the application including protocol
 */
export function getBaseUrl(): string {
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || '3000';
  const protocol = getProtocol();
  
  // In production, you might want to just return the domain without port
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    // Vercel automatically sets up SSL
    return `https://${host}`;
  }
  
  return `${protocol}://${host}:${port}`;
}

/**
 * Gets SSL certificate paths for server configuration
 */
export function getSSLPaths(): { keyPath: string; certPath: string } {
  return {
    keyPath: process.env.SSL_KEY_FILE || './certificates/localhost-key.pem',
    certPath: process.env.SSL_CERT_FILE || './certificates/localhost.pem',
  };
}
