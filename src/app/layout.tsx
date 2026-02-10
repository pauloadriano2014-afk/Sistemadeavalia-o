import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import Navbar from "@/components/Navbar"; 
import NavbarWrapper from "@/components/NavbarWrapper"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fitness SaaS",
  description: "Sistema de Avaliação Física de Alta Performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* MUDANÇA: bg-black text-white (Fim do Slate/Azul) */}
      <body className={`${inter.className} bg-black text-white antialiased selection:bg-lime-500 selection:text-black`}>
        
        <NavbarWrapper>
            <Navbar />
        </NavbarWrapper>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}