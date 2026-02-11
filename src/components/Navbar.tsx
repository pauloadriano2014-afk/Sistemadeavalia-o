import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Dumbbell, LogOut, Settings } from "lucide-react";
import { signOutAction } from "@/app/auth/actions"; // <--- 1. IMPORTAMOS A AÇÃO

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  if (!profile) return null;

  return (
    <nav className="border-b border-zinc-900 bg-black/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 text-brand font-black text-2xl tracking-tighter hover:opacity-80 transition-opacity italic group">
              {profile.logo_url ? (
                 /* eslint-disable-next-line @next/next/no-img-element */
                 <img 
                   src={profile.logo_url} 
                   alt="Logo" 
                   className="h-10 md:h-14 w-auto max-w-[150px] object-contain rounded-md transition-transform group-hover:scale-105" 
                 />
              ) : (
                 <Dumbbell size={32} />
              )}
              <span className={profile.logo_url ? "hidden lg:inline" : ""}>COACH<span className="text-white">PRO</span></span>
            </Link>

            {/* MENUS DO COACH */}
            {profile.role === 'coach' && (
              <div className="hidden md:flex items-center gap-8 ml-4">
                <Link href="/dashboard/alunos" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest hover:border-b-2 hover:border-brand py-1">
                  Atletas
                </Link>
                <Link href="/dashboard/avaliacoes" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest hover:border-b-2 hover:border-brand py-1">
                  Avaliações
                </Link>
                <Link href="/dashboard/config" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest hover:border-b-2 hover:border-brand py-1">
                  <Settings size={14} /> Config
                </Link>
              </div>
            )}
          </div>

          {/* PERFIL E SAIR */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-bold">{profile.full_name}</p>
              <p className="text-[10px] text-brand font-black uppercase tracking-widest">{profile.role === 'coach' ? 'Treinador' : 'Atleta'}</p>
            </div>
            
            {/* 2. FORMULÁRIO CONECTADO NA AÇÃO (Adeus erro 404!) */}
            <form action={signOutAction}>
                <button type="submit" className="p-3 text-zinc-500 hover:text-red-500 hover:bg-zinc-900 rounded-xl transition-colors" title="Sair do Sistema">
                    <LogOut size={22} />
                </button>
            </form>
          </div>

        </div>
      </div>
    </nav>
  );
}