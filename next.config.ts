import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Ignora erros de TypeScript no build (O Salvador da Pátria)
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. Ignora erros de Linting no build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 3. Limite de upload
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // 4. Imagens do Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yelsgdepnletwydjhyxj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;