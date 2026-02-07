import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Aumentamos o limite para 10 MegaBytes
    },
  },
};

export default nextConfig;