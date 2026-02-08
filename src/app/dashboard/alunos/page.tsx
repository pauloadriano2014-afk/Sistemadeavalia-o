import { createClient } from "@/lib/supabase-server";
import { Plus, Search, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AlunosListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // 1. Buscar Perfil do Coach
  const { data: coach } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!coach?.tenant_id) return <div>Erro: Coach sem time.</div>;

  // 2. Buscar Alunos do Time
  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('tenant_id', coach.tenant_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Meus Alunos</h1>
          <p className="text-slate-400">Gerencie os atletas do seu time.</p>
        </div>
        <Link href="/dashboard/alunos/novo">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Plus size={20} /> Novo Aluno
          </button>
        </Link>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {students && students.length > 0 ? (
          students.map((student) => (
            <Link 
              key={student.id} 
              href={`/dashboard/alunos/${student.id}`}
              className="group bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-blue-600 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {student.full_name?.[0] || <User size={20}/>}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{student.full_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold">
                    <span>{student.gender === 'male' ? 'Masculino' : 'Feminino'}</span>
                    <span>•</span>
                    <span className="text-blue-400">{student.selected_goal?.replace('_', ' ') || 'Geral'}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
            </Link>
          ))
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
            <User className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white">Nenhum aluno ainda</h3>
            <p className="text-slate-500 mb-6">Comece cadastrando seu primeiro atleta.</p>
            <Link href="/dashboard/alunos/novo">
              <button className="text-blue-400 hover:text-white underline">Cadastrar agora</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}