"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { generateInitialAssessment } from "@/app/dashboard/actions/ai-assessment"; 
import { transcribeAudio } from "@/app/dashboard/actions/transcribe"; 
import { saveAssessment } from "@/app/dashboard/actions/save-assessment"; 
import { ArrowLeft, BrainCircuit, Loader2, Upload, ScanEye, Mic, Square, Trash2, CheckCircle2, Edit3 } from "lucide-react";
import Link from "next/link";
import imageCompression from 'browser-image-compression';
import { PhotoAnnotator } from "@/components/PhotoAnnotator";

const POSES = ['Frente', 'Perfil', 'Costas'];

export default function DiagnosticoPage() {
  const params = useParams();
  const router = useRouter();
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
  
  // Controle de Anotação Visual
  const [annotatingPose, setAnnotatingPose] = useState<string | null>(null);

  const [report, setReport] = useState<{
    frente: string;
    perfil: string;
    costas: string;
    veredito: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      setStudent(data);
    }
    loadData();
  }, [studentId, supabase]);

  const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          handleTranscription(audioBlob);
          stream.getTracks().forEach(track => track.stop()); 
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) { alert("Erro microfone."); }
  };

  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } };
  
  const handleTranscription = async (audioBlob: Blob) => {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      const response = await transcribeAudio(formData);
      if (response.text) setHistory(prev => (prev ? `${prev} ${response.text}` : response.text));
      setIsTranscribing(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, pose: string) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true, fileType: "image/jpeg" };
        const compressed = await imageCompression(file, options);
        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        setPhotos(prev => ({ ...prev, [pose]: base64 }));
      } catch (err) { 
          const reader = new FileReader();
          reader.onloadend = () => { setPhotos(prev => ({ ...prev, [pose]: reader.result as string })); };
          reader.readAsDataURL(file);
      }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setReport(null);

    const validImages = Object.entries(photos)
        .filter(([_, base64]) => base64 !== null)
        .map(([label, base64]) => ({ label, base64: base64! }));

    if (validImages.length === 0) {
        alert("Adicione fotos.");
        setAnalyzing(false);
        return;
    }

    const context = {
        name: student?.full_name || "Atleta",
        gender: student?.gender || "Não informado",
        goal: student?.selected_goal || "Estética",
        history: history
    };

    const response = await generateInitialAssessment(validImages, context);
    
    if (response.error) {
        alert(response.error);
    } else if (response.data) {
        setReport(response.data);
    }
    
    setAnalyzing(false);
  };

  const handleSaveToProntuario = async () => {
    if (!report) return;
    setIsSaving(true);
    
    let finalContent = "";
    if (report.frente) finalContent += `## 🧍 FRENTE\n${report.frente}\n\n`;
    if (report.perfil) finalContent += `## 🚶 PERFIL\n${report.perfil}\n\n`;
    if (report.costas) finalContent += `## 🔙 COSTAS\n${report.costas}\n\n`;
    if (report.veredito) finalContent += `## 🎯 VEREDITO\n${report.veredito}`;

    const photoUrls = Object.values(photos).filter(p => p !== null) as string[];

    const response = await saveAssessment({
      studentId: studentId,
      title: "Análise Técnica Visual",
      type: "raio_x",
      content: finalContent,
      photos: photoUrls 
    });

    setIsSaving(false);

    if (response.success) {
      alert("✅ Salvo no Prontuário!");
      router.push(`/dashboard/alunos/${studentId}`); 
    } else {
      alert("Erro ao salvar.");
    }
  };

  const updateReport = (field: 'frente'|'perfil'|'costas'|'veredito', value: string) => {
      setReport(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  if (!student) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-6xl mx-auto px-6 py-8 border-b border-zinc-900 flex justify-between items-center sticky top-0 bg-black/95 backdrop-blur z-50">
         <Link href={`/dashboard/alunos/${studentId}`} className="text-zinc-400 hover:text-white flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
            <ArrowLeft size={16} /> Voltar
         </Link>
         <h1 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <ScanEye className="text-brand" /> Análise Técnica Visual
         </h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">1. Fotos</h3>
                <div className="grid grid-cols-3 gap-2">
                    {POSES.map(pose => (
                        <div key={pose} className="group relative">
                          <label className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all ${photos[pose] ? 'border-brand' : 'border-zinc-800 hover:border-zinc-600'}`}>
                              {photos[pose] ? (
                                  <img src={photos[pose]!} className="w-full h-full object-cover" alt={pose} />
                              ) : (
                                  <Upload size={20} className="text-zinc-600" />
                              )}
                              <span className="absolute bottom-1 text-[8px] font-black uppercase bg-black/60 px-2 rounded text-white">{pose}</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, pose)} />
                          </label>
                          
                          {/* BOTÃO DE ANOTAÇÃO */}
                          {photos[pose] && (
                            <button 
                              onClick={() => setAnnotatingPose(pose)}
                              className="absolute top-1 right-1 p-1.5 bg-brand text-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title="Anotar na foto"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">2. Contexto</h3>
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${isRecording ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-zinc-800 text-zinc-400"}`}
                    >
                        {isTranscribing ? "..." : isRecording ? "Parar" : "Gravar"}
                    </button>
                </div>
                <textarea 
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    placeholder="Relato do aluno..."
                    rows={4}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-brand outline-none resize-none"
                />
            </div>

            <button onClick={runAnalysis} disabled={analyzing} className="w-full bg-brand hover:bg-lime-400 text-black font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] disabled:opacity-50">
                {analyzing ? <Loader2 className="animate-spin"/> : <><BrainCircuit size={20}/> GERAR DIAGNÓSTICO</>}
            </button>
        </div>

        <div className="lg:col-span-8 space-y-6">
            {!report && !analyzing && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-900 rounded-2xl min-h-[400px]">
                    <ScanEye size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">Aguardando fotos...</p>
                </div>
            )}

            {analyzing && (
                 <div className="h-full flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-900 rounded-2xl min-h-[400px]">
                    <Loader2 size={48} className="mb-4 text-brand animate-spin" />
                    <p className="text-sm font-bold uppercase tracking-widest text-brand">Analisando cada detalhe...</p>
                </div>
            )}

            {report && (
                <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6">
                    {/* FRENTE */}
                    {photos['Frente'] && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col md:flex-row">
                            <div className="md:w-1/3 bg-black relative border-r border-zinc-800 group">
                                <img src={photos['Frente']!} className="w-full h-full object-cover" />
                                <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-black uppercase px-2 py-1 rounded">Frente</span>
                                <button 
                                  onClick={() => setAnnotatingPose('Frente')}
                                  className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-black font-black uppercase text-xs"
                                >
                                    <Edit3 size={20} /> Anotar na Foto
                                </button>
                            </div>
                            <div className="flex-1 p-4 flex flex-col">
                                <textarea 
                                    value={report.frente}
                                    onChange={(e) => updateReport('frente', e.target.value)}
                                    className="flex-1 bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed focus:border-brand outline-none resize-none min-h-[150px]"
                                />
                            </div>
                        </div>
                    )}

                    {/* PERFIL */}
                    {photos['Perfil'] && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col md:flex-row">
                            <div className="md:w-1/3 bg-black relative border-r border-zinc-800 group">
                                <img src={photos['Perfil']!} className="w-full h-full object-cover" />
                                <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-black uppercase px-2 py-1 rounded">Perfil</span>
                                <button 
                                  onClick={() => setAnnotatingPose('Perfil')}
                                  className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-black font-black uppercase text-xs"
                                >
                                    <Edit3 size={20} /> Anotar na Foto
                                </button>
                            </div>
                            <div className="flex-1 p-4 flex flex-col">
                                <textarea 
                                    value={report.perfil}
                                    onChange={(e) => updateReport('perfil', e.target.value)}
                                    className="flex-1 bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed focus:border-brand outline-none resize-none min-h-[150px]"
                                />
                            </div>
                        </div>
                    )}

                    {/* COSTAS */}
                    {photos['Costas'] && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col md:flex-row">
                            <div className="md:w-1/3 bg-black relative border-r border-zinc-800 group">
                                <img src={photos['Costas']!} className="w-full h-full object-cover" />
                                <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-black uppercase px-2 py-1 rounded">Costas</span>
                                <button 
                                  onClick={() => setAnnotatingPose('Costas')}
                                  className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-black font-black uppercase text-xs"
                                >
                                    <Edit3 size={20} /> Anotar na Foto
                                </button>
                            </div>
                            <div className="flex-1 p-4 flex flex-col">
                                <textarea 
                                    value={report.costas}
                                    onChange={(e) => updateReport('costas', e.target.value)}
                                    className="flex-1 bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed focus:border-brand outline-none resize-none min-h-[150px]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="bg-zinc-950 border border-brand/20 rounded-2xl p-6">
                        <h3 className="text-lime-400 font-black uppercase tracking-widest text-sm mb-4">🎯 Estratégia & Veredito</h3>
                        <textarea 
                            value={report.veredito}
                            onChange={(e) => updateReport('veredito', e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white leading-relaxed focus:border-lime-400 outline-none resize-none min-h-[100px]"
                        />
                    </div>

                    <div className="flex gap-4 border-t border-zinc-900 pt-4 sticky bottom-4">
                        <button onClick={() => setReport(null)} className="px-6 py-4 rounded-xl border border-zinc-800 bg-black text-zinc-500 hover:text-red-500 hover:border-red-500 transition-all font-bold uppercase text-xs tracking-widest">Descartar</button>
                        <button 
                            onClick={handleSaveToProntuario}
                            disabled={isSaving}
                            className="flex-1 bg-brand text-black font-black uppercase text-xs tracking-widest px-6 py-4 rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-3"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Salvar Relatório Final</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* MODAL DE ANOTAÇÃO */}
      {annotatingPose && (
        <PhotoAnnotator 
          imageUrl={photos[annotatingPose]!}
          onCancel={() => setAnnotatingPose(null)}
          onSave={(newImage) => {
              setPhotos(prev => ({ ...prev, [annotatingPose]: newImage }));
              setAnnotatingPose(null);
          }}
        />
      )}
    </div>
  );
}