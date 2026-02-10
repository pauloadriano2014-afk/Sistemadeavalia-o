import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ClipboardList, Plus, ArrowRight, Activity, TrendingUp, Zap, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile) return null;

  // DADOS REAIS + MOCKUP PARA VISUAL
  let totalStudents = 0;
  let pendingCheckins = 0;
  let recentStudents: any[] = [];

  if (profile.role === 'coach') {
    const { count: sCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('tenant_id', profile.tenant_id);
    totalStudents = sCount || 0;
    const { count: cCount } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id).neq('status', 'reviewed');
    pendingCheckins = cCount || 0;
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }).limit(3);
    recentStudents = data || [];
  }

  return (
    // MUDANÇA 1: Fundo com Gradiente Radial (Luz de Palco)
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black text-white p-6 animate-in fade-in duration-700">
      
      {profile.role === 'coach' ? (
        <CoachView profile={profile} total={totalStudents} pending={pendingCheckins} recents={recentStudents} />
      ) : (
        <StudentView profile={profile} />
      )}
    </div>
  );
}

function CoachView({ profile, total, pending, recents }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      {/* HEADER ELITE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                </span>
                <p className="text-lime-500 font-bold text-[10px] uppercase tracking-[0.2em]">Sistema Operacional</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
                HEADQUARTERS
            </h1>
            <p className="text-zinc-400 font-medium text-sm mt-2">
                Bem-vindo ao comando, <span className="text-white">{profile.full_name}</span>.
            </p>
        </div>
        
        <div className="flex gap-3">
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-md">
                Relatórios
            </button>
            <Link href="/dashboard/alunos/novo" className="bg-lime-500 hover:bg-lime-400 text-black px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] flex items-center gap-2">
                <Plus size={16} /> Novo Atleta
            </Link>
        </div>
      </div>

      {/* GRID DE KPIs (Efeito Glass) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 overflow-hidden hover:border-lime-500/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Users size={120} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-zinc-800/50 rounded-lg border border-white/5 text-zinc-400">
                        <Users size={20}/>
                    </div>
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Squad Ativo</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-6xl font-black text-white tracking-tighter">{total}</h3>
                    <span className="text-zinc-500 font-bold text-sm">atletas</span>
                </div>
                <Link href="/dashboard/alunos" className="mt-6 inline-flex items-center gap-2 text-lime-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors group-hover:translate-x-2 duration-300">
                    Acessar Lista <ArrowRight size={14}/>
                </Link>
            </div>
        </div>

        {/* Card 2 - Pendências (Destaque se houver) */}
        <div className={`group relative backdrop-blur-xl border rounded-3xl p-8 overflow-hidden transition-all duration-500 ${pending > 0 ? 'bg-lime-500/5 border-lime-500/20 hover:border-lime-500/50' : 'bg-zinc-900/40 border-white/5'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <ClipboardList size={120} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-lg border text-zinc-400 ${pending > 0 ? 'bg-lime-500/10 border-lime-500/20 text-lime-500' : 'bg-zinc-800/50 border-white/5'}`}>
                        <Activity size={20}/>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${pending > 0 ? 'text-lime-500' : 'text-zinc-500'}`}>Status do Feed</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-6xl font-black text-white tracking-tighter">{pending}</h3>
                    <span className="text-zinc-500 font-bold text-sm">análises</span>
                </div>
                <p className="mt-6 text-zinc-400 text-xs font-bold">
                    {pending > 0 ? "⚠️ Atenção requerida no prontuário." : "✅ Tudo limpo por aqui."}
                </p>
            </div>
        </div>

        {/* Card 3 - Performance (Visual) */}
        <div className="group relative bg-gradient-to-br from-zinc-900/60 to-black border border-white/5 rounded-3xl p-8 overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Retenção Mensal</span>
                    <h3 className="text-3xl font-black text-white mt-1">94%</h3>
                </div>
                <div className="bg-lime-500/10 p-2 rounded-full text-lime-500">
                    <TrendingUp size={20}/>
                </div>
            </div>
            {/* Mini Gráfico CSS */}
            <div className="flex items-end gap-1 h-24 w-full">
                {[40,60,30,80,50,90,70,100,60,80].map((h, i) => (
                    <div key={i} className="flex-1 bg-zinc-800 hover:bg-lime-500 transition-colors duration-300 rounded-t-sm" style={{height: `${h}%`}}></div>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO PRINCIPAL */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-lime-500/20 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    <Zap className="text-lime-500" size={24} fill="currentColor"/> Performance da Equipe
                </h3>
                <div className="flex gap-2">
                    <span className="h-3 w-3 bg-lime-500 rounded-full"></span>
                    <span className="h-3 w-3 bg-zinc-700 rounded-full"></span>
                </div>
            </div>

            {/* Gráfico Barras Estilizado */}
            <div className="h-64 w-full flex items-end justify-between gap-2 md:gap-4 px-2">
                {[35, 50, 45, 60, 80, 70, 90, 100, 85, 60, 75, 95].map((val, i) => (
                    <div key={i} className="w-full flex flex-col justify-end group cursor-pointer">
                        <div 
                            className="w-full bg-zinc-800/50 border-t border-x border-white/5 rounded-t-md group-hover:bg-lime-500 group-hover:shadow-[0_0_20px_rgba(132,204,22,0.4)] transition-all duration-300 relative"
                            style={{ height: `${val}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                                {val}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="w-full h-px bg-white/10 mt-0"></div>
            <div className="flex justify-between mt-4 text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
            </div>
        </div>

        {/* LISTA LATERAL */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Novos Recrutas</h3>
            
            <div className="space-y-4">
                {recents.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-lime-500/30 transition-all group cursor-pointer">
                        <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-lime-500 font-black border border-white/5 group-hover:scale-110 transition-transform">
                            {s.full_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-lime-400 transition-colors">{s.full_name}</h4>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide truncate">{s.selected_goal || 'Sem Objetivo'}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-lime-500">
                            <ArrowRight size={16}/>
                        </div>
                    </div>
                ))}
                
                {recents.length === 0 && (
                    <div className="text-center py-10 text-zinc-600 text-xs font-bold uppercase">Nenhum registro recente</div>
                )}
            </div>

            <Link href="/dashboard/alunos" className="mt-8 block w-full py-4 text-center text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest border border-dashed border-zinc-800 rounded-xl hover:border-zinc-600 transition-all">
                Ver todos os atletas
            </Link>
        </div>

      </div>
    </div>
  );
}

function StudentView({ profile }: any) {
    return <div className="text-white p-10">Área do Aluno (Em construção visual)...</div>
}