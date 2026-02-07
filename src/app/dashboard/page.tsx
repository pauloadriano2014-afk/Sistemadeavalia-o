import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ClipboardList, Plus, ArrowRight, Activity } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // 1. Verificar Autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // 2. Buscar Perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return <div>Erro ao carregar perfil.</div>;

  // 3. Buscar DADOS REAIS para o Coach
  let totalStudents = 0;
  let pendingCheckins = 0; // Nova variável para contagem
  let recentStudents: any[] = [];

  if (profile.role === 'coach' && profile.tenant_id) {
    // A. Contar alunos
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('tenant_id', profile.tenant_id);
    
    totalStudents = studentCount || 0;

    // B. Contar Avaliações (Check-ins)
    const { count: checkinCount } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id);
      // Futuramente podemos adicionar .eq('status', 'pending') aqui
    
    pendingCheckins = checkinCount || 0;

    // C. Buscar últimos 3 alunos
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(3);
      
    recentStudents = data || [];
  }

  return (
    <div className="animate-in fade-in duration-500">
      {profile.role === 'coach' ? (
        <CoachView 
          profile={profile} 
          totalStudents={totalStudents} 
          pendingCheckins={pendingCheckins} // Passando o dado novo
          recentStudents={recentStudents} 
        />
      ) : (
        <StudentView profile={profile} />
      )}
    </div>
  );
}

// --- VIEW DO COACH (ATUALIZADA COM DADOS REAIS) ---
function CoachView({ 
  profile, 
  totalStudents, 
  pendingCheckins, 
  recentStudents 
}: { 
  profile: any, 
  totalStudents: number, 
  pendingCheckins: number, 
  recentStudents: any[] 
}) {
  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-white">Painel de Controle</h1>
        <p className="text-slate-400">Visão geral do time {profile.full_name}.</p>
      </div>

      {/* 1. KPIs Principais (2 COLUNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: Atletas */}
        <div className="bg-blue-950/30 border border-blue-900/50 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-700/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Atletas Ativos</p>
            <p className="text-5xl font-bold text-white mb-4">{totalStudents}</p>
            <Link href="/dashboard/alunos" className="text-sm text-blue-300 hover:text-white inline-flex items-center gap-2 font-medium">
              Gerenciar time <ArrowRight size={16}/>
            </Link>
          </div>
        </div>

        {/* CARD 2: Avaliações (AGORA COM NÚMERO REAL) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ClipboardList size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Avaliações Pendentes</p>
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg"><ClipboardList size={20}/></div>
            </div>
            
            <p className="text-5xl font-bold text-white">{pendingCheckins}</p>
            
            <p className="text-slate-500 text-sm mt-4">
              {pendingCheckins > 0 ? "Existem check-ins para analisar." : "Tudo em dia por enquanto."}
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Área Principal: Gráfico de Desempenho */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Activity className="text-purple-500" size={20}/>
              Desempenho do Time
            </h3>
            <select className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1">
              <option>Últimos 30 dias</option>
            </select>
          </div>
          
          {/* Placeholder do Gráfico */}
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {[40, 70, 45, 90, 60, 80, 50, 75, 60, 95, 80, 100].map((h, i) => (
              <div key={i} className="w-full bg-slate-800 rounded-t-sm hover:bg-blue-600 transition-colors relative group" style={{ height: `${h}%` }}>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                   {h}%
                 </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-xs text-slate-500 uppercase font-medium">
            <span>Semana 1</span>
            <span>Semana 2</span>
            <span>Semana 3</span>
            <span>Semana 4</span>
          </div>
        </div>

        {/* 3. Coluna Lateral: Últimos Alunos + Atalho */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-sm uppercase">Chegaram Recentemente</h3>
              <Link href="/dashboard/alunos/novo" className="text-blue-400 hover:text-white">
                <Plus size={20} />
              </Link>
            </div>

            <div className="space-y-3">
              {recentStudents.length > 0 ? recentStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 font-bold border border-slate-700">
                    {student.full_name?.[0] || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{student.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{student.selected_goal || 'Sem objetivo'}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Sem novos alunos.
                </div>
              )}
            </div>
            
            <Link href="/dashboard/alunos" className="block mt-4 text-center text-sm text-slate-500 hover:text-white transition-colors border-t border-slate-800 pt-3">
              Ver lista completa
            </Link>
          </div>

          {/* Atalho Rápido */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
            <h3 className="font-bold text-lg mb-1">Novo Aluno?</h3>
            <p className="text-blue-100 text-sm mb-4 opacity-90">Cadastre e inicie a avaliação.</p>
            <Link href="/dashboard/alunos/novo">
              <button className="w-full bg-white text-blue-700 font-bold py-2.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Plus size={18}/> Cadastrar
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- VIEW DO ALUNO (MANTER IGUAL) ---
function StudentView({ profile }: { profile: any }) {
  return (
    <div className="space-y-8">
      {/* Cabeçalho Aluno */}
      <div>
        <h1 className="text-3xl font-bold text-white">Minha Evolução</h1>
        <p className="text-slate-400">
          Objetivo Atual: <span className="text-blue-400 font-semibold uppercase">{profile.selected_goal || 'Não definido'}</span>
        </p>
      </div>

      {/* Grid de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Próximo Check-in</h3>
            <ClipboardList className="text-white" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">Hoje</p>
        </div>
      </div>

      {/* Botão de Ação Principal */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-800 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Hora de atualizar o shape! 📸</h3>
          <p className="text-slate-300">Seu coach está aguardando as fotos e medidas dessa semana.</p>
        </div>
        
        {/* LINK PARA A PÁGINA DE CHECKIN */}
        <Link href="/dashboard/checkin/novo">
          <button className="bg-white text-blue-900 hover:bg-slate-200 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer">
            Enviar Check-in Agora
          </button>
        </Link>
      </div>
    </div>
  );
}