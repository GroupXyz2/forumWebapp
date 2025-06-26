import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['cdn.discordapp.com']
  },
  // Ensure the uploads directory is included in the build
  // This is important for user-uploaded images
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    return config;
  },
  // Configure server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb' // Increase the limit to 10MB for branding image uploads
    }
  },
  // Disable development mode indicators like the "Fast Refresh" panel
  // Read from environment variable or default to showing in development
  devIndicators: process.env.DISABLE_DEV_TOOLS === 'true' ? false : {
    position: 'bottom-left'
  }
};

export default nextConfig;
