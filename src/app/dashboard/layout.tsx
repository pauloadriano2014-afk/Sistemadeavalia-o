import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Barra de Navegação Superior */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-500">
                Fitness SaaS
              </Link>
              <div className="hidden md:flex gap-4">
                <Link href="/dashboard/alunos" className="text-slate-300 hover:text-white text-sm font-medium">
                  Meus Alunos
                </Link>
                <Link href="/dashboard/avaliacoes" className="text-slate-300 hover:text-white text-sm font-medium">
                  Avaliações
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 hidden sm:block">
                {user.email}
              </span>
              <form action="/auth/signout" method="post">
                <button className="text-sm bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded border border-slate-700 transition-colors">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}