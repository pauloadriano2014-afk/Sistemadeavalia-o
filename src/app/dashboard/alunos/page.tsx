import { createClient } from "@/lib/supabase-server";
import { UserPlus, Search, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AlunosPage() {
  const supabase = await createClient();

  // 1. Verificar Autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  // 2. Buscar o perfil do Coach
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single();

  if (!coachProfile?.tenant_id) {
    return (
      <div className="p-8 text-white">
        Erro: Você precisa ter um Time configurado.
      </div>
    );
  }

  // 3. Buscar TODOS os alunos deste time
  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', coachProfile.tenant_id)
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Alunos</h1>
          <p className="text-slate-400 mt-1">
            Visualização completa dos atletas do time <span className="text-blue-400 font-semibold">{coachProfile.full_name || 'Coach'}</span>.
          </p>
        </div>
        
        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Campo de Busca */}
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-600 transition-all"
            />
          </div>
          
          {/* BOTÃO AZUL OFICIAL */}
          <Link 
            href="/dashboard/alunos/novo"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20 cursor-pointer"
          >
            <UserPlus size={20} />
            <span>Novo Aluno</span>
          </Link>
        </div>
      </div>

      {/* --- LISTAGEM (TABELA COMPLETA) --- */}
      {students && students.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-5">Atleta</th>
                  <th className="px-6 py-5 hidden md:table-cell">Objetivo</th>
                  <th className="px-6 py-5 hidden sm:table-cell">Entrou em</th>
                  <th className="px-6 py-5 hidden lg:table-cell">Status</th>
                  <th className="px-6 py-5 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      {/* --- LINK PARA DETALHES DO ALUNO (Aqui está a mudança) --- */}
                      <Link href={`/dashboard/alunos/${student.id}`} className="block cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-blue-500 font-bold shadow-sm group-hover:border-blue-500 transition-colors">
                            {student.full_name?.[0]?.toUpperCase() || student.email[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {student.full_name || 'Sem nome'}
                            </p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                        {student.selected_goal?.replace('_', ' ') || 'Geral'}
                      </span>
                    </td>

                    <td className="px-6 py-4 hidden sm:table-cell text-slate-400 text-sm">
                      {new Date(student.created_at).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-emerald-400 text-xs font-bold uppercase">Ativo</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-950/30 px-6 py-4 border-t border-slate-800 text-sm text-slate-500">
            Total de {students.length} atletas
          </div>
        </div>
      ) : (
        /* --- ESTADO VAZIO --- */
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-600 border border-slate-800">
            <UserPlus size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Nenhum atleta encontrado</h3>
          <p className="text-slate-400 mb-8">Seu time está vazio.</p>
          
          <Link 
            href="/dashboard/alunos/novo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105"
          >
            Adicionar Primeiro Aluno
          </Link>
        </div>
      )}
    </div>
  );
}