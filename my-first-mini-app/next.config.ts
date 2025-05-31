// next.config.ts  (or .js / .mjs – whatever you’re using)

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },

  allowedDevOrigins: ['*'],
  reactStrictMode: false,

  eslint: {
    ignoreDuringBuilds: true, 
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
};

export default nextConfig;
