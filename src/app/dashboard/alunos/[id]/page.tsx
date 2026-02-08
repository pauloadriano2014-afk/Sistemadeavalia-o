import { createClient } from "@/lib/supabase-server";
import { ArrowLeft, Weight, TrendingDown, Calendar, Image as ImageIcon, Plus, Sparkles } from "lucide-react"; // Importei Sparkles
import Link from "next/link";
import PhotoComparator from "@/components/PhotoComparator";
import FeedbackForm from "@/components/FeedbackForm";

// Correção do Next.js 15: params é uma Promise
export default async function AlunoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 1. Desembrulhar os parâmetros (Obrigatório no Next 15)
  const resolvedParams = await params;
  const studentId = resolvedParams.id;
  
  const supabase = await createClient();

  // 2. Buscar Perfil (Com log de erro se falhar)
  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    return (
      <div className="p-8 text-white bg-red-900/20 border border-red-900 rounded-xl">
        <h2 className="text-xl font-bold mb-2">Aluno não encontrado</h2>
        <p className="text-slate-300">O sistema não conseguiu carregar o perfil deste aluno.</p>
        <Link href="/dashboard/alunos" className="mt-4 inline-block text-blue-400 hover:text-white">
          &larr; Voltar para lista
        </Link>
      </div>
    );
  }

  // 3. Buscar Histórico COMPLETO
  const { data: rawCheckins } = await supabase
    .from('checkins')
    .select('*, photos(*)')
    .eq('user_id', studentId)
    .order('created_at', { ascending: false });

  // 4. Processar URLs das fotos
  const checkins = rawCheckins?.map(checkin => ({
    ...checkin,
    photos: checkin.photos?.map((photo: any) => {
      const { data } = supabase.storage.from('checkin-photos').getPublicUrl(photo.storage_path);
      return { ...photo, url: data.publicUrl };
    })
  })) || [];

  // Cálculos de Resumo
  const currentWeight = checkins[0]?.weight || 0;
  const initialWeight = checkins[checkins.length - 1]?.weight || 0;
  const weightDiff = currentWeight - initialWeight;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/alunos" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{student.full_name}</h1>
            <p className="text-slate-400 text-sm">Monitoramento de Evolução</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
             <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 hidden sm:block">
                <span className="text-xs text-slate-500 uppercase font-bold mr-2">Objetivo:</span>
                <span className="text-blue-400 font-bold uppercase">{student.selected_goal?.replace('_', ' ') || 'Geral'}</span>
             </div>

             {/* BOTÃO COMPARAR (IA) - NOVO */}
             <Link 
               href={`/dashboard/alunos/${studentId}/comparativo`}
               className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
             >
               <Sparkles size={16} className="text-purple-400" />
               Comparar (IA)
             </Link>

             {/* BOTÃO DE LANÇAR CHECK-IN (CONCIERGE) */}
             <Link 
               href={`/dashboard/alunos/${studentId}/novo-checkin`}
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-900/20"
             >
               <Plus size={16} />
               Lançar Check-in
             </Link>
        </div>
      </div>

      {/* --- CARDS DE STATUS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard 
          label="Peso Atual" 
          value={`${currentWeight || '--'} kg`} 
          icon={<Weight className="text-blue-500" size={24} />} 
        />
        <StatusCard 
          label="Evolução Total" 
          value={`${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg`} 
          textColor={weightDiff <= 0 ? "text-emerald-500" : "text-red-500"}
          icon={<TrendingDown className={weightDiff <= 0 ? "text-emerald-500" : "text-red-500"} size={24} />} 
        />
        <StatusCard 
          label="Total de Check-ins" 
          value={checkins.length.toString()} 
          icon={<Calendar className="text-slate-400" size={24} />} 
        />
      </div>

      {/* --- O COMPARADOR VISUAL --- */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ImageIcon size={20} className="text-blue-500"/>
          Comparativo Visual
        </h2>
        <p className="text-slate-400 text-sm">Selecione duas datas para comparar a evolução lado a lado.</p>
        
        <PhotoComparator checkins={checkins} />
      </div>

      {/* --- HISTÓRICO DETALHADO (COM FEEDBACK) --- */}
      <div className="space-y-4 pt-8 border-t border-slate-800">
        <h2 className="text-xl font-bold text-white">Histórico Detalhado</h2>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 w-32">Data</th>
                <th className="px-6 py-4 w-24">Peso</th>
                <th className="px-6 py-4">Detalhes & Avaliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {checkins.map((checkin: any) => (
                <tr key={checkin.id} className="hover:bg-slate-800/20 transition-colors align-top">
                  
                  {/* Data */}
                  <td className="px-6 py-6 text-white font-mono whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-base">
                        {new Date(checkin.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(checkin.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  </td>

                  {/* Peso */}
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-1 text-slate-300 font-bold text-lg">
                      {checkin.weight} <span className="text-xs text-slate-500 font-normal">kg</span>
                    </div>
                  </td>

                  {/* Conteúdo Central (Relato + Feedback) */}
                  <td className="px-6 py-6">
                    {/* Relato do Aluno */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Relato do Aluno:</p>
                      <p className="text-slate-300 text-sm italic bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                        "{checkin.notes || 'Sem observações.'}"
                      </p>
                    </div>

                    {/* Mini Galeria (Visualização Rápida) */}
                    {checkin.photos && checkin.photos.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {checkin.photos.map((p: any) => (
                            <a key={p.id} href={p.url} target="_blank" className="block w-12 h-16 relative rounded overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors flex-shrink-0 cursor-zoom-in">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.url} alt={p.pose_label} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                    )}

                    {/* ÁREA DE FEEDBACK (Onde você trabalha) */}
                    <FeedbackForm 
                      checkinId={checkin.id} 
                      studentId={studentId} 
                      initialFeedback={checkin.feedback} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function StatusCard({ label, value, icon, textColor = "text-white" }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase mb-1">{label}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      </div>
      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
        {icon}
      </div>
    </div>
  );
}