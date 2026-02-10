import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { UserPlus, Search, ChevronRight, Users } from "lucide-react";

export default async function AlunosPage() {
  const supabase = await createClient();
  const { data: students } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                <Users className="text-lime-500" size={32}/>
                Gerenciar Atletas
            </h1>
            <p className="text-zinc-400 font-bold text-sm mt-1">Total: {students?.length || 0} ativos</p>
        </div>
        
        <div className="flex gap-3">
            <div className="relative group">
                <Search className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-lime-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar atleta..." 
                    className="bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl pl-12 pr-4 py-3 w-full md:w-64 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 transition-all placeholder:text-zinc-600"
                />
            </div>
            <Link 
                href="/dashboard/alunos/novo" 
                className="bg-lime-500 hover:bg-lime-400 text-black font-black uppercase tracking-wider px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 transition-all active:scale-95"
            >
                <UserPlus size={20} />
                <span className="hidden md:inline">Novo Atleta</span>
            </Link>
        </div>
      </div>

      {/* Lista de Cards (Substituindo Tabela para mobile-first) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {students?.map((student) => (
          <Link key={student.id} href={`/dashboard/alunos/${student.id}`} className="group">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-lime-500/50 transition-all duration-300 relative overflow-hidden">
                
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-lime-500/0 group-hover:bg-lime-500/5 transition-colors duration-300"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        {/* Avatar Placeholder */}
                        <div className="w-14 h-14 bg-black border border-zinc-800 rounded-xl flex items-center justify-center text-lg font-black text-lime-500 uppercase group-hover:scale-105 transition-transform">
                            {student.full_name.substring(0,2)}
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-lime-400 transition-colors">
                                {student.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {student.selected_goal && (
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                                        {student.selected_goal.replace('_', ' ')}
                                    </span>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                                    {student.gender === 'male' ? 'Masculino' : 'Feminino'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-black border border-zinc-800 p-2 rounded-lg text-zinc-500 group-hover:text-lime-500 group-hover:border-lime-500 transition-all">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}