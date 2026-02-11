"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import { generateInitialAssessment } from "@/app/dashboard/actions/ai-assessment"; 
import { ArrowLeft, BrainCircuit, Loader2, Upload, ScanEye } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import imageCompression from 'browser-image-compression';

const POSES = ['Frente', 'Perfil', 'Costas'];

export default function DiagnosticoPage() {
  const params = useParams();
  const studentId = params.id as string;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [student, setStudent] = useState<any>(null);
  const [photos, setPhotos] = useState<Record<string, string | null>>({
    'Frente': null, 'Perfil': null, 'Costas': null
  });
  
  const [history, setHistory] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      setStudent(data);
    }
    loadData();
  }, [studentId, supabase]);

  // FUNÇÃO DE UPLOAD BLINDADA
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, pose: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Tenta comprimir e converter para JPG (Melhor cenário)
        const options = { 
            maxSizeMB: 0.8, 
            maxWidthOrHeight: 1280,
            useWebWorker: true,
            fileType: "image/jpeg"
        };
        const compressed = await imageCompression(file, options);
        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        setPhotos(prev => ({ ...prev, [pose]: base64 }));

      } catch (err) { 
          console.warn("Erro na compressão (provavel HEIC), tentando envio bruto...", err);
          
          // PLANO B: Se falhar (HEIC no Windows), lê o arquivo direto
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setPhotos(prev => ({ ...prev, [pose]: base64 }));
          };
          reader.readAsDataURL(file);
      }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setResult("");

    const validImages = Object.entries(photos)
        .filter(([_, base64]) => base64 !== null)
        .map(([label, base64]) => ({ label, base64: base64! }));

    if (validImages.length === 0) {
        alert("Adicione pelo menos uma foto.");
        setAnalyzing(false);
        return;
    }

    const context = {
        name: student?.full_name || "Atleta",
        gender: student?.gender || "Não informado",
        goal: student?.selected_goal || "Estética",
        age: "Não informado", 
        history: history
    };

    const response = await generateInitialAssessment(validImages, context);
    
    if (response.error) {
        alert(response.error);
    } else {
        setResult(response.text || "");
    }
    
    setAnalyzing(false);
  };

  if (!student) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8 border-b border-zinc-900 flex justify-between items-center sticky top-0 bg-black/95 backdrop-blur z-50">
         <Link href={`/dashboard/alunos/${studentId}`} className="text-zinc-400 hover:text-white flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
            <ArrowLeft size={16} /> Voltar
         </Link>
         <h1 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <ScanEye className="text-lime-500" /> Diagnóstico Inicial
         </h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">1. Upload das Fotos</h3>
                <div className="grid grid-cols-3 gap-2">
                    {POSES.map(pose => (
                        <label key={pose} className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all ${photos[pose] ? 'border-lime-500' : 'border-zinc-800 hover:border-zinc-600'}`}>
                            {photos[pose] ? (
                                <img src={photos[pose]!} className="w-full h-full object-cover" alt={pose} />
                            ) : (
                                <Upload size={20} className="text-zinc-600" />
                            )}
                            <span className="absolute bottom-1 text-[8px] font-black uppercase bg-black/60 px-2 rounded text-white">{pose}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, pose)} />
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">2. Contexto (Opcional)</h3>
                <textarea 
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    placeholder="Contexto..."
                    rows={4}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-500 outline-none resize-none"
                />
            </div>

            <button onClick={runAnalysis} disabled={analyzing} className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] disabled:opacity-50">
                {analyzing ? <Loader2 className="animate-spin"/> : <><BrainCircuit size={20}/> GERAR DIAGNÓSTICO</>}
            </button>
        </div>

        <div className="lg:col-span-8">
            {result ? (
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="prose prose-invert prose-headings:text-lime-400 prose-headings:font-black prose-headings:uppercase prose-p:text-zinc-300 max-w-none">
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-900 rounded-2xl min-h-[400px]">
                    <BrainCircuit size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">Aguardando análise...</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}