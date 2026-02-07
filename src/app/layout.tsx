import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- O SEGREDO ESTÁ AQUI!

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fitness SaaS",
  description: "Sistema de Avaliação Física",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}