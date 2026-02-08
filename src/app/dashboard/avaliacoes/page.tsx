import { createClient } from "@/lib/supabase-server";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";
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

  if (!coach?.tenant_id) return <div>Acesso negado.</div>;

  // 2. Buscar Checkins Pendentes
  // Buscamos checkins onde status não é 'reviewed' E trazemos os dados do aluno (profiles)
  const { data: pendingCheckins } = await supabase
    .from('checkins')
    .select('*, profiles!inner(*)') // !inner garante que só traga se achar o perfil
    .eq('tenant_id', coach.tenant_id)
    .neq('status', 'reviewed') // Traz 'pending' ou null
    .order('created_at', { ascending: true }); // Mais antigos primeiro (fila)

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Avaliações Pendentes</h1>
        <p className="text-slate-400">Atletas aguardando seu feedback.</p>
      </div>

      <div className="grid gap-4">
        {pendingCheckins && pendingCheckins.length > 0 ? (
          pendingCheckins.map((checkin: any) => (
            <Link 
              key={checkin.id} 
              href={`/dashboard/alunos/${checkin.user_id}`}
              className="group block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-900/20 text-blue-500 flex items-center justify-center font-bold border border-blue-900/50">
                    {checkin.profiles.full_name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {checkin.profiles.full_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock size={14} />
                      <span>Enviado em {new Date(checkin.created_at).toLocaleDateString('pt-BR')} às {new Date(checkin.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 uppercase font-bold">Peso</p>
                    <p className="text-xl font-bold text-white">{checkin.weight} kg</p>
                  </div>
                  <ArrowRight className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
            <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white">Tudo em dia!</h3>
            <p className="text-slate-400">Você zerou a fila de avaliações.</p>
          </div>
        )}
      </div>
    </div>
  );
}