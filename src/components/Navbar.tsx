import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Dumbbell, LogOut, Settings } from "lucide-react";

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
        <div className="flex justify-between h-20 items-center"> {/* Aumentei altura da barra */}
          
          {/* LOGO */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 text-lime-500 font-black text-2xl tracking-tighter hover:opacity-80 transition-opacity italic group">
              {profile.logo_url ? (
                 /* eslint-disable-next-line @next/next/no-img-element */
                 <img 
                    src={profile.logo_url} 
                    alt="Logo" 
                    // LOGO MAIOR AQUI: h-10 no mobile, h-14 no desktop
                    className="h-10 md:h-14 w-auto max-w-[150px] object-contain rounded-md transition-transform group-hover:scale-105" 
                 />
              ) : (
                 <Dumbbell size={32} />
              )}
              {/* Texto só aparece se não tiver logo, ou se quiser forçar */}
              <span className={profile.logo_url ? "hidden lg:inline" : ""}>COACH<span className="text-white">PRO</span></span>
            </Link>

            {/* MENUS DO COACH */}
            {profile.role === 'coach' && (
              <div className="hidden md:flex items-center gap-8 ml-4">
                <Link href="/dashboard/alunos" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest hover:border-b-2 hover:border-lime-500 py-1">
                  Atletas
                </Link>
                <Link href="/dashboard/avaliacoes" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest hover:border-b-2 hover:border-lime-500 py-1">
                  Avaliações
                </Link>
                <Link href="/dashboard/config" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest hover:border-b-2 hover:border-lime-500 py-1">
                  <Settings size={14} /> Config
                </Link>
              </div>
            )}
          </div>

          {/* PERFIL E SAIR */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-bold">{profile.full_name}</p>
              <p className="text-[10px] text-lime-500 font-black uppercase tracking-widest">{profile.role === 'coach' ? 'Treinador' : 'Atleta'}</p>
            </div>
            
            <form action="/auth/signout" method="post">
                <button className="p-3 text-zinc-500 hover:text-red-500 hover:bg-zinc-900 rounded-xl transition-colors" title="Sair">
                    <LogOut size={22} />
                </button>
            </form>
          </div>

        </div>
      </div>
    </nav>
  );
}