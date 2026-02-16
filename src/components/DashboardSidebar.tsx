"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ClipboardList, Settings, LogOut, Dumbbell } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { ThemeSwitcher } from "@/components/theme-switcher";

const menuItems = [
  // MUDANÇA 1: De "Atletas" para "Alunos"
  { label: "Alunos", href: "/dashboard/alunos", icon: Users },
  { label: "Avaliações", href: "/dashboard/avaliacoes", icon: ClipboardList },
  { label: "Config", href: "/dashboard/config", icon: Settings },
];

interface SidebarProps {
  logoUrl?: string | null;
}

export function DashboardSidebar({ logoUrl }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col z-20 hidden md:flex">
      
      {/* MUDANÇA 2: Área da Logo Aumentada */}
      <div className="py-8 flex items-center justify-center border-b border-zinc-900 min-h-[140px]">
        <Link href="/dashboard" className="group w-full flex justify-center px-4">
            
            {logoUrl ? (
                 /* AQUI ESTÁ O AJUSTE DE TAMANHO: w-48 (192px) */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-48 h-auto object-contain transition-transform group-hover:scale-105 drop-shadow-2xl"
                />
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-zinc-900 rounded-2xl text-brand group-hover:text-white transition-colors border border-zinc-800 shadow-[0_0_20px_rgb(var(--brand-rgb)/0.2)]">
                        <Dumbbell size={32} />
                    </div>
                    <span className="text-2xl font-black text-white italic tracking-tighter">
                        COACH<span className="text-brand">PRO</span>
                    </span>
                </div>
            )}

        </Link>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-xs tracking-widest ${
                isActive 
                  ? "bg-brand text-black shadow-[0_0_15px_rgb(var(--brand-rgb)/0.4)]" 
                  : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-6">
          <p className="px-4 text-[10px] font-black text-zinc-600 uppercase mb-2 tracking-widest opacity-50">Personalizar</p>
          <ThemeSwitcher />
      </div>

      <div className="p-4 border-t border-zinc-900">
        <form action={signOutAction}>
            <button 
                type="submit" 
                className="flex items-center justify-center gap-3 px-4 py-4 text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all w-full font-black uppercase text-xs tracking-widest border border-transparent hover:border-red-500/20"
            >
                <LogOut size={18} />
                Sair
            </button>
        </form>
      </div>
    </aside>
  );
}