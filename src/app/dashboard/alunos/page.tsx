import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Dumbbell, ArrowRight } from "lucide-react";

export default async function AlunosPage() {
  const supabase = await createClient();
  
  // 1. Verifica quem está logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/entrar");

  // 2. Busca os dados do Treinador (para pegar o tenant_id dele)
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!coachProfile || coachProfile.role !== 'coach') {
    return <div className="text-white p-10">Acesso restrito a treinadores.</div>;
  }

  // 3. A QUERY MÁGICA (Correção do Isolamento)
  // Busca apenas perfis que:
  // - Têm o mesmo tenant_id do coach
  // - NÃO são coaches (role != 'coach')
  const { data: athletes } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', coachProfile.tenant_id) // Filtra pelo time
    .neq('role', 'coach') // Exclui o próprio treinador da lista
    .order('full_name', { ascending: true });

  return (
    <div className="min-h-screen bg-black text-white p-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <UsersIcon /> GERENCIAR ATLETAS
            </h1>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">
              Total: {athletes?.length || 0} ativos
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 text-zinc-600" size={18} />
                <input 
                  placeholder="Buscar atleta..." 
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 text-white text-sm font-bold focus:border-lime-500 outline-none transition-colors"
                />
             </div>
             <Link href="/dashboard/alunos/novo" className="bg-lime-500 hover:bg-lime-400 text-black px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)]">
                <Plus size={18}/> Novo Atleta
             </Link>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {athletes?.map((athlete: any) => {
            // Lógica de Tradução Visual (Garante Português na tela)
            let displayGender = athlete.gender || 'N/A';
            if (displayGender.toLowerCase() === 'male') displayGender = 'Masculino';
            if (displayGender.toLowerCase() === 'female') displayGender = 'Feminino';

            return (
                <Link key={athlete.id} href={`/dashboard/alunos/${athlete.id}`}>
                  <div className="group bg-zinc-900/40 border border-zinc-800 hover:border-lime-500/50 p-6 rounded-2xl transition-all hover:bg-zinc-900/80 cursor-pointer relative overflow-hidden">
                     
                     <div className="flex items-center gap-4">
                        {/* Avatar / Inicial */}
                        <div className="h-14 w-14 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-lime-500 font-black text-xl group-hover:scale-110 transition-transform shadow-lg">
                            {athlete.full_name ? athlete.full_name[0].toUpperCase() : '?'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg truncate group-hover:text-lime-500 transition-colors capitalize">
                              {athlete.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {athlete.selected_goal && (
                                 <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                   {athlete.selected_goal}
                                 </span>
                              )}
                              {/* Exibe o gênero traduzido */}
                              <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                {displayGender}
                              </span>
                            </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-lime-500">
                            <ArrowRight size={24} />
                        </div>
                     </div>
                  </div>
                </Link>
            );
          })}

          {athletes?.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                <Dumbbell className="mx-auto text-zinc-800 mb-4" size={48} />
                <h3 className="text-zinc-500 font-bold text-lg uppercase">Nenhum atleta encontrado</h3>
                <p className="text-zinc-600 text-sm">Cadastre seu primeiro aluno para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )
}