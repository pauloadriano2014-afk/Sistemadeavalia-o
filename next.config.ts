import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Mantemos o limite de upload alto por segurança
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // 2. AQUI ESTÁ A CORREÇÃO: Permitir imagens do Supabase
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

// Atualização forçada para limpar cache de build da Vercel
export default nextConfig;