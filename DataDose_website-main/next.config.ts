import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint errors won't block a Vercel production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors won't block a Vercel production build
    ignoreBuildErrors: true,
  },
    ignoreDuringBuilds: true,
  }
;

export default nextConfig;
