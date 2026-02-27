"use client";

import { createClient } from "@/lib/supabase";
import { flushSync } from "react-dom";
import { 
  ArrowLeft, Weight, TrendingDown, Calendar, 
  Image as ImageIcon, Plus, Sparkles, ActivitySquare, Printer, BrainCircuit, ClipboardList, ScanEye,
  CheckSquare, Square, X
} from "lucide-react";
import Link from "next/link";
import PhotoComparator from "@/components/PhotoComparator";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

type Folds = { peitoral: number|''; axilar_media: number|''; triceps: number|''; subescapular: number|''; abdomen: number|''; suprailiaca: number|''; coxa: number|''; };
type Circs = { torax: number|''; cintura: number|''; abdomen_circ: number|''; quadril: number|''; braco_dir: number|''; braco_esq: number|''; coxa_dir: number|''; coxa_esq: number|''; panturrilha_dir: number|''; panturrilha_esq: number|''; };
const FOLD_KEYS = ['peitoral', 'axilar_media', 'triceps', 'subescapular', 'abdomen', 'suprailiaca', 'coxa'];
const CIRC_KEYS = ['torax', 'cintura', 'abdomen_circ', 'quadril', 'braco_dir', 'braco_esq', 'coxa_dir', 'coxa_esq', 'panturrilha_dir', 'panturrilha_esq'];
const formatName = (key: string) => key.replace('_circ', '').replace('_dir', ' Dir.').replace('_esq', ' Esq.').replace('_', ' ');

function parseReportStructure(content: string, photos: string[] = []) {
    const sections: any = {};
    const rawSegments = content.split('\n## ');
    
    rawSegments.forEach(segment => {
        const fullSegment = segment.startsWith('##') ? segment : `## ${segment}`;
        const cleanText = fullSegment.replace(/## .*?\n/, '').trim();

        if (fullSegment.includes('FRENTE')) sections.frente = { text: cleanText, photo: photos[0] || null };
        else if (fullSegment.includes('PERFIL')) sections.perfil = { text: cleanText, photo: photos[1] || null };
        else if (fullSegment.includes('COSTAS')) sections.costas = { text: cleanText, photo: photos[2] || null };
        else if (fullSegment.includes('VEREDITO') || fullSegment.includes('Estratégia')) sections.veredito = cleanText;
    });
    return sections;
}

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

function MetricBox({ label, value, diff, unit, inverseColors = false, neutral = false }: any) {
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const isZero = diff === 0 || !diff;
    
    let colorClass = "text-zinc-500";
    if (!neutral) {
        if (isPositive) colorClass = inverseColors ? "text-red-500" : "text-green-500";
        if (isNegative) colorClass = inverseColors ? "text-green-500" : "text-red-500";
    }

    return (
        <div className="bg-black border border-zinc-900 rounded-xl p-3 flex flex-col items-center justify-center relative">
            <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{label}</span>
            <span className="text-xl font-black text-white">{value}<span className="text-xs text-zinc-500">{unit}</span></span>
            {!isZero && (
                <div className={`absolute top-2 right-2 text-[10px] font-black ${colorClass}`}>
                    {isPositive ? '+' : ''}{diff.toFixed(1)}{unit}
                </div>
            )}
        </div>
    )
}

export default function AlunoDetalhesPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [student, setStudent] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState({ current: 0, diff: 0, count: 0, assessCount: 0 });
  
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [selectedAssessments, setSelectedAssessments] = useState<any[]>([]);
  const [printingCustomComparison, setPrintingCustomComparison] = useState(false);
  
  const [brandColor, setBrandColor] = useState<string>('#84cc16'); 
  const colorRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
      if (colorRef.current) {
          const color = window.getComputedStyle(colorRef.current).backgroundColor;
          if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
              setBrandColor(color);
          }
      }
  }, []);

  useEffect(() => {
    async function loadData() {
        const { data: sData } = await supabase.from('profiles').select('*').eq('id', studentId).single();
        setStudent(sData);

        const { data: checkinData } = await supabase.from('checkins').select('*, photos(*)').eq('user_id', studentId).order('created_at', { ascending: false });
        const { data: assessData } = await supabase.from('assessments').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
        const { data: pollockData } = await supabase.from('pollock_assessments').select('*').eq('student_id', studentId).order('assessment_date', { ascending: false });

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

        const pollocks = pollockData?.map((p, index) => {
            const prev = pollockData[index + 1]; 
            return {
                ...p,
                type: 'pollock',
                date: new Date(p.assessment_date + 'T12:00:00'),
                prevAssessment: prev || null, 
                diffs: prev ? {
                    weight: p.weight - prev.weight,
                    bf: p.bf_percentage - prev.bf_percentage,
                    lean: p.lean_mass - prev.lean_mass,
                    fat: p.fat_mass - prev.fat_mass
                } : null
            }
        }) || [];

        const unified = [...checkins, ...assessments, ...pollocks].sort((a, b) => b.date.getTime() - a.date.getTime());
        setTimeline(unified);

        const current = checkins[0]?.weight || 0;
        const initial = checkins[checkins.length - 1]?.weight || 0;
        setStats({
            current,
            diff: current - initial,
            count: checkins.length,
            assessCount: assessments.length + pollocks.length
        });
    }
    loadData();
  }, [studentId, supabase]);

  const handlePrint = (id: string) => {
    flushSync(() => {
        setPrintingId(id);
        setPrintingCustomComparison(false);
    });
    window.print();
    setTimeout(() => setPrintingId(null), 500);
  };

  const handlePrintCustomComparison = () => {
    flushSync(() => {
        setPrintingCustomComparison(true);
        setPrintingId(null);
    });
    window.print();
    setTimeout(() => setPrintingCustomComparison(false), 500);
  };

  const toggleSelection = (pollock: any) => {
      const isSelected = selectedAssessments.some(p => p.id === pollock.id);
      if (isSelected) {
          setSelectedAssessments(prev => prev.filter(p => p.id !== pollock.id));
      } else {
          if (selectedAssessments.length >= 3) {
              alert("Você pode selecionar no máximo 3 avaliações para o comparativo.");
              return;
          }
          setSelectedAssessments(prev => [...prev, pollock]);
      }
  };

  const generateSmartFeedback = (oldest: any, newest: any) => {
      const deltaWeight = newest.weight - oldest.weight;
      const deltaBF = newest.bf_percentage - oldest.bf_percentage;
      const deltaLean = newest.lean_mass - oldest.lean_mass;
      const deltaFat = newest.fat_mass - oldest.fat_mass;

      let text = "ANÁLISE TÉCNICA DE EVOLUÇÃO CORPORAL: ";
      const isWeightGain = deltaWeight > 0.5;
      const isWeightLoss = deltaWeight < -0.5;

      if (isWeightGain) {
          if (deltaFat > deltaLean) {
              text += `O aluno apresentou um ganho de peso total de ${deltaWeight.toFixed(1)}kg. No entanto, a maior parte desse ganho foi proveniente de massa gorda (+${deltaFat.toFixed(1)}kg) em comparação à massa magra (+${deltaLean.toFixed(1)}kg). Atenção: este é um cenário de alerta. É altamente recomendado reajustar o superávit calórico (reduzir calorias) e avaliar a intensidade do treinamento para otimizar o particionamento de nutrientes. `;
          } else {
              text += `Excelente resposta ao protocolo de hipertrofia! O aluno obteve um aumento sólido de ${deltaLean.toFixed(1)}kg de massa magra, com um controle adequado da gordura corporal. A estratégia nutricional e os treinos estão perfeitamente alinhados para ganho de volume limpo. `;
          }
      } else if (isWeightLoss) {
          if (deltaLean < 0 && Math.abs(deltaLean) >= Math.abs(deltaFat)) {
              text += `O aluno reduziu o peso corporal em ${Math.abs(deltaWeight).toFixed(1)}kg, entretanto, houve uma perda severa de massa muscular (${deltaLean.toFixed(1)}kg), que foi superior ou próxima à queima de gordura. O déficit calórico atual pode estar agressivo demais ou a ingestão de proteínas insuficiente. É crucial recalcular a dieta. `;
          } else {
              text += `Excelente resposta ao protocolo de definição (Cutting)! Houve uma queima expressiva de ${Math.abs(deltaFat).toFixed(1)}kg de gordura, poupando a massa magra do aluno ao máximo. O percentual de gordura (BF) teve uma ótima queda de ${Math.abs(deltaBF).toFixed(1)}%. A estratégia atual deve ser mantida. `;
          }
      } else {
          if (deltaFat < -0.5 && deltaLean > 0.5) {
              text += `Cenário excepcional de recomposição corporal alcançado! O aluno reduziu a massa gorda em ${Math.abs(deltaFat).toFixed(1)}kg e simultaneamente construiu ${deltaLean.toFixed(1)}kg de massa magra, resultando em uma queda de ${Math.abs(deltaBF).toFixed(1)}% no BF com o peso quase inalterado. Resultado de alta adesão e treino intenso. `;
          } else if (deltaFat > 0.5 && deltaLean < -0.5) {
              text += `Atenção: Houve uma piora na composição corporal geral. O aluno perdeu massa muscular (${deltaLean.toFixed(1)}kg) e ganhou gordura (+${deltaFat.toFixed(1)}kg) no mesmo período. Recomendamos investigar a adesão real ao plano, qualidade do sono, estresse diário e consistência nos treinos. `;
          } else {
              text += `O peso corporal manteve-se estável, com pequenas flutuações na composição. O percentual de gordura variou ${deltaBF > 0 ? '+' : ''}${deltaBF.toFixed(1)}%. Avalie com o aluno se o objetivo atual mudou para traçar um novo foco mais agressivo (seja para secar ou crescer). `;
          }
      }
      return text;
  };

  if (!student) return <div className="text-zinc-500 p-10 font-bold uppercase text-center">Carregando dados do aluno...</div>;

  const PrintHeader = ({ date, title = "Relatório Técnico" }: { date: string, title?: string }) => (
    <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-black" style={{ borderColor: brandColor }}>
        <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: brandColor }}>{title}</h1>
            <p className="text-sm font-bold uppercase text-zinc-600">Aluno: {student.full_name}</p>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-zinc-600 uppercase">Data da Avaliação</p>
            <p className="text-lg font-black text-black">{date}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black print:bg-white text-white print:text-black pb-20 print:pb-0 relative print:static">
      
      <div ref={colorRef} className="bg-brand hidden" aria-hidden="true"></div>

      <style jsx global>{`
        @media print {
            html, body, main, #__next { background-color: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; }
            .bg-black, .bg-zinc-950, .bg-zinc-900, .bg-zinc-800 { background-color: #ffffff !important; }
            aside, nav, header { display: none !important; width: 0 !important; height: 0 !important; }
            main { width: 100% !important; max-width: 100% !important; border: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            
            .page-break { page-break-before: always; break-before: page; margin-top: 10mm; }
            .page-break:first-child { page-break-before: avoid; break-before: avoid; margin-top: 0; }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; display: block; width: 100%; }
            
            .print-photo-container { page-break-inside: avoid !important; break-inside: avoid !important; text-align: center; margin-bottom: 5mm;}
            .print-photo { max-height: 25vh !important; width: auto !important; object-fit: contain !important; border-radius: 8px !important; margin: 0 auto; box-shadow: 0 0 0 1px #e4e4e7; }
            .print-photo-ia { max-height: 40vh !important; object-fit: contain; margin: 0 auto; }
            
            .comp-table { width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 20px; }
            .comp-table th { background-color: #f4f4f5 !important; box-shadow: inset 0 0 0 1000px #f4f4f5 !important; padding: 8px; font-size: 10px; text-transform: uppercase; color: #52525b; border: 1px solid #e4e4e7; }
            .comp-table td { padding: 8px; font-size: 12px; font-weight: bold; border: 1px solid #e4e4e7; }
            .diff-pos { color: #22c55e !important; }
            .diff-neg { color: #ef4444 !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 print:hidden">
        {selectedAssessments.length >= 2 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-brand p-4 rounded-full flex items-center gap-6 shadow-2xl z-50 animate-in slide-in-from-bottom-10 print:hidden w-[90%] md:w-auto justify-between pb-safe">
                <div className="flex flex-col">
                    <span className="text-white font-black text-sm">{selectedAssessments.length} Avaliações</span>
                    <span className="text-brand text-[10px] font-bold uppercase tracking-widest">Prontas para comparação</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrintCustomComparison} className="bg-brand text-black px-4 py-2 md:px-6 md:py-3 rounded-full font-black uppercase text-[10px] md:text-xs hover:scale-105 transition-transform flex items-center gap-2">
                        <Printer size={16} /> Relatório
                    </button>
                    <button onClick={() => setSelectedAssessments([])} className="text-zinc-500 hover:text-white p-2 bg-black rounded-full border border-zinc-800">
                        <X size={20} />
                    </button>
                </div>
            </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-6 gap-4">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/alunos" className="p-2 text-zinc-500 hover:text-brand transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-black italic tracking-tighter uppercase">{student.full_name}</h1>
            </div>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard label="Peso Atual" value={`${stats.current} kg`} icon={<Weight size={24} className="text-brand"/>} />
            <StatusCard label="Evolução" value={`${stats.diff > 0 ? '+' : ''}${stats.diff.toFixed(1)} kg`} color={stats.diff <= 0 ? "text-brand" : "text-red-500"} icon={<TrendingDown size={24}/>} />
            <StatusCard label="Check-ins" value={stats.count} icon={<Calendar size={24} className="text-zinc-500"/>} />
            <StatusCard label="Avaliações" value={stats.assessCount} icon={<BrainCircuit size={24} className="text-blue-500"/>} />
        </div>

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

        <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><ClipboardList className="text-zinc-600"/> Prontuário do Aluno</h2>
            {timeline.map((item: any) => {
                const isSelected = selectedAssessments.some(p => p.id === item.id);
                return (
                    <div key={item.id} className={`p-6 rounded-2xl border transition-colors ${isSelected ? 'bg-zinc-900/80 border-brand' : item.type === 'assessment' ? 'bg-zinc-950/50 border-blue-500/20' : item.type === 'pollock' ? 'bg-zinc-950/50 border-amber-500/20' : 'bg-zinc-950 border-zinc-900'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3">
                                {item.type === 'assessment' && <BrainCircuit className="text-blue-400" />}
                                {item.type === 'checkin' && <Calendar className="text-brand" />}
                                {item.type === 'pollock' && <ActivitySquare className="text-amber-400" />}
                                <div>
                                    <h3 className="font-bold text-sm uppercase">
                                        {item.type === 'assessment' ? "Análise Técnica Visual" : item.type === 'pollock' ? "Avaliação Física (7 Dobras)" : "Check-in Físico"}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 font-bold">
                                        {item.type === 'pollock' ? new Date(item.assessment_date + 'T12:00:00').toLocaleDateString('pt-BR') : new Date(item.created_at).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {item.type === 'assessment' && (
                                    <button onClick={() => handlePrint(item.id)} className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-800" title="Imprimir PDF">
                                        <Printer size={18} />
                                    </button>
                                )}
                                
                                {item.type === 'pollock' && (
                                    <>
                                        <button onClick={() => handlePrint(item.id)} className="px-3 py-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-800 flex gap-2 items-center text-[10px] font-bold uppercase tracking-widest" title="PDF Simples">
                                            <Printer size={14} /> PDF
                                        </button>
                                        
                                        <button 
                                            onClick={() => toggleSelection(item)} 
                                            className={`px-3 py-2 rounded-lg transition-colors border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                                                isSelected ? 'bg-brand text-black border-brand' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-brand hover:border-brand'
                                            }`}
                                        >
                                            {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                            <span className="hidden sm:inline">{isSelected ? 'Selecionado' : 'Comparar'}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {item.type === 'assessment' && item.photos && (
                             <div className="flex gap-2 mb-4 overflow-hidden">
                                {item.photos.map((url: string, idx: number) => (
                                    <img key={idx} src={url} className="w-16 h-20 object-cover rounded-lg border border-zinc-800 opacity-60 hover:opacity-100 transition-opacity" />
                                ))}
                             </div>
                        )}
                        
                        {item.type === 'pollock' && (
                            <div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <MetricBox label="Peso" value={item.weight} diff={item.diffs?.weight} unit="kg" neutral={true} />
                                    <MetricBox label="Gordura" value={item.bf_percentage.toFixed(1)} diff={item.diffs?.bf} unit="%" inverseColors={true} />
                                    <MetricBox label="Massa Magra" value={item.lean_mass.toFixed(1)} diff={item.diffs?.lean} unit="kg" inverseColors={false} />
                                    <MetricBox label="Massa Gorda" value={item.fat_mass.toFixed(1)} diff={item.diffs?.fat} unit="kg" inverseColors={true} />
                                </div>
                            </div>
                        )}

                        {(item.type === 'assessment' || item.type === 'checkin') && (
                            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.content || item.notes}</div>
                        )}
                    </div>
                )
            })}
        </div>
      </div>

      <div className="hidden print:block w-full bg-white text-black font-sans p-8">
        
        {printingCustomComparison && selectedAssessments.length >= 2 && (() => {
            const sortedSelected = [...selectedAssessments].sort((a, b) => a.date.getTime() - b.date.getTime());
            const oldest = sortedSelected[0];
            const newest = sortedSelected[sortedSelected.length - 1];
            
            const dateNewStr = new Date(newest.assessment_date + 'T12:00:00').toLocaleDateString('pt-BR');
            const dateOldStr = new Date(oldest.assessment_date + 'T12:00:00').toLocaleDateString('pt-BR');
            
            const totalDiffWeight = newest.weight - oldest.weight;
            const totalDiffBF = newest.bf_percentage - oldest.bf_percentage;
            const totalDiffLean = newest.lean_mass - oldest.lean_mass;
            const totalDiffFat = newest.fat_mass - oldest.fat_mass;

            const hasCircs = sortedSelected.some(a => CIRC_KEYS.some(k => !!a.circumferences?.[k]));
            const hasPhotos = sortedSelected.some(a => a.photos?.frente || a.photos?.perfil || a.photos?.costas);

            return (
                <div key="custom-comp">
                    <div className="page-break avoid-break">
                        <PrintHeader date={`${dateOldStr} → ${dateNewStr}`} title="Avaliação Comparativa" />
                        
                        <div className="grid grid-cols-4 gap-4 mb-10">
                            <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                                <p className="text-[9px] uppercase font-black text-zinc-500">Peso Atual</p>
                                <p className="text-xl font-black text-black mb-1">{newest.weight} kg</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest text-zinc-500`}>
                                    {totalDiffWeight > 0 ? '+' : ''}{totalDiffWeight.toFixed(1)}kg
                                </p>
                            </div>
                            <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                                <p className="text-[9px] uppercase font-black text-zinc-500">Gordura (BF)</p>
                                <p className="text-xl font-black text-black mb-1">{newest.bf_percentage.toFixed(1)} %</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${totalDiffBF > 0 ? 'diff-neg' : totalDiffBF < 0 ? 'diff-pos' : 'text-zinc-400'}`}>
                                    {totalDiffBF > 0 ? '+' : ''}{totalDiffBF.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                                <p className="text-[9px] uppercase font-black text-zinc-500">Massa Magra</p>
                                <p className="text-xl font-black text-black mb-1">{newest.lean_mass.toFixed(1)} kg</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${totalDiffLean > 0 ? 'diff-pos' : totalDiffLean < 0 ? 'diff-neg' : 'text-zinc-400'}`}>
                                    {totalDiffLean > 0 ? '+' : ''}{totalDiffLean.toFixed(1)}kg
                                </p>
                            </div>
                            <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                                <p className="text-[9px] uppercase font-black text-zinc-500">Massa Gorda</p>
                                <p className="text-xl font-black text-black mb-1">{newest.fat_mass.toFixed(1)} kg</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${totalDiffFat > 0 ? 'diff-neg' : totalDiffFat < 0 ? 'diff-pos' : 'text-zinc-400'}`}>
                                    {totalDiffFat > 0 ? '+' : ''}{totalDiffFat.toFixed(1)}kg
                                </p>
                            </div>
                        </div>

                        <div className={`grid ${hasCircs ? 'grid-cols-2' : 'grid-cols-1'} gap-10 mb-8`}>
                            <div>
                                <h3 className="text-xs font-black uppercase border-b-2 pb-2 mb-4 tracking-widest" style={{ color: brandColor, borderColor: brandColor }}>Dobras Cutâneas (mm)</h3>
                                <table className="comp-table">
                                    <thead>
                                        <tr>
                                            <th style={{textAlign: 'left'}}>Região</th>
                                            {sortedSelected.map(p => <th key={p.id}>{new Date(p.assessment_date + 'T12:00:00').toLocaleDateString('pt-BR', { month:'numeric', year:'2-digit' })}</th>)}
                                            <th>Evolução</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {FOLD_KEYS.map(k => {
                                            const oldV = oldest.folds?.[k] || 0;
                                            const newV = newest.folds?.[k] || 0;
                                            const diff = newV - oldV;
                                            return (
                                                <tr key={k}>
                                                    <td style={{textAlign: 'left', fontSize: '10px', textTransform: 'uppercase'}}>{formatName(k)}</td>
                                                    {sortedSelected.map(p => <td key={p.id}>{p.folds?.[k] || '--'}</td>)}
                                                    <td className={diff > 0 ? 'diff-neg' : diff < 0 ? 'diff-pos' : ''}>
                                                        {diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '--'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {hasCircs && (
                                <div>
                                    <h3 className="text-xs font-black uppercase border-b-2 pb-2 mb-4 tracking-widest" style={{ color: brandColor, borderColor: brandColor }}>Perímetros (cm)</h3>
                                    <table className="comp-table">
                                        <thead>
                                            <tr>
                                                <th style={{textAlign: 'left'}}>Região</th>
                                                {sortedSelected.map(p => <th key={p.id}>{new Date(p.assessment_date + 'T12:00:00').toLocaleDateString('pt-BR', { month:'numeric', year:'2-digit' })}</th>)}
                                                <th>Evolução</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {CIRC_KEYS.map(k => {
                                                const oldV = oldest.circumferences?.[k] || 0;
                                                const newV = newest.circumferences?.[k] || 0;
                                                const diff = newV - oldV;
                                                return (
                                                    <tr key={k}>
                                                        <td style={{textAlign: 'left', fontSize: '10px', textTransform: 'uppercase'}}>{formatName(k)}</td>
                                                        {sortedSelected.map(p => <td key={p.id}>{p.circumferences?.[k] || '--'}</td>)}
                                                        <td className="text-zinc-500">{diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '--'}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="border-l-4 p-5 mt-8 bg-zinc-50" style={{ borderColor: brandColor, boxShadow: 'inset 0 0 0 1000px #f8fafc' }}>
                            <p className="text-sm font-black uppercase mb-2 flex items-center gap-2" style={{ color: brandColor }}>
                                <BrainCircuit size={16} /> Parecer Técnico Automático
                            </p>
                            <p className="text-[13px] text-black leading-relaxed font-medium text-justify">{generateSmartFeedback(oldest, newest)}</p>
                        </div>
                    </div>

                    {hasPhotos && (
                        <div className="page-break avoid-break mt-10">
                            <h3 className="text-xl font-black uppercase border-b-2 pb-1 mb-8 tracking-tighter" style={{ color: brandColor, borderColor: brandColor }}>
                                Evolução Visual Comparativa
                            </h3>
                            <div className="flex flex-col gap-8">
                                {['frente', 'perfil', 'costas'].map(pose => {
                                    const poseExists = sortedSelected.some(p => p.photos?.[pose]);
                                    if (!poseExists) return null;
                                    
                                    return (
                                        <div key={pose} className="avoid-break">
                                            <h4 className="text-xs font-black uppercase mb-3 text-zinc-500 tracking-widest text-center border-b border-zinc-100 pb-1">{pose}</h4>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sortedSelected.length}, minmax(0, 1fr))`, gap: '16px' }}>
                                                {sortedSelected.map(p => (
                                                    <div key={p.id} className="flex flex-col items-center">
                                                        {p.photos?.[pose] ? (
                                                            <img src={p.photos[pose]} className="w-full object-contain rounded-lg shadow-sm border border-zinc-200" style={{ maxHeight: '22vh' }} />
                                                        ) : (
                                                            <div className="w-full bg-zinc-50 rounded-lg flex items-center justify-center border border-dashed border-zinc-300 text-zinc-400 text-[9px] font-bold uppercase" style={{ height: '22vh' }}>Sem Foto</div>
                                                        )}
                                                        <span className="text-[9px] font-black uppercase mt-2 text-black bg-zinc-100 px-2 py-1 rounded-md">
                                                            {new Date(p.assessment_date + 'T12:00:00').toLocaleDateString('pt-BR', { month:'short', year:'numeric' })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-12 pt-4 border-t border-zinc-300 flex justify-between items-end opacity-80 avoid-break">
                                <div>
                                    <div className="h-1 w-32 mb-2 rounded-full" style={{ backgroundColor: brandColor }}></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black">Treinador Responsável</p>
                                </div>
                                <p className="text-[8px] font-black italic text-zinc-500">GERADO VIA COACHPRO SYSTEM</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        })()}

        {!printingCustomComparison && printingId && timeline.map((item: any) => {
            if (item.id !== printingId) return null;

            if (item.type === 'assessment') {
                const report = parseReportStructure(item.content, item.photos);
                const dateStr = new Date(item.created_at).toLocaleDateString('pt-BR');
                return (
                    <div key={item.id}>
                        <div className="page-break">
                            <PrintHeader date={dateStr} />
                            <h2 className="text-xl font-black uppercase mb-6 border-b pb-2" style={{ borderColor: brandColor, color: brandColor }}>Vista Frontal</h2>
                            {report.frente?.photo && (
                                <div className="w-full flex justify-center mb-8 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-200">
                                    <img src={report.frente.photo} alt="Frente" className="print-photo-ia" />
                                </div>
                            )}
                            <h3 className="text-xs font-bold uppercase text-zinc-400 mb-2">Parecer do Coach:</h3>
                            <p className="text-base text-justify font-medium leading-relaxed">{report.frente?.text}</p>
                            <div className="flex-1"></div>
                        </div>
                    </div>
                );
            }

            if (item.type === 'pollock') {
                const dateStr = new Date(item.assessment_date + 'T12:00:00').toLocaleDateString('pt-BR');
                const folds = item.folds || {};
                const circs = item.circumferences || {};
                const photos = item.photos || {};
                const hasCircs = CIRC_KEYS.some(k => !!circs[k as keyof Circs]);

                return (
                    <div key={item.id}>
                        <div className="avoid-break mb-10">
                            <PrintHeader date={dateStr} title="Avaliação Física (7 Dobras)" />

                            <div className="mb-8 avoid-break">
                                <div className="flex justify-between mb-2">
                                    <span className="text-[10px] uppercase font-black text-zinc-600">Massa Magra ({item.lean_mass.toFixed(1)}kg)</span>
                                    <span className="text-[10px] uppercase font-black" style={{ color: brandColor }}>Gordura ({item.fat_mass.toFixed(1)}kg)</span>
                                </div>
                                <img 
                                    src={`data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='24'%3E%3Crect width='${100 - item.bf_percentage}%25' height='24' fill='%23f4f4f5'/%3E%3Crect x='${100 - item.bf_percentage}%25' width='${item.bf_percentage}%25' height='24' fill='${brandColor.replace('#', '%23')}'/%3E%3C/svg%3E`}
                                    style={{ width: '100%', height: '16px', borderRadius: '99px', objectFit: 'cover' }} 
                                    alt="Gráfico"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-10 avoid-break">
                                <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                                    <p className="text-[9px] uppercase font-black text-zinc-500">Peso Total</p>
                                    <p className="text-xl font-black text-black">{item.weight} kg</p>
                                </div>
                                <div className="p-3 rounded-lg text-center border" style={{ backgroundColor: brandColor, borderColor: brandColor, boxShadow: `inset 0 0 0 1000px ${brandColor}` }}>
                                    <p className="text-[9px] uppercase font-black text-black">Gordura (BF)</p>
                                    <p className="text-xl font-black text-black">{item.bf_percentage.toFixed(1)} %</p>
                                </div>
                                <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                                    <p className="text-[9px] uppercase font-black text-zinc-500">Massa Magra</p>
                                    <p className="text-xl font-black text-black">{item.lean_mass.toFixed(1)} kg</p>
                                </div>
                                <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                                    <p className="text-[9px] uppercase font-black text-zinc-500">Massa Gorda</p>
                                    <p className="text-xl font-black text-black">{item.fat_mass.toFixed(1)} kg</p>
                                </div>
                            </div>

                            <div className={`grid ${hasCircs ? 'grid-cols-2' : 'grid-cols-1'} gap-10 mb-8 avoid-break`}>
                                <div>
                                    <h3 className="text-xs font-black uppercase border-b-2 pb-2 mb-4 tracking-widest" style={{ color: brandColor, borderColor: '#e4e4e7' }}>Dobras Cutâneas (mm)</h3>
                                    {FOLD_KEYS.map(k => (
                                        <div key={k} className="flex justify-between border-b border-zinc-100 py-1.5">
                                            <span className="text-[10px] uppercase font-bold text-zinc-600">{formatName(k)}</span>
                                            <span className="text-xs font-black text-black">{folds[k as keyof Folds] || '--'}</span>
                                        </div>
                                    ))}
                                </div>
                                {hasCircs && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase border-b-2 pb-2 mb-4 tracking-widest" style={{ color: brandColor, borderColor: '#e4e4e7' }}>Perímetros (cm)</h3>
                                        {CIRC_KEYS.map(k => (
                                            <div key={k} className="flex justify-between border-b border-zinc-100 py-1.5">
                                                <span className="text-[10px] uppercase font-bold text-zinc-600">{formatName(k)}</span>
                                                <span className="text-xs font-black text-black">{circs[k as keyof Circs] || '--'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="page-break avoid-break">
                            <h3 className="text-xl font-black uppercase border-b-2 pb-1 mb-4 tracking-tighter" style={{ color: brandColor, borderColor: brandColor }}>Guia de Hipertrofia e Definição</h3>
                            <div className="border border-zinc-300 p-4 rounded-xl mb-6 bg-zinc-50" style={{ boxShadow: 'inset 0 0 0 1000px #f8fafc' }}>
                                <p className="text-sm font-black uppercase mb-1 flex items-center gap-2" style={{ color: brandColor }}>⚠️ Regra de Ouro</p>
                                <p className="text-xs text-black leading-relaxed font-medium">Exercício direcionado gera <b>hipertrofia</b> do músculo, mas <b>NÃO</b> queima a gordura da região. Para o músculo ficar visível, é obrigatório <b>Déficit Calórico, Dieta e Cardio</b>.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h4 className="text-xs font-black uppercase border-b-2 border-zinc-200 pb-1 mb-2 text-zinc-500 tracking-widest">Alvo de Definição</h4>
                                    <ul className="text-xs space-y-2 font-medium text-black">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor, boxShadow: `inset 0 0 0 10px ${brandColor}` }}></div> <b>Homens:</b> 8 a 10mm.</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor, boxShadow: `inset 0 0 0 10px ${brandColor}` }}></div> <b>Mulheres:</b> 12 a 15mm.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase border-b-2 border-zinc-200 pb-1 mb-2 text-zinc-500 tracking-widest">Mapeamento</h4>
                                    <ul className="text-xs space-y-1 font-medium text-black">
                                        <li><b>Peitoral:</b> Supinos, Flexões.</li>
                                        <li><b>Tríceps:</b> Testa, Polia.</li>
                                        <li><b>Costas:</b> Puxadas, Remadas.</li>
                                        <li><b>Coxas:</b> Agachamentos.</li>
                                    </ul>
                                </div>
                            </div>
                            
                            {(photos.frente || photos.perfil || photos.costas) && (
                                <div className="mt-6 avoid-break">
                                    <h3 className="text-xl font-black uppercase border-b-2 pb-1 mb-4 tracking-tighter" style={{ color: brandColor, borderColor: brandColor }}>Registro Fotográfico</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['frente', 'perfil', 'costas'].map(pose => (
                                            photos[pose as keyof typeof photos] ? (
                                                <div key={pose} className="print-photo-container">
                                                    <img src={photos[pose as keyof typeof photos]!} className="print-photo" />
                                                    <p className="text-xs font-black uppercase mt-2 tracking-widest" style={{ color: brandColor }}>{pose}</p>
                                                </div>
                                            ) : null
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-10 pt-4 border-t border-zinc-300 flex justify-between items-end opacity-80 avoid-break">
                                <div>
                                    <div className="h-1 w-32 mb-2 rounded-full" style={{ borderBottom: `4px solid ${brandColor}` }}></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black">Treinador Responsável</p>
                                </div>
                                <p className="text-[8px] font-black italic text-zinc-500">GERADO VIA COACHPRO SYSTEM</p>
                            </div>
                        </div>
                    </div>
                );
            }
            return null;
        })}
      </div>
    </div>
  );
}
