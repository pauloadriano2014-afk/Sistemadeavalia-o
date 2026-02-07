import { createClient } from "@/lib/supabase-server";
import { ArrowLeft, Calendar, Weight, TrendingDown, ImageIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function AlunoDetalhesPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const studentId = params.id;

  // 1. Buscar Perfil do Aluno
  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single();

  if (!student) return <div>Aluno não encontrado</div>;

  // 2. Buscar Histórico de Check-ins (com fotos)
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*, photos(*)')
    .eq('user_id', studentId)
    .order('created_at', { ascending: false });

  // Calcular perda de peso total
  const initialWeight = checkins?.[checkins.length - 1]?.weight || 0;
  const currentWeight = checkins?.[0]?.weight || 0;
  const weightDiff = currentWeight - initialWeight;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Cabeçalho com Voltar */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/alunos" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{student.full_name}</h1>
          <p className="text-slate-400">{student.email}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm font-bold uppercase border border-blue-800">
            {student.selected_goal?.replace('_', ' ') || 'Geral'}
          </span>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm font-bold uppercase mb-2">Peso Atual</p>
          <div className="flex items-center gap-2">
            <Weight className="text-white" size={24} />
            <span className="text-3xl font-bold text-white">{currentWeight || '--'} kg</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm font-bold uppercase mb-2">Evolução Total</p>
          <div className="flex items-center gap-2">
            <TrendingDown className={weightDiff <= 0 ? "text-emerald-500" : "text-red-500"} size={24} />
            <span className={`text-3xl font-bold ${weightDiff <= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm font-bold uppercase mb-2">Check-ins</p>
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-500" size={24} />
            <span className="text-3xl font-bold text-white">{checkins?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Linha do Tempo de Check-ins */}
      <h2 className="text-xl font-bold text-white mt-8">Histórico de Evolução 📸</h2>
      
      <div className="space-y-8">
        {checkins && checkins.length > 0 ? checkins.map((checkin: any) => (
          <div key={checkin.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            
            {/* Cabeçalho do Card */}
            <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 w-2 h-2 rounded-full"></div>
                <span className="font-bold text-white">
                  {new Date(checkin.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300 font-medium">{checkin.weight} kg</span>
              </div>
            </div>

            <div className="p-6">
              {/* Notas do Aluno */}
              {checkin.notes && (
                <div className="mb-6 bg-slate-950 p-4 rounded-lg border border-slate-800/50">
                  <p className="text-sm text-slate-500 uppercase font-bold mb-1">Relato do Aluno:</p>
                  <p className="text-slate-300 italic">"{checkin.notes}"</p>
                </div>
              )}

              {/* Galeria de Fotos */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {checkin.photos?.map((photo: any) => {
                  // Constrói a URL pública da foto
                  const { data: { publicUrl } } = supabase.storage
                    .from('checkin-photos')
                    .getPublicUrl(photo.storage_path);

                  return (
                    <div key={photo.id} className="space-y-2">
                      <div className="aspect-[3/4] relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 group">
                        <Image 
                          src={publicUrl} 
                          alt={photo.pose_label} 
                          fill 
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <p className="text-center text-xs text-slate-500 uppercase font-bold">{photo.pose_label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
            <ImageIcon className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">Nenhum check-in enviado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}