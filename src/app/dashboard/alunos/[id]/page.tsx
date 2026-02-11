import { createClient } from "@/lib/supabase-server";
import { 
  ArrowLeft, Weight, TrendingDown, Calendar, 
  Image as ImageIcon, Plus, Sparkles, Activity, 
  ClipboardList, ScanEye // <--- NOVO ÍCONE
} from "lucide-react";
import Link from "next/link";
import PhotoComparator from "@/components/PhotoComparator";
import FeedbackForm from "@/components/FeedbackForm";

// Card de Status Neon
function StatusCard({ label, value, icon, color = "text-white" }: any) {
    return (
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden group hover:border-zinc-800 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 scale-125 origin-top-right group-hover:text-brand transition-colors">
                {icon}
            </div>
            <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{label}</span>
            <span className={`text-3xl font-black ${color} tracking-tighter italic`}>{value}</span>
        </div>
    )
}

export default async function AlunoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const studentId = resolvedParams.id;
  
  const supabase = await createClient();

  const { data: student } = await supabase.from('profiles').select('*').eq('id', studentId).single();

  if (!student) return <div className="text-zinc-500 p-10 font-bold uppercase">Aluno não encontrado</div>;

  const { data: rawCheckins } = await supabase
    .from('checkins')
    .select('*, photos(*)')
    .eq('user_id', studentId)
    .order('created_at', { ascending: false });

  const checkins = rawCheckins?.map(checkin => ({
    ...checkin,
    photos: checkin.photos?.map((photo: any) => {
      const { data } = supabase.storage.from('checkin-photos').getPublicUrl(photo.storage_path);
      return { ...photo, url: data.publicUrl };
    })
  })) || [];

  const currentWeight = checkins[0]?.weight || 0;
  const initialWeight = checkins[checkins.length - 1]?.weight || 0;
  const weightDiff = currentWeight - initialWeight;

  return (
    <div className="min-h-screen bg-black pb-20 text-white font-sans">
      
      {/* HEADER DARK NEON */}
      <div className="bg-black border-b border-zinc-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/alunos" className="p-2 text-zinc-500 hover:text-lime-400 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        {student.full_name}
                        {student.selected_goal && (
                            <span className="text-[10px] bg-zinc-900 text-lime-400 border border-zinc-800 px-2 py-0.5 rounded not-italic font-bold tracking-widest">
                                {student.selected_goal.replace('_', ' ')}
                            </span>
                        )}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 
                 {/* NOVO BOTÃO: DIAGNÓSTICO INICIAL (RAIO-X) */}
                 <Link 
                   href={`/dashboard/alunos/${studentId}/diagnostico`}
                   className="hidden md:flex items-center gap-2 bg-zinc-900 text-blue-400 border border-zinc-800 hover:border-blue-500 hover:text-white px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                 >
                   <ScanEye size={16} />
                   Raio-X
                 </Link>

                 {/* Botão IA */}
                 <Link 
                   href={`/dashboard/alunos/${studentId}/comparativo`}
                   className="hidden md:flex items-center gap-2 bg-zinc-900 text-lime-400 border border-zinc-800 hover:border-brand hover:text-white px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs transition-all"
                 >
                   <Sparkles size={16} />
                   IA 4.0
                 </Link>

                 {/* Novo Check-in */}
                 <Link 
                   href={`/dashboard/alunos/${studentId}/novo-checkin`}
                   className="flex items-center gap-2 bg-brand hover:bg-lime-400 text-black px-5 py-2 rounded-xl font-black uppercase tracking-wider text-xs transition-colors shadow-[0_0_15px_rgba(132,204,22,0.3)] hover:shadow-[0_0_25px_rgba(132,204,22,0.5)]"
                 >
                   <Plus size={18} />
                   <span className="hidden sm:inline">Novo Check-in</span>
                 </Link>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard 
                label="Peso Atual" 
                value={`${currentWeight} kg`} 
                icon={<Weight size={24} className="text-brand"/>}
            />
            <StatusCard 
                label="Evolução" 
                value={`${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg`} 
                color={weightDiff <= 0 ? "text-lime-400" : "text-red-500"}
                icon={<TrendingDown size={24} className={weightDiff <= 0 ? "text-brand" : "text-red-500"}/>}
            />
            <StatusCard 
                label="Check-ins" 
                value={checkins.length} 
                icon={<Calendar size={24} className="text-zinc-500"/>}
            />
            <StatusCard 
                label="Frequência" 
                value="Alta" 
                icon={<Activity size={24} className="text-blue-500"/>}
            />
        </div>

        {/* COMPARADOR (Contido) */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-900 relative z-10">
                <div className="p-2 bg-brand/10 rounded-lg text-brand">
                    <ImageIcon size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Comparador Rápido</h2>
                    <p className="text-xs text-zinc-500 font-bold tracking-wide">Evolução visual lado a lado</p>
                </div>
            </div>
            <div className="relative z-10">
                <PhotoComparator checkins={checkins} /> 
            </div>
        </div>

        {/* PRONTUÁRIO */}
        <div>
            <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                <ClipboardList className="text-zinc-600" size={24}/> Prontuário do Atleta
            </h2>
            
            <div className="space-y-6">
                {checkins.length === 0 && (
                    <div className="text-center py-16 bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-900">
                        <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">Nenhum registro encontrado</p>
                    </div>
                )}

                {checkins.map((checkin) => (
                    <div key={checkin.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 hover:border-brand/30 transition-colors duration-300 group">
                        <div className="flex flex-col md:flex-row gap-8">
                            
                            {/* Data e Peso */}
                            <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-1 md:w-32 md:border-r md:border-zinc-900 md:pr-6 shrink-0">
                                <div>
                                    <span className="text-4xl font-black text-white tracking-tighter block leading-none">
                                        {new Date(checkin.created_at).getDate()}
                                    </span>
                                    <span className="text-xs text-brand uppercase font-black tracking-widest">
                                        {new Date(checkin.created_at).toLocaleString('pt-BR', { month: 'short' })}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 block mt-1 font-bold">
                                        {new Date(checkin.created_at).getFullYear()}
                                    </span>
                                </div>
                                <div className="mt-0 md:mt-6 text-right md:text-left bg-black px-3 py-1 rounded border border-zinc-800">
                                    <span className="block text-lg font-mono font-bold text-white">
                                        {checkin.weight}kg
                                    </span>
                                </div>
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 space-y-6">
                                {checkin.notes && (
                                    <div className="bg-black p-4 rounded-xl border border-zinc-900 relative">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Relato do Aluno</p>
                                        <p className="text-sm text-zinc-300 italic leading-relaxed">
                                            "{checkin.notes}"
                                        </p>
                                    </div>
                                )}

                                {checkin.photos && checkin.photos.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase mb-2 tracking-widest">Evidências</p>
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                            {checkin.photos.map((p: any) => (
                                                <a 
                                                    key={p.id} 
                                                    href={p.url} 
                                                    target="_blank" 
                                                    className="relative w-20 h-28 bg-black rounded-lg border border-zinc-800 shrink-0 hover:border-brand transition-all overflow-hidden group/img"
                                                >
                                                    {/* CORREÇÃO DO ALINHAMENTO */}
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img 
                                                        src={p.url} 
                                                        className="w-full h-full object-cover object-top opacity-80 group-hover/img:opacity-100 transition-opacity" 
                                                        alt={p.pose_label}
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-zinc-900">
                                     <FeedbackForm 
                                        checkinId={checkin.id} 
                                        studentId={studentId} 
                                        initialFeedback={checkin.feedback}
                                     />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}