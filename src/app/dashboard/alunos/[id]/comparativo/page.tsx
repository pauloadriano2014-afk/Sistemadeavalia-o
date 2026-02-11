"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import { analyzeEvolution, ImagePair, CompareContext } from "@/app/dashboard/actions/ai-compare";
import { ArrowLeft, Sparkles, Loader2, Printer, X, PlusCircle, Upload, Flame, Activity, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import imageCompression from 'browser-image-compression';

// TEMPLATES CORRIGIDOS PARA PORTUGUÊS
const POSE_TEMPLATES: any = {
    'emagrecimento': ['Frente', 'Perfil', 'Costas'],
    'hipertrofia_feminino': ['Frente', 'Perfil', 'Costas', 'Pernas', 'Glúteos'],
    'hipertrofia_masculino': ['Frente', 'Perfil', 'Costas', 'Duplo Bíceps (F)', 'Duplo Bíceps (C)'],
    'classic': ['Frente', 'Costas', 'Duplo Bíceps (F)', 'Vacuum'],
    'bodybuilding': ['Frente', 'Costas', 'Most Muscular', 'Abs e Coxa'],
    'wellness': ['Frente', 'Costas', 'Perfil Dir.', 'Perfil Esq.'],
    'bikini': ['Frente', 'Costas', 'Transição'],
    'default': ['Frente', 'Perfil', 'Costas']
};

export default function ComparativoPage() {
  const params = useParams();
  const studentId = params.id as string;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [student, setStudent] = useState<any>(null);
  const [slots, setSlots] = useState<Record<string, { before: string | null, after: string | null }>>({});
  
  // Datas das fotos
  const [dateBefore, setDateBefore] = useState("");
  const [dateAfter, setDateAfter] = useState(new Date().toISOString().split('T')[0]); 

  const [activePoses, setActivePoses] = useState<string[]>([]);

  // Contexto
  const [ageRange, setAgeRange] = useState("26-35");
  const [frequency, setFrequency] = useState("4x");
  const [injuries, setInjuries] = useState("");
  const [tone, setTone] = useState("tecnico");
  const [phase, setPhase] = useState("manutencao");
  const [diet, setDiet] = useState("80_20");
  const [sleep, setSleep] = useState("bom");
  
  // NOVOS CAMPOS
  const [calorieRange, setCalorieRange] = useState("2000-2500");
  const [cardioType, setCardioType] = useState("esteira_caminhada");
  const [cardioIntensity, setCardioIntensity] = useState("moderada");
  const [cardioBurn, setCardioBurn] = useState("300-400");

  const [weightBefore, setWeightBefore] = useState("");
  const [weightAfter, setWeightAfter] = useState("");
  const [coachContext, setCoachContext] = useState("");

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      setStudent(profile);

      let templateKey = 'default';
      const goal = profile.selected_goal || 'emagrecimento';
      const rawGender = profile.gender?.toLowerCase() || 'female';

      // --- CORREÇÃO DO GÊNERO AQUI TAMBÉM ---
      let gender = 'feminino';
      if (rawGender === 'male' || rawGender === 'masculino') gender = 'masculino';

      if (goal === 'emagrecimento') templateKey = 'emagrecimento';
      else if (goal === 'hipertrofia') templateKey = `hipertrofia_${gender}`;
      else if (POSE_TEMPLATES[goal]) templateKey = goal;

      const initialPoses = POSE_TEMPLATES[templateKey] || POSE_TEMPLATES['default'];
      setActivePoses(initialPoses);
      
      const initialSlots: any = {};
      initialPoses.forEach((pose: string) => initialSlots[pose] = { before: null, after: null });
      setSlots(initialSlots);
      setLoading(false);
    }
    loadData();
  }, [studentId, supabase]);

  const handleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>, pose: string, type: 'before' | 'after') => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280 });
        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        setSlots(prev => ({ ...prev, [pose]: { ...prev[pose], [type]: base64 } }));
      } catch (err) { alert("Erro ao processar imagem."); }
  };

  const clearSlot = (pose: string, type: 'before' | 'after') => {
    setSlots(prev => ({ ...prev, [pose]: { ...prev[pose], [type]: null } }));
  };

  const runAI = async () => {
    setAnalyzing(true);
    setResult("");

    const validPairs: ImagePair[] = [];
    activePoses.forEach(pose => {
        const slot = slots[pose];
        if (slot?.before && slot?.after) {
            validPairs.push({ poseLabel: pose, before: slot.before!, after: slot.after! });
        }
    });

    if (validPairs.length === 0) {
        alert("Preencha pelo menos um par de fotos (Antes e Depois).");
        setAnalyzing(false);
        return;
    }

    let formattedCardio = "Não realiza cardio";
    if (cardioType !== "nenhum") {
        formattedCardio = `${cardioType.replace('_', ' ')} (${cardioIntensity}) - Gasto: ~${cardioBurn}kcal`;
    }
    
    const formattedCalories = `${calorieRange} kcal`;

    const context: CompareContext = {
        name: student.full_name,
        gender: student.gender,
        goal: student.selected_goal,
        age: ageRange,
        frequency: frequency,
        injuries: injuries,
        tone: tone,
        phase: phase,
        dietCompliance: diet,
        sleep: sleep,
        ingestedCalories: formattedCalories,
        cardioProtocol: formattedCardio,
        weightBefore: weightBefore || "Não inf.",
        weightAfter: weightAfter || "Não inf.",
        coachContext: coachContext || "Sem contexto adicional."
    };

    const response = await analyzeEvolution(validPairs, context);
    if (response.error) alert(response.error);
    else setResult(response.text || "");
    setAnalyzing(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-brand font-bold uppercase tracking-widest animate-pulse">Carregando estúdio...</div>;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black text-white pb-20 print:bg-white print:p-0">
      
      {/* HEADER */}
        <div className="w-full max-w-7xl mx-auto px-6 py-6 mb-8 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 bg-black/90 backdrop-blur-md z-50 print:hidden">
            <Link href={`/dashboard/alunos/${studentId}`} className="text-zinc-400 hover:text-lime-400 flex items-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors shrink-0 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                <span>Voltar ao Prontuário</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-right">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-brand shrink-0" size={20} /> 
                    <h1 className="text-lg md:text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Comparativo IA
                    </h1>
                </div>
                <span className="bg-brand/10 border border-brand/20 text-lime-400 px-2 py-0.5 rounded text-[10px] md:text-xs font-black uppercase tracking-widest leading-none">
                    PRO 4.0
                </span>
            </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6">
        
        {/* ESQUERDA: CONTROLES */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
            
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-5 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                    </span>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Parâmetros</h3>
                </div>
                
                {/* Contexto */}
                <div className="space-y-2">
                    <label className="text-[10px] text-lime-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12}/> Sugestão / História
                    </label>
                    <textarea 
                        value={coachContext} 
                        onChange={e => setCoachContext(e.target.value)} 
                        placeholder="Ex: Saiu de um processo de ganho de peso, mas não se adaptou bem e agora está em cutting..." 
                        rows={3}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:border-brand focus:ring-1 focus:ring-brand/50 outline-none transition-all resize-none font-medium whitespace-pre-wrap break-words"
                    />
                </div>

                {/* Pesos */}
                <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                    <div>
                        <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Peso Antes</label>
                        <input type="number" value={weightBefore} onChange={e => setWeightBefore(e.target.value)} className="w-full bg-transparent border-b border-zinc-700 p-1 text-sm font-bold text-white focus:border-brand outline-none text-center" placeholder="00.0" />
                    </div>
                    <div>
                        <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Peso Atual</label>
                        <input type="number" value={weightAfter} onChange={e => setWeightAfter(e.target.value)} className="w-full bg-transparent border-b border-zinc-700 p-1 text-sm font-bold text-lime-400 focus:border-brand outline-none text-center" placeholder="00.0" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-zinc-400 font-bold block mb-1 uppercase">Fase</label>
                        <select value={phase} onChange={e => setPhase(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand font-bold uppercase cursor-pointer">
                            <option value="emagrecimento">Emagrecimento</option>
                            <option value="hipertrofia">Hipertrofia</option>
                            <option value="definicao">Definição</option>
                            <option value="manutencao">Manutenção</option>
                        </select>
                    </div>
                    <div>
                         <label className="text-[10px] text-zinc-400 font-bold block mb-1 uppercase">Dieta</label>
                        <select value={diet} onChange={e => setDiet(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand font-bold uppercase cursor-pointer">
                            <option value="100%">100% Foco</option>
                            <option value="80_20">80/20</option>
                            <option value="70_30">70/30 (Flexível)</option>
                            <option value="off">Off Season</option>
                        </select>
                    </div>
                </div>

                {/* CALORIAS (SELETOR) */}
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold flex items-center gap-2 mb-1 uppercase tracking-wider">
                        <Flame size={12} className="text-orange-500"/> Ingestão Calórica
                    </label>
                    <select value={calorieRange} onChange={e => setCalorieRange(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand font-bold uppercase cursor-pointer">
                        <option value="1200-1500">1200 a 1500 kcal</option>
                        <option value="1500-1800">1500 a 1800 kcal</option>
                        <option value="1800-2100">1800 a 2100 kcal</option>
                        <option value="2100-2500">2100 a 2500 kcal</option>
                        <option value="2500-3000">2500 a 3000 kcal</option>
                        <option value="+3000">Acima de 3000 kcal</option>
                    </select>
                </div>

                {/* CARDIO COMPLETO */}
                <div className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                    <label className="text-[10px] text-zinc-400 font-bold flex items-center gap-2 mb-1 uppercase tracking-wider">
                        <Activity size={12} className="text-blue-500"/> Cardio & Gasto
                    </label>
                    
                    <div className="grid grid-cols-1 gap-2">
                        <select value={cardioType} onChange={e => setCardioType(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-[10px] text-white focus:border-brand font-bold uppercase cursor-pointer">
                            <option value="nenhum">Não realiza cardio</option>
                            <option value="esteira_caminhada">Esteira (Caminhada)</option>
                            <option value="esteira_corrida">Esteira (Corrida)</option>
                            <option value="rua">Corrida/Caminhada Rua</option>
                            <option value="escada">Escada Ergométrica</option>
                            <option value="eliptico">Elíptico / Transport</option>
                            <option value="bike">Bike / Spinning</option>
                        </select>

                        {/* Só mostra intensidade se não for "nenhum" */}
                        {cardioType !== "nenhum" && (
                            <div className="flex gap-2">
                                <select value={cardioIntensity} onChange={e => setCardioIntensity(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-lg p-1.5 text-[10px] text-white focus:border-brand font-bold uppercase cursor-pointer">
                                    <option value="leve">Leve</option>
                                    <option value="moderada">Moderada</option>
                                    <option value="alta">Alta Intensidade</option>
                                </select>
                                <select value={cardioBurn} onChange={e => setCardioBurn(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-lg p-1.5 text-[10px] text-white focus:border-brand font-bold uppercase cursor-pointer">
                                    <option value="100-200">100-200 kcal</option>
                                    <option value="200-350">200-350 kcal</option>
                                    <option value="350-500">350-500 kcal</option>
                                    <option value="+500">+500 kcal</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                
                 <div>
                    <label className="text-[10px] text-zinc-500 font-bold block mb-1 uppercase">Tom da Resposta</label>
                    <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand font-bold cursor-pointer"><option value="tecnico">Técnico (Biomecânico)</option><option value="acolhedor">Acolhedor (Motivador)</option><option value="pulso_firme">Pulso Firme (Exigente)</option></select>
                </div>
            </div>

            <button onClick={runAI} disabled={analyzing} className="w-full bg-brand hover:bg-lime-400 text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_30px_rgba(132,204,22,0.4)] hover:shadow-[0_0_50px_rgba(132,204,22,0.6)] transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {analyzing ? <Loader2 className="animate-spin" /> : <><Sparkles size={18}/> GERAR ANÁLISE IA</>}
            </button>
        </div>

        {/* DIREITA: FOTOS (70%) */}
        <div className="lg:col-span-8 space-y-8 pb-10">
            <div className="print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activePoses.map(pose => (
                        <div key={pose} className="bg-zinc-900/80 border border-white/5 rounded-3xl p-5 hover:border-brand/20 transition-all duration-500">
                            <h4 className="text-center text-[10px] font-black text-zinc-400 uppercase mb-4 tracking-[0.2em]">{pose}</h4>
                            <div className="flex gap-4 items-start">
                                
                                {/* LADO ESQUERDO (ANTES) */}
                                <div className="flex-1 space-y-2">
                                    <label className={`block aspect-[3/4] bg-black/50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden group hover:border-brand/50 transition-all ${slots[pose].before ? 'border-brand/30' : 'border-white/10'}`}>
                                            {slots[pose].before ? (
                                                <>
                                                    <img src={slots[pose].before!} className="w-full h-full object-cover"/>
                                                    <div onClick={(e) => { e.preventDefault(); clearSlot(pose, 'before'); }} className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"><X size={12}/></div>
                                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black text-zinc-300 uppercase tracking-widest border border-white/10">Antes</div>
                                                </>
                                            ) : (
                                                <div className="text-center group-hover:scale-110 transition-transform">
                                                    <Upload size={20} className="text-zinc-600 mx-auto mb-2 group-hover:text-brand transition-colors"/>
                                                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest group-hover:text-white">Carregar</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSlotUpload(e, pose, 'before')} />
                                    </label>
                                    
                                    {/* DATA FORÇADA BRANCA */}
                                    <div className="flex items-center gap-1 bg-black/30 border border-white/5 rounded-lg px-2 py-1">
                                            <Calendar size={10} className="text-zinc-500"/>
                                            <input 
                                                type="date" 
                                                value={dateBefore} 
                                                onChange={e => setDateBefore(e.target.value)} 
                                                className="bg-transparent text-[10px] text-zinc-300 w-full focus:outline-none uppercase font-bold text-center" 
                                                style={{ colorScheme: "dark", filter: "invert(0)" }} 
                                            />
                                    </div>
                                </div>
                                
                                <ArrowLeft className="text-zinc-700 rotate-180 mt-20" size={24}/>

                                {/* LADO DIREITO (DEPOIS) */}
                                <div className="flex-1 space-y-2">
                                    <label className={`block aspect-[3/4] bg-black/50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden group hover:border-brand transition-all ${slots[pose].after ? 'border-brand' : 'border-white/10'}`}>
                                            {slots[pose].after ? (
                                                <>
                                                    <img src={slots[pose].after!} className="w-full h-full object-cover"/>
                                                    <div onClick={(e) => { e.preventDefault(); clearSlot(pose, 'after'); }} className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"><X size={12}/></div>
                                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-brand text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">Hoje</div>
                                                </>
                                            ) : (
                                                <div className="text-center group-hover:scale-110 transition-transform">
                                                    <Upload size={20} className="text-zinc-600 mx-auto mb-2 group-hover:text-brand transition-colors"/>
                                                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest group-hover:text-white">Carregar</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSlotUpload(e, pose, 'after')} />
                                    </label>
                                    <div className="flex items-center gap-1 bg-black/30 border border-white/5 rounded-lg px-2 py-1">
                                            <Calendar size={10} className="text-brand"/>
                                            <input 
                                                type="date" 
                                                value={dateAfter} 
                                                onChange={e => setDateAfter(e.target.value)} 
                                                className="bg-transparent text-[10px] text-lime-400 w-full focus:outline-none uppercase font-bold text-center" 
                                                style={{ colorScheme: "dark", filter: "invert(0)" }}
                                            />
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RESULTADO (Relatório) */}
            {result && (
                <div className="bg-zinc-900 border border-white/10 p-10 rounded-3xl animate-in slide-in-from-bottom-10 shadow-2xl print:bg-white print:border-none print:p-0 print:text-black relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-emerald-500 to-brand"></div>
                    
                    <div className="border-b border-white/10 print:border-gray-300 pb-8 mb-8 flex justify-between items-start">
                        <div>
                            <h2 className="text-4xl font-black text-white print:text-black uppercase italic tracking-tighter">Relatório de Evolução</h2>
                            <p className="text-zinc-400 print:text-gray-600 font-bold text-sm mt-2 uppercase tracking-wide">Atleta: <span className="text-brand">{student?.full_name}</span></p>
                            
                            <div className="flex flex-wrap gap-2 mt-6">
                                {weightBefore && weightAfter && (
                                    <span className="bg-brand/10 text-lime-400 border border-brand/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {weightBefore}kg ➜ {weightAfter}kg
                                    </span>
                                )}
                                <span className="bg-black text-zinc-300 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">{phase}</span>
                            </div>
                        </div>
                        <div className="print:hidden">
                            <button onClick={() => window.print()} className="p-3 bg-black hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors border border-white/10"><Printer size={20}/></button>
                        </div>
                    </div>

                    <div className="prose prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:text-lime-400 prose-p:text-zinc-300 prose-strong:text-white max-w-none print:prose-p:text-black print:prose-headings:text-black print:prose-strong:text-black whitespace-pre-wrap break-words">
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>

                    {/* Evidências no Print */}
                    <div className="mt-12 pt-8 border-t border-white/10 print:border-gray-300 print:break-inside-avoid">
                        <h4 className="text-xs font-black text-zinc-500 uppercase mb-6 tracking-widest">Evidências Visuais</h4>
                        <div className="grid grid-cols-4 gap-4">
                            {activePoses.map(pose => {
                                const s = slots[pose];
                                if (!s.before || !s.after) return null;
                                return (
                                    <div key={pose} className="space-y-2">
                                        <p className="text-[9px] text-center uppercase font-black text-zinc-600 tracking-widest">{pose}</p>
                                        <div className="flex gap-1">
                                            <div className="w-1/2">
                                                <img src={s.before!} className="w-full aspect-[3/4] object-cover rounded-lg border border-white/10 print:border-gray-300"/>
                                                {dateBefore && <p className="text-[8px] text-center mt-1 text-zinc-500 print:text-black">{new Date(dateBefore).toLocaleDateString()}</p>}
                                            </div>
                                            <div className="w-1/2">
                                                <img src={s.after!} className="w-full aspect-[3/4] object-cover rounded-lg border border-white/10 print:border-gray-300"/>
                                                {dateAfter && <p className="text-[8px] text-center mt-1 text-zinc-500 print:text-black">{new Date(dateAfter).toLocaleDateString()}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}