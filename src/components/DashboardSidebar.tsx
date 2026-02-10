"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ClipboardList, Settings, LogOut, Dumbbell } from "lucide-react";
import { signOutAction } from "@/app/auth/actions"; // Importamos a ação aqui

const menuItems = [
  { label: "Atletas", href: "/dashboard/alunos", icon: Users },
  { label: "Avaliações", href: "/dashboard/avaliacoes", icon: ClipboardList },
  { label: "Config", href: "/dashboard/config", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col z-20 hidden md:flex">
      {/* LOGO */}
      <div className="p-8 flex items-center justify-center border-b border-zinc-900">
        <Link href="/dashboard" className="group">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-zinc-900 rounded-xl text-lime-500 group-hover:text-white transition-colors border border-zinc-800">
                    <Dumbbell size={24} />
                </div>
                <span className="text-xl font-black text-white italic tracking-tighter">
                    COACH<span className="text-lime-500">PRO</span>
                </span>
            </div>
        </Link>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-xs tracking-widest ${
                isActive 
                  ? "bg-lime-500 text-black shadow-[0_0_15px_rgba(132,204,22,0.4)]" 
                  : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* BOTÃO DE SAIR (FUNCIONANDO) */}
      <div className="p-4 border-t border-zinc-900">
        <form action={signOutAction}>
            <button 
                type="submit" 
                className="flex items-center justify-center gap-3 px-4 py-4 text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all w-full font-black uppercase text-xs tracking-widest border border-transparent hover:border-red-500/20"
            >
                <LogOut size={18} />
                Sair do Sistema
            </button>
        </form>
      </div>
    </aside>
  );
}