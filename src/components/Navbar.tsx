import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Dumbbell, LogOut, User } from "lucide-react";
import SignOutButton from "./SignOutButton"; // Vamos criar jajá

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
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LOGO */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-blue-500 font-bold text-xl hover:opacity-80 transition-opacity">
              <Dumbbell size={24} />
              <span>Fitness SaaS</span>
            </Link>

            {/* MENUS DO COACH */}
            {profile.role === 'coach' && (
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard/alunos" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Meus Alunos
                </Link>
                <Link href="/dashboard/avaliacoes" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Avaliações
                </Link>
              </div>
            )}

            {/* MENUS DO ALUNO (Segurança: Aluno só vê isso) */}
            {profile.role === 'student' && (
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Meu Painel
                </Link>
                <Link href={`/dashboard/alunos/${user?.id}`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Meu Histórico
                </Link>
              </div>
            )}
          </div>

          {/* PERFIL E SAIR */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-medium">{profile.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile.role === 'coach' ? 'Treinador' : 'Atleta'}</p>
            </div>
            <form action="/auth/signout" method="post">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Sair">
                    <LogOut size={20} />
                </button>
            </form>
          </div>

        </div>
      </div>
    </nav>
  );
}