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
  }
};

export default nextConfig;
