import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
// REMOVI AS IMPORTAÇÕES DA NAVBAR AQUI

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoachPro SaaS",
  description: "Sistema de Avaliação Física de Alta Performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-black text-white antialiased selection:bg-brand selection:text-black`}>
        {/* SEM NAVBAR AQUI - Ela agora vive apenas dentro do Dashboard */}
        
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}