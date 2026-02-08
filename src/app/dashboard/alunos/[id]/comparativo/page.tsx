"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import { analyzeEvolution, ImagePair, CompareContext } from "@/app/dashboard/actions/ai-compare";
import { ArrowLeft, Sparkles, Loader2, Printer, X, PlusCircle, Upload, Flame, Activity } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import imageCompression from 'browser-image-compression';

const POSE_TEMPLATES: any = {
    'emagrecimento': ['Frente', 'Perfil', 'Costas'],
    'hipertrofia_female': ['Frente', 'Perfil', 'Costas', 'Pernas', 'Glúteos'],
    'hipertrofia_male': ['Frente', 'Perfil', 'Costas', 'Duplo Bíceps (F)', 'Duplo Bíceps (C)'],
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

  // Dados do Aluno
  const [student, setStudent] = useState<any>(null);
  
  // Slots (Agora armazenam a string Base64 da imagem local)
  const [slots, setSlots] = useState<Record<string, { before: string | null, after: string | null }>>({});
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
  const [cardio, setCardio] = useState("30min pos-treino");
  const [calories, setCalories] = useState("2000");

  // UI
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      setStudent(profile);

      // Configurar Poses
      let templateKey = 'default';
      const goal = profile.selected_goal || 'emagrecimento';
      const gender = profile.gender || 'female';

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

  // --- UPLOAD DIRETO NO QUADRADO ---
  const handleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>, pose: string, type: 'before' | 'after') => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Comprime a imagem (Crucial para não travar a IA com arquivo grande)
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280 });
        const base64 = await imageCompression.getDataUrlFromFile(compressed);

        setSlots(prev => ({
            ...prev,
            [pose]: {
                ...prev[pose],
                [type]: base64
            }
        }));
      } catch (err) {
          alert("Erro ao processar imagem. Tente outra.");
      }
  };

  const clearSlot = (pose: string, type: 'before' | 'after') => {
    setSlots(prev => ({
        ...prev,
        [pose]: { ...prev[pose], [type]: null }
    }));
  };

  const runAI = async () => {
    setAnalyzing(true);
    setResult("");

    const validPairs: ImagePair[] = [];
    activePoses.forEach(pose => {
        const slot = slots[pose];
        if (slot?.before && slot?.after) {
            validPairs.push({
                poseLabel: pose,
                before: slot.before!, // Já é base64
                after: slot.after!    // Já é base64
            });
        }
    });

    if (validPairs.length === 0) {
        alert("Preencha pelo menos um par de fotos (Antes e Depois).");
        setAnalyzing(false);
        return;
    }

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
        // Enviando novos campos com nomes claros para a IA
        ingestedCalories: calories,
        cardioProtocol: cardio
    };

    const response = await analyzeEvolution(validPairs, context);
    if (response.error) alert(response.error);
    else setResult(response.text || "");
    
    setAnalyzing(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 pb-20 print:bg-white print:p-0">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/dashboard/alunos/${studentId}`} className="text-slate-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-500" /> Comparativo IA 4.0
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ESQUERDA: CONFIGURAÇÃO (25%) */}
        <div className="lg:col-span-3 space-y-4 print:hidden">
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase mb-2">⚙️ Dados do Atleta</h3>
                
                {/* Inputs Rápidos */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold block">IDADE</label>
                        <select value={ageRange} onChange={e => setAgeRange(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"><option value="18-25">18-25</option><option value="26-35">26-35</option><option value="36-45">36-45</option><option value="+45">+45</option></select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold block">TREINOS</label>
                        <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"><option value="3x">3x</option><option value="4x">4x</option><option value="5x">5x</option><option value="6x">6x</option></select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-blue-400 font-bold block">FASE</label>
                        <select value={phase} onChange={e => setPhase(e.target.value)} className="w-full bg-slate-950 border border-blue-900/50 rounded p-1.5 text-xs text-white"><option value="cutting">Cutting</option><option value="bulking">Bulking</option><option value="manutencao">Manutenção</option></select>
                    </div>
                    <div>
                         <label className="text-[10px] text-slate-500 font-bold block">DIETA</label>
                        <select value={diet} onChange={e => setDiet(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"><option value="100%">100%</option><option value="80_20">80/20</option><option value="off">Off</option></select>
                    </div>
                </div>

                {/* NOVOS INPUTS: CALORIAS E CARDIO */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                        <label className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mb-1">
                            <span className="bg-blue-900/30 p-1 rounded"><Flame size={10}/></span> 
                            INGESTÃO CALÓRICA (DIETA)
                        </label>
                        <input value={calories} onChange={e => setCalories(e.target.value)} placeholder="Ex: 2500 kcal" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] text-purple-400 font-bold flex items-center gap-1 mb-1">
                            <span className="bg-purple-900/30 p-1 rounded"><Activity size={10}/></span> 
                            PROTOCOLO DE CARDIO
                        </label>
                        <input value={cardio} onChange={e => setCardio(e.target.value)} placeholder="Ex: 30min pós-treino" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white placeholder:text-slate-600 focus:border-purple-500 outline-none transition-colors" />
                    </div>
                </div>

                <div className="pt-2">
                    <label className="text-[10px] text-slate-500 font-bold block">LESÕES</label>
                    <input value={injuries} onChange={e => setInjuries(e.target.value)} placeholder="Ex: Joelho..." className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white" />
                </div>
                
                 <div>
                    <label className="text-[10px] text-slate-500 font-bold block">TOM DO FEEDBACK</label>
                    <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"><option value="tecnico">Técnico</option><option value="acolhedor">Acolhedor</option><option value="pulso_firme">Pulso Firme</option></select>
                </div>
            </div>

            <button onClick={runAI} disabled={analyzing} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                {analyzing ? <Loader2 className="animate-spin" /> : <><Sparkles size={18}/> Gerar Análise</>}
            </button>
        </div>

        {/* DIREITA: GRIDS (Upload Direto) (75%) */}
        <div className="lg:col-span-9 space-y-8">
            <div className="print:hidden">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <PlusCircle size={20} className="text-blue-500"/> Upload & Comparação
                    <span className="text-xs font-normal text-slate-500">(Clique nos quadros para abrir o arquivo)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activePoses.map(pose => (
                        <div key={pose} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                            <h4 className="text-center text-[10px] font-bold text-slate-400 uppercase mb-2 border-b border-slate-800 pb-1">{pose}</h4>
                            <div className="flex gap-2">
                                
                                {/* Slot ANTES (Upload) */}
                                <label className={`flex-1 aspect-[3/4] bg-slate-950 rounded border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden hover:border-blue-500 hover:bg-blue-900/10 transition-all ${slots[pose].before ? 'border-blue-500 border-solid' : 'border-slate-800'}`}>
                                    {slots[pose].before ? (
                                        <>
                                            <img src={slots[pose].before!} className="w-full h-full object-cover"/>
                                            <div 
                                                onClick={(e) => { e.preventDefault(); clearSlot(pose, 'before'); }} 
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 z-20 hover:bg-red-600"
                                            >
                                                <X size={12}/>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <Upload size={20} className="text-slate-600 mx-auto mb-1"/>
                                            <span className="text-[9px] text-slate-500 font-bold block">ANTES</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSlotUpload(e, pose, 'before')} />
                                </label>
                                
                                {/* Seta */}
                                <div className="flex items-center text-slate-700">➜</div>

                                {/* Slot DEPOIS (Upload) */}
                                <label className={`flex-1 aspect-[3/4] bg-slate-950 rounded border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden hover:border-purple-500 hover:bg-purple-900/10 transition-all ${slots[pose].after ? 'border-purple-500 border-solid' : 'border-slate-800'}`}>
                                    {slots[pose].after ? (
                                        <>
                                            <img src={slots[pose].after!} className="w-full h-full object-cover"/>
                                            <div 
                                                onClick={(e) => { e.preventDefault(); clearSlot(pose, 'after'); }} 
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 z-20 hover:bg-red-600"
                                            >
                                                <X size={12}/>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <Upload size={20} className="text-slate-600 mx-auto mb-1"/>
                                            <span className="text-[9px] text-slate-500 font-bold block">DEPOIS</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSlotUpload(e, pose, 'after')} />
                                </label>

                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RESULTADO */}
            {result && (
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl animate-in slide-in-from-bottom-4 print:bg-white print:border-none print:p-0 print:text-black">
                    <div className="border-b border-slate-700 print:border-gray-300 pb-4 mb-6 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white print:text-black">Relatório de Evolução</h2>
                            <p className="text-slate-400 print:text-gray-600">Atleta: {student?.full_name}</p>
                            <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-slate-300 print:text-gray-500 uppercase font-bold">
                                <span className="bg-blue-900/50 print:bg-gray-100 px-2 py-1 rounded border border-blue-900">Fase: {phase}</span>
                                <span className="bg-slate-800 print:bg-gray-100 px-2 py-1 rounded">Kcal: {calories}</span>
                                <span className="bg-slate-800 print:bg-gray-100 px-2 py-1 rounded">Cardio: {cardio}</span>
                            </div>
                        </div>
                        <div className="print:hidden">
                            <button onClick={() => window.print()} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><Printer size={20}/></button>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none print:prose-p:text-black print:prose-headings:text-black print:prose-strong:text-black">
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 print:border-gray-300 print:break-inside-avoid">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Evidências Visuais</h4>
                        <div className="grid grid-cols-4 gap-4">
                            {activePoses.map(pose => {
                                const s = slots[pose];
                                if (!s.before || !s.after) return null;
                                return (
                                    <div key={pose} className="space-y-1">
                                        <p className="text-[8px] text-center uppercase font-bold text-slate-500">{pose}</p>
                                        <div className="flex gap-1">
                                            <img src={s.before!} className="w-1/2 aspect-[3/4] object-cover rounded border border-slate-700 print:border-gray-300"/>
                                            <img src={s.after!} className="w-1/2 aspect-[3/4] object-cover rounded border border-slate-700 print:border-gray-300"/>
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