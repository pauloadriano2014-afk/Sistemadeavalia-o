"use client";

import { createClient } from "@/lib/supabase";
import { 
  ArrowLeft, Weight, TrendingDown, Calendar, 
  Image as ImageIcon, Plus, Sparkles, Activity, 
  ClipboardList, ScanEye, BrainCircuit, Printer,
  ActivitySquare
} from "lucide-react";
import Link from "next/link";
import PhotoComparator from "@/components/PhotoComparator";
import FeedbackForm from "@/components/FeedbackForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// --- FUNÇÃO AUXILIAR DE PARSE (Lê o texto da IA e separa em páginas) ---
function parseReportStructure(content: string, photos: string[] = []) {
    const sections: any = {};
    const rawSegments = content.split('\n## ');
    
    rawSegments.forEach(segment => {
        const fullSegment = segment.startsWith('##') ? segment : `## ${segment}`;
        const cleanText = fullSegment.replace(/## .*?\n/, '').trim();

        if (fullSegment.includes('FRENTE')) {
            sections.frente = { text: cleanText, photo: photos[0] || null };
        } else if (fullSegment.includes('PERFIL')) {
            sections.perfil = { text: cleanText, photo: photos[1] || null };
        } else if (fullSegment.includes('COSTAS')) {
            sections.costas = { text: cleanText, photo: photos[2] || null };
        } else if (fullSegment.includes('VEREDITO') || fullSegment.includes('Estratégia')) {
            sections.veredito = cleanText;
        }
    });
    return sections;
}

// Componente Card de Status (Visual Neon) - Ajustado para não estourar no mobile
function StatusCard({ label, value, icon, color = "text-white" }: any) {
    return (
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden group hover:border-zinc-800 transition-colors print:hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 scale-125 origin-top-right group-hover:text-brand transition-colors">
                {icon}
            </div>
            <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{label}</span>
            <span className={`text-3xl font-black ${color} tracking-tighter italic`}>{value}</span>
        </div>
    )
}

export default function AlunoDetalhesPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [student, setStudent] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState({ current: 0, diff: 0, count: 0, assessCount: 0 });
  
  // Estado que controla o ID do item sendo impresso
  const [printingId, setPrintingId] = useState<string | null>(null);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadData() {
        const { data: sData } = await supabase.from('profiles').select('*').eq('id', studentId).single();
        setStudent(sData);

        const { data: checkinData } = await supabase.from('checkins').select('*, photos(*)').eq('user_id', studentId).order('created_at', { ascending: false });
        const { data: assessData } = await supabase.from('assessments').select('*').eq('student_id', studentId).order('created_at', { ascending: false });

        const checkins = checkinData?.map(c => ({ 
            ...c, 
            type: 'checkin',
            date: new Date(c.created_at),
            photos: c.photos?.map((photo: any) => {
                const { data } = supabase.storage.from('checkin-photos').getPublicUrl(photo.storage_path);
                return { ...photo, url: data.publicUrl };
            })
        })) || [];

        const assessments = assessData?.map(a => ({
            ...a,
            type: 'assessment',
            date: new Date(a.created_at)
        })) || [];

        const unified = [...checkins, ...assessments].sort((a, b) => b.date.getTime() - a.date.getTime());
        setTimeline(unified);

        const current = checkins[0]?.weight || 0;
        const initial = checkins[checkins.length - 1]?.weight || 0;
        setStats({
            current,
            diff: current - initial,
            count: checkins.length,
            assessCount: assessments.length
        });
    }
    loadData();
  }, [studentId]);

  const handlePrint = (id: string) => {
    setPrintingId(id);
    // Delay de 300ms para garantir que o React renderize o bloco oculto antes do browser abrir o diálogo
    setTimeout(() => {
        window.print();
        setPrintingId(null); 
    }, 300);
  };

  if (!student) return <div className="text-zinc-500 p-10 font-bold uppercase text-center">Carregando dados do aluno...</div>;

  // Header que se repete em todas as páginas do PDF
  const PrintHeader = ({ date }: { date: string }) => (
    <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-black">
        <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-black">Relatório Técnico</h1>
            <p className="text-sm font-bold uppercase text-zinc-600">Aluno: {student.full_name}</p>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-zinc-600 uppercase">Data da Avaliação</p>
            <p className="text-lg font-black text-black">{date}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pb-20 text-white font-sans relative">
      
      {/* --- CSS DE IMPRESSÃO (CORREÇÃO DA TELA BRANCA) --- */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          body { background-color: white !important; color: black !important; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background-color: white !important;
          }
          .page-break { 
            page-break-after: always; 
            break-after: page;
            min-height: 100vh;
            padding: 20mm;
            background: white !important;
            display: flex;
            flex-direction: column;
          }
          h1, h2, h3, p, span { color: black !important; }
          img { max-height: 48vh; object-fit: contain; }
        }
        #print-area { display: none; }
      `}</style>

      {/* --- HEADER DO SITE (VISÍVEL NA TELA) --- */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 print:hidden">
        
        {/* CABEÇALHO RESPONSIVO: No mobile vira coluna, no desktop linha */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-6 gap-4">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/alunos" className="p-2 text-zinc-500 hover:text-brand transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-black italic tracking-tighter uppercase">{student.full_name}</h1>
            </div>
            
            {/* Botões de Ação: Grid perfeito de 2x2 no mobile, Flex no desktop */}
            <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
                 <Link href={`/dashboard/alunos/${studentId}/diagnostico`} className="bg-zinc-900 text-blue-400 border border-zinc-800 px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    <ScanEye size={16} /> Raio-X
                 </Link>
                 <Link href={`/dashboard/alunos/${studentId}/comparativo`} className="bg-zinc-900 text-brand border border-zinc-800 px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    <Sparkles size={16} /> IA 4.0
                 </Link>
                 <Link href={`/dashboard/alunos/${studentId}/pollock`} className="bg-zinc-900 text-amber-400 border border-zinc-800 px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    <ActivitySquare size={16} /> Pollock
                 </Link>
                 <Link href={`/dashboard/alunos/${studentId}/novo-checkin`} className="bg-brand text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    <Plus size={16} /> Novo Check-in
                 </Link>
            </div>
        </div>

        {/* STATS: Grid de 2 colunas no mobile, 4 no desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard label="Peso Atual" value={`${stats.current} kg`} icon={<Weight size={24} className="text-brand"/>} />
            <StatusCard label="Evolução" value={`${stats.diff > 0 ? '+' : ''}${stats.diff.toFixed(1)} kg`} color={stats.diff <= 0 ? "text-brand" : "text-red-500"} icon={<TrendingDown size={24}/>} />
            <StatusCard label="Check-ins" value={stats.count} icon={<Calendar size={24} className="text-zinc-500"/>} />
            <StatusCard label="Avaliações" value={stats.assessCount} icon={<BrainCircuit size={24} className="text-blue-500"/>} />
        </div>

        {/* COMPARADOR RÁPIDO */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-900 relative z-10">
                <div className="p-2 bg-brand/10 rounded-lg text-brand"><ImageIcon size={20} /></div>
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Comparador Rápido</h2>
                    <p className="text-xs text-zinc-500 font-bold tracking-wide">Evolução visual</p>
                </div>
            </div>
            <div className="relative z-10">
                <PhotoComparator checkins={timeline.filter(t => t.type === 'checkin')} /> 
            </div>
        </div>

        {/* LISTA DO PRONTUÁRIO (VISUAL TELA) */}
        <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><ClipboardList className="text-zinc-600"/> Prontuário do Aluno</h2>
            {timeline.map((item: any) => (
                <div key={item.id} className={`p-6 rounded-2xl border ${item.type === 'assessment' ? 'bg-zinc-950/50 border-blue-500/20' : 'bg-zinc-950 border-zinc-900'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                            {item.type === 'assessment' ? <BrainCircuit className="text-blue-400" /> : <Calendar className="text-brand" />}
                            <div>
                                <h3 className="font-bold text-sm uppercase">{item.type === 'assessment' ? "Análise Técnica Visual" : "Check-in Físico"}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                        
                        {/* Botão de Imprimir (Apenas para Avaliações IA) */}
                        {item.type === 'assessment' && (
                            <button 
                                onClick={() => handlePrint(item.id)} 
                                className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-800" 
                                title="Imprimir PDF (4 Páginas)"
                            >
                                <Printer size={18} />
                            </button>
                        )}
                    </div>

                    {/* Fotos no Card da Tela (Miniaturas) */}
                    {item.type === 'assessment' && item.photos && (
                         <div className="flex gap-2 mb-4 overflow-hidden">
                            {item.photos.map((url: string, idx: number) => (
                                <img key={idx} src={url} className="w-16 h-20 object-cover rounded-lg border border-zinc-800 opacity-60 hover:opacity-100 transition-opacity" />
                            ))}
                         </div>
                    )}
                    
                    {/* Texto do Relatório na Tela */}
                    <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.content || item.notes}</div>
                </div>
            ))}
        </div>
      </div>

      {/* --- ÁREA DE IMPRESSÃO (OCULTA NO SITE, EXIBIDA NO PDF) --- */}
      <div id="print-area">
        {printingId && timeline.map((item: any) => {
            if (item.id !== printingId || item.type !== 'assessment') return null;
            
            const report = parseReportStructure(item.content, item.photos);
            const dateStr = new Date(item.created_at).toLocaleDateString('pt-BR');

            return (
                <div key={item.id}>
                    {/* --- PÁGINA 1: FRENTE --- */}
                    <div className="page-break">
                        <PrintHeader date={dateStr} />
                        <h2 className="text-xl font-black uppercase mb-6 border-b pb-2">Vista Frontal</h2>
                        {report.frente?.photo && (
                            <div className="w-full flex justify-center mb-8 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-200">
                                <img src={report.frente.photo} alt="Frente" className="object-contain" />
                            </div>
                        )}
                        <h3 className="text-xs font-bold uppercase text-zinc-400 mb-2">Parecer do Coach:</h3>
                        <p className="text-base text-justify font-medium leading-relaxed">{report.frente?.text}</p>
                        <div className="flex-1"></div>
                    </div>

                    {/* --- PÁGINA 2: PERFIL --- */}
                    <div className="page-break">
                        <PrintHeader date={dateStr} />
                        <h2 className="text-xl font-black uppercase mb-6 border-b pb-2">Vista Lateral</h2>
                        {report.perfil?.photo && (
                            <div className="w-full flex justify-center mb-8 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-200">
                                <img src={report.perfil.photo} alt="Perfil" className="object-contain" />
                            </div>
                        )}
                        <h3 className="text-xs font-bold uppercase text-zinc-400 mb-2">Parecer do Coach:</h3>
                        <p className="text-base text-justify font-medium leading-relaxed">{report.perfil?.text}</p>
                        <div className="flex-1"></div>
                    </div>

                    {/* --- PÁGINA 3: COSTAS --- */}
                    <div className="page-break">
                        <PrintHeader date={dateStr} />
                        <h2 className="text-xl font-black uppercase mb-6 border-b pb-2">Vista Dorsal</h2>
                        {report.costas?.photo && (
                            <div className="w-full flex justify-center mb-8 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-200">
                                <img src={report.costas.photo} alt="Costas" className="object-contain" />
                            </div>
                        )}
                        <h3 className="text-xs font-bold uppercase text-zinc-400 mb-2">Parecer do Coach:</h3>
                        <p className="text-base text-justify font-medium leading-relaxed">{report.costas?.text}</p>
                        <div className="flex-1"></div>
                    </div>

                    {/* --- PÁGINA 4: VEREDITO --- */}
                    <div className="page-break">
                        <div className="mt-10 flex-1">
                            <h1 className="text-3xl font-black uppercase mb-10 border-b-4 border-black pb-4 text-center">🎯 Estratégia & Veredito Final</h1>
                            <p className="text-xl leading-relaxed text-justify px-10 font-medium">{report.veredito}</p>
                        </div>
                        
                        <div className="mt-auto pt-10 border-t border-zinc-300 flex justify-between items-end mx-10">
                            <div>
                                <div className="h-px bg-black w-64 mb-2"></div>
                                <p className="text-xs font-bold uppercase tracking-widest">Paulo Adriano - Coach Responsável</p>
                            </div>
                            <p className="text-sm font-black italic opacity-30 tracking-tighter">COACHPRO SYSTEM</p>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
