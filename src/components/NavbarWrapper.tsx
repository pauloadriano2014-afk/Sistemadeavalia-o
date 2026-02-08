"use client";

import { usePathname } from "next/navigation";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // LISTA NEGRA: Rotas onde o menu NÃO deve aparecer
  if (pathname === "/" || pathname === "/cadastro") {
    return null;
  }

  return <>{children}</>;
}