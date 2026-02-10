"use client";

import { usePathname } from "next/navigation";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // LISTA NEGRA: Rotas onde o menu NÃO deve aparecer
  // Adicionei "/entrar" e "/login" para garantir que o menu suma na tela de acesso
  if (pathname === "/" || pathname === "/entrar" || pathname === "/login" || pathname === "/cadastro") {
    return null;
  }

  return <>{children}</>;
}