import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  allowedDevOrigins: ['*'], // Add your dev origin here

  eslint: {
    ignoreDuringBuilds: true, 
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
  reactStrictMode: false,
};

export default nextConfig;
