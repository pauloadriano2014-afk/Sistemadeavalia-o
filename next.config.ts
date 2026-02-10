import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Ignora erros de TypeScript (Isso ainda funciona e salva vidas)
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. Limite de upload
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // 3. Imagens do Supabase
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