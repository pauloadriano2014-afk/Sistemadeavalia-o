import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import Navbar from "@/components/Navbar"; 
import NavbarWrapper from "@/components/NavbarWrapper"; // <--- Importe o Wrapper

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
      <body className={inter.className + " bg-slate-950 text-slate-200"}>
        
        {/* O Wrapper decide se mostra ou não o Navbar */}
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