import { createClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Buscar dados do usuário logado
  const { data: { user } } = await supabase.auth.getUser();

  // Buscar perfil completo (role, nome, etc)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          Olá, {profile?.full_name || 'Atleta'} 👋
        </h1>
        <p className="text-slate-400 mt-1">
          {profile?.role === 'coach' 
            ? 'Gerencie seus alunos e avaliações aqui.' 
            : 'Acompanhe sua evolução e próximos passos.'}
        </p>
      </header>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Status</h3>
          <p className="text-2xl font-bold text-white mt-2">Ativo</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">
            {profile?.role === 'coach' ? 'Total de Alunos' : 'Próxima Avaliação'}
          </h3>
          <p className="text-2xl font-bold text-blue-500 mt-2">
            {profile?.role === 'coach' ? '0' : 'Hoje'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Objetivo</h3>
          <p className="text-lg font-medium text-white mt-2">
            {profile?.selected_goal?.replace('_', ' ').toUpperCase() || 'NÃO DEFINIDO'}
          </p>
        </div>
      </div>
    </div>
  );
}