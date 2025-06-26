// next.config.docker.js
// Special configuration for Docker builds that ignores TypeScript errors

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.discordapp.com']
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Prevent building API routes during build process to avoid DB connection issues
  output: process.env.NEXT_PHASE === 'phase-production-build' ? 'export' : undefined,
  // Skip all API routes during build to avoid DB connection issues
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    instrumentationHook: false,
  },
  devIndicators: false
};

module.exports = nextConfig;
