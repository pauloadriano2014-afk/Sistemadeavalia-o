import { createClient } from "@/lib/supabase-server";
import { CheckCircle, Clock, ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AvaliacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // 1. Buscar Perfil Coach
  const { data: coach } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!coach?.tenant_id) return <div className="text-zinc-500 p-8">Acesso negado.</div>;

  // 2. Buscar Checkins Pendentes
  const { data: pendingCheckins } = await supabase
    .from('checkins')
    .select('*, profiles!inner(*)') 
    .eq('tenant_id', coach.tenant_id)
    .neq('status', 'reviewed') 
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-black min-h-screen p-6">
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
            <ClipboardList className="text-brand" size={32}/>
            Avaliações Pendentes
        </h1>
        <p className="text-zinc-400 font-bold mt-2 uppercase tracking-widest text-xs">
            Fila de análise dos atletas
        </p>
      </div>

      <div className="grid gap-4">
        {pendingCheckins && pendingCheckins.length > 0 ? (
          pendingCheckins.map((checkin: any) => (
            <Link 
              key={checkin.id} 
              href={`/dashboard/alunos/${checkin.user_id}`}
              className="group block bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-brand transition-all duration-300 relative overflow-hidden"
            >
              {/* Efeito Glow no Hover */}
              <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/5 transition-colors duration-300"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-lg bg-black text-brand flex items-center justify-center font-black text-lg border border-zinc-800 group-hover:border-brand/50 group-hover:text-lime-400 transition-colors">
                    {checkin.profiles.full_name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-lime-400 transition-colors">
                      {checkin.profiles.full_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
                      <Clock size={14} className="text-brand" />
                      <span>{new Date(checkin.created_at).toLocaleDateString('pt-BR')} • {new Date(checkin.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Peso Atual</p>
                    <p className="text-2xl font-black text-white">{checkin.weight} <span className="text-sm text-zinc-500">kg</span></p>
                  </div>
                  <div className="bg-black p-3 rounded-full border border-zinc-800 group-hover:bg-brand group-hover:text-black group-hover:border-brand transition-all">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-950">
            <CheckCircle className="mx-auto text-brand mb-4 drop-shadow-[0_0_15px_rgba(132,204,22,0.5)]" size={64} />
            <h3 className="text-2xl font-black text-white uppercase italic">Tudo limpo!</h3>
            <p className="text-zinc-500 font-bold mt-2 text-sm uppercase tracking-widest">Você zerou a fila de avaliações.</p>
          </div>
        )}
      </div>
    </div>
  );
}