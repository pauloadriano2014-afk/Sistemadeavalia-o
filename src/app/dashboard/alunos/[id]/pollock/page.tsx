"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mic, Square, Loader2, Printer, Upload, Activity, ActivitySquare, SaveAll } from "lucide-react";
import Link from "next/link";
import { transcribeAudio } from "@/app/dashboard/actions/transcribe";
import { extractMetricsFromTranscript } from "@/app/dashboard/actions/ai-pollock";
import imageCompression from 'browser-image-compression';

type Folds = { peitoral: number|''; axilar_media: number|''; triceps: number|''; subescapular: number|''; abdomen: number|''; suprailiaca: number|''; coxa: number|''; };
type Circs = { torax: number|''; cintura: number|''; abdomen_circ: number|''; quadril: number|''; braco_dir: number|''; braco_esq: number|''; coxa_dir: number|''; coxa_esq: number|''; panturrilha_dir: number|''; panturrilha_esq: number|''; };

const FOLD_KEYS = ['peitoral', 'axilar_media', 'triceps', 'subescapular', 'abdomen', 'suprailiaca', 'coxa'];
const CIRC_KEYS = ['torax', 'cintura', 'abdomen_circ', 'quadril', 'braco_dir', 'braco_esq', 'coxa_dir', 'coxa_esq', 'panturrilha_dir', 'panturrilha_esq'];

export default function PollockPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const [student, setStudent] = useState<any>(null);
  const [prevAssessment, setPrevAssessment] = useState<any>(null); // NOVO: Armazena a última avaliação para referência visual
  
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); 
  const [weight, setWeight] = useState<number|''>('');
  const [age, setAge] = useState<number|''>('');
  const [height, setHeight] = useState<number|''>('');
  
  const [folds, setFolds] = useState<Folds>({ peitoral: '', axilar_media: '', triceps: '', subescapular: '', abdomen: '', suprailiaca: '', coxa: '' });
  const [circs, setCircs] = useState<Circs>({ torax: '', cintura: '', abdomen_circ: '', quadril: '', braco_dir: '', braco_esq: '', coxa_dir: '', coxa_esq: '', panturrilha_dir: '', panturrilha_esq: '' });
  
  const [photos, setPhotos] = useState<{ frente: string | null, perfil: string | null, costas: string | null }>({ frente: null, perfil: null, costas: null });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'smart' | 'continuous' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [results, setResults] = useState<{ bf: number, fatMass: number, leanMass: number } | null>(null);

  const [brandColor, setBrandColor] = useState<string>('#84cc16'); 
  const colorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (colorRef.current) {
          const color = window.getComputedStyle(colorRef.current).backgroundColor;
          if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
              setBrandColor(color);
          }
      }
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem(`pollock_draft_${studentId}`);
    if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.folds) setFolds(parsed.folds);
        if (parsed.circs) setCircs(parsed.circs);
        if (parsed.weight) setWeight(parsed.weight);
        if (parsed.age) setAge(parsed.age);
        if (parsed.height) setHeight(parsed.height);
        if (parsed.date) setDate(parsed.date);
    }
    
    async function loadStudent() {
      // 1. Carrega os dados do aluno
      const { data } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      setStudent(data);
      if (!localStorage.getItem(`pollock_draft_${studentId}`)) {
          setAge(30); 
      }

      // 2. Busca a última avaliação do aluno para servir de referência fantasma
      const { data: lastPollock } = await supabase
          .from('pollock_assessments')
          .select('*')
          .eq('student_id', studentId)
          .order('assessment_date', { ascending: false })
          .limit(1)
          .single();
          
      if (lastPollock) {
          setPrevAssessment(lastPollock);
      }
    }
    loadStudent();
  }, [studentId, supabase]);

  useEffect(() => {
      localStorage.setItem(`pollock_draft_${studentId}`, JSON.stringify({ folds, circs, weight, age, height, date }));
  }, [folds, circs, weight, age, height, date, studentId]);

  const startRecording = async (mode: 'smart' | 'continuous') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingMode(mode);

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        processAudio(audioBlob, ext);
        stream.getTracks().forEach(track => track.stop()); 
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (mode === 'smart') {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          
          if (audioCtx.state === 'suspended') await audioCtx.resume();
          
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          const microphone = audioCtx.createMediaStreamSource(stream);
          microphone.connect(analyser);
          analyser.fftSize = 256;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          let lastSoundTime = Date.now();
          let hasSpoken = false;

          const detectSilence = () => {
              if (mediaRecorder.state !== 'recording') return;
              
              analyser.getByteFrequencyData(dataArray);
              const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

              if (volume > 12) { 
                  lastSoundTime = Date.now();
                  hasSpoken = true;
              } else { 
                  const silenceDuration = Date.now() - lastSoundTime;
                  if ((hasSpoken && silenceDuration > 1200) || (!hasSpoken && silenceDuration > 5000)) {
                      stopRecording();
                      return;
                  }
              }
              requestAnimationFrame(detectSilence);
          };
          detectSilence();
      }

    } catch (err) { alert("Permita o uso do microfone no navegador."); }
  };

  const stopRecording = () => { 
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') { 
          mediaRecorderRef.current.stop(); 
          setIsRecording(false); 
          setRecordingMode(null);
      } 
  };

  const processAudio = async (audioBlob: Blob, ext: string) => {
      setIsProcessing(true);
      try {
          const formData = new FormData();
          formData.append("file", audioBlob, `audio.${ext}`);
          const { text } = await transcribeAudio(formData);
          
          if (text) {
              const res = await extractMetricsFromTranscript(text);
              if (res.data) {
                  if (res.data.basicos) {
                      if (res.data.basicos.peso !== null) setWeight(res.data.basicos.peso);
                      if (res.data.basicos.idade !== null) setAge(res.data.basicos.idade);
                      if (res.data.basicos.altura !== null) setHeight(res.data.basicos.altura);
                  }

                  setFolds(prev => {
                      const updated = { ...prev };
                      for (const k of FOLD_KEYS) { if (res.data.dobras?.[k] !== null) updated[k as keyof Folds] = res.data.dobras[k]; }
                      return updated;
                  });
                  setCircs(prev => {
                      const updated = { ...prev };
                      for (const k of CIRC_KEYS) { if (res.data.circunferencias?.[k] !== null) updated[k as keyof Circs] = res.data.circunferencias[k]; }
                      return updated;
                  });
              }
          }
      } catch (e) {
          alert("Erro ao analisar o áudio. Sua rede pode ter oscilado.");
      } finally {
          setIsProcessing(false);
      }
  };

  const calculateBodyComposition = () => {
      if (!weight || weight <= 0) return alert("Insira o peso atual do aluno.");
      if (!age || age <= 0) return alert("Insira a idade.");
      
      const sumFolds = FOLD_KEYS.reduce((a, k) => a + (Number(folds[k as keyof Folds]) || 0), 0);
      if (sumFolds === 0) return alert("Insira pelo menos uma dobra cutânea.");

      let bd = 0; 
      const isMale = student?.gender?.toLowerCase() === 'masculino' || student?.gender?.toLowerCase() === 'male';

      if (isMale) {
          bd = 1.112 - (0.00043499 * sumFolds) + (0.00000055 * Math.pow(sumFolds, 2)) - (0.00028826 * Number(age));
      } else {
          bd = 1.097 - (0.00046971 * sumFolds) + (0.00000056 * Math.pow(sumFolds, 2)) - (0.00012828 * Number(age));
      }

      const bfPercentage = (4.95 / bd - 4.5) * 100;
      const safeBf = Math.max(3, Math.min(bfPercentage, 60)); 
      const fatMass = (Number(weight) * safeBf) / 100;
      const leanMass = Number(weight) - fatMass;

      setResults({ bf: safeBf, fatMass, leanMass });
  };

  const saveAssessment = async () => {
      if (!results) return alert("Calcule o percentual primeiro!");
      setIsSaving(true);
      
      try {
          const { error } = await supabase.from('pollock_assessments').insert({
              student_id: studentId,
              assessment_date: date,
              weight: Number(weight),
              height: height ? Number(height) : null,
              age: Number(age),
              bf_percentage: results.bf,
              lean_mass: results.leanMass,
              fat_mass: results.fatMass,
              folds,
              circumferences: circs,
              photos
          });

          if (error) throw error;
          
          alert("Avaliação salva com sucesso no prontuário do aluno!");
          localStorage.removeItem(`pollock_draft_${studentId}`);
          router.push(`/dashboard/alunos/${studentId}`);
      } catch (err: any) {
          alert("Erro ao salvar: " + err.message);
      } finally {
          setIsSaving(false);
      }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, pose: 'frente'|'perfil'|'costas') => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280 });
        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        setPhotos(prev => ({ ...prev, [pose]: base64 }));
      } catch (err) { alert("Erro ao carregar foto."); }
  };

  const clearDraft = () => {
      if(confirm("Tem certeza que deseja limpar tudo?")) {
          localStorage.removeItem(`pollock_draft_${studentId}`);
          setFolds({ peitoral: '', axilar_media: '', triceps: '', subescapular: '', abdomen: '', suprailiaca: '', coxa: '' });
          setCircs({ torax: '', cintura: '', abdomen_circ: '', quadril: '', braco_dir: '', braco_esq: '', coxa_dir: '', coxa_esq: '', panturrilha_dir: '', panturrilha_esq: '' });
          setWeight(''); setAge(30); setHeight(''); setResults(null);
      }
  };

  const formatName = (key: string) => key.replace('_circ', '').replace('_dir', ' Dir.').replace('_esq', ' Esq.').replace('_', ' ');
  const hasCircs = CIRC_KEYS.some(k => !!circs[k as keyof Circs]);

  if (!student) return <div className="min-h-screen bg-black flex items-center justify-center text-brand font-bold uppercase tracking-widest">Carregando...</div>;
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR');

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
                
                .page-break { page-break-before: always; break-before: page; margin-top: 5mm; }
                .page-break:first-child { page-break-before: avoid; break-before: avoid; margin-top: 0; }
                .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; display: block; width: 100%; }
                
                .print-photo-container { page-break-inside: avoid !important; break-inside: avoid !important; text-align: center; margin-bottom: 2mm;}
                .print-photo { max-height: 25vh !important; width: auto !important; object-fit: contain !important; border-radius: 8px !important; margin: 0 auto; box-shadow: 0 0 0 1px #e4e4e7; }
            }
        `}</style>

        {/* --- INTERFACE DO APLICATIVO --- */}
        <div className="print:hidden">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 border-b border-zinc-900 sticky top-0 bg-black/90 backdrop-blur z-40 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <Link href={`/dashboard/alunos/${studentId}`} className="text-zinc-400 hover:text-brand flex items-center gap-2 font-bold uppercase text-xs">
                    <ArrowLeft size={16} /> Voltar
                </Link>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <button onClick={isRecording ? stopRecording : () => startRecording('smart')} disabled={isProcessing || (isRecording && recordingMode !== 'smart')} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border border-zinc-800 ${isProcessing ? "bg-zinc-900 text-zinc-500" : (isRecording && recordingMode === 'smart') ? "bg-red-500 text-white animate-pulse border-red-500" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
                        {isProcessing ? <Loader2 className="animate-spin" size={14}/> : (isRecording && recordingMode === 'smart') ? <><Square size={14}/> Ouvindo...</> : <><Mic size={14}/> Auto-Stop</>}
                    </button>
                    <button onClick={isRecording ? stopRecording : () => startRecording('continuous')} disabled={isProcessing || (isRecording && recordingMode !== 'continuous')} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isProcessing ? "bg-zinc-800 text-zinc-500" : (isRecording && recordingMode === 'continuous') ? "bg-red-500 text-white animate-pulse shadow-red-500/20" : "bg-brand text-black shadow-brand/20"}`}>
                        {isProcessing ? <Loader2 className="animate-spin" size={14}/> : (isRecording && recordingMode === 'continuous') ? <><Square size={14}/> Parar Gravação</> : <><Mic size={14}/> Ditar Contínuo</>}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <div className="flex items-center gap-2 text-brand text-[10px] uppercase font-black tracking-widest bg-brand/10 border border-brand/20 p-3 rounded-lg">
                    <SaveAll size={14}/> <span>Auto-Save: Os dados digitados ou falados estão seguros.</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Aluno</p>
                        <p className="font-bold text-sm uppercase text-white truncate">{student.full_name}</p>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white font-bold focus:border-brand outline-none" />
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Peso (kg)</label>
                            {prevAssessment?.weight && (
                                <span className="text-[9px] text-zinc-500 font-bold print:hidden" title="Última avaliação">Último: {prevAssessment.weight}</span>
                            )}
                        </div>
                        <input type="number" value={weight} onChange={e => setWeight(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-brand font-bold focus:border-brand outline-none" placeholder="00.0" />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Idade</label>
                        <input type="number" value={age} onChange={e => setAge(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white font-bold focus:border-brand outline-none" placeholder="30" />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Altura (cm)</label>
                        <input type="number" value={height} onChange={e => setHeight(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white font-bold focus:border-brand outline-none" placeholder="180" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-brand/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Dobras Cutâneas (mm)</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {FOLD_KEYS.map((key) => (
                                <div key={key}>
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">{formatName(key)}</label>
                                        {prevAssessment?.folds?.[key] && (
                                            <span className="text-[9px] text-zinc-600 font-bold print:hidden" title="Medida anterior">Última: {prevAssessment.folds[key]}</span>
                                        )}
                                    </div>
                                    <input type="number" value={folds[key as keyof Folds]} onChange={e => setFolds({...folds, [key as keyof Folds]: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none text-center transition-all" placeholder="0" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Perímetros (cm)</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {CIRC_KEYS.map((key) => (
                                <div key={key}>
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">{formatName(key)}</label>
                                        {prevAssessment?.circumferences?.[key] && (
                                            <span className="text-[9px] text-zinc-600 font-bold print:hidden" title="Medida anterior">Última: {prevAssessment.circumferences[key]}</span>
                                        )}
                                    </div>
                                    <input type="number" value={circs[key as keyof Circs]} onChange={e => setCircs({...circs, [key as keyof Circs]: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center transition-all" placeholder="0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <button onClick={clearDraft} className="text-xs text-red-500 hover:text-red-400 uppercase font-bold tracking-widest px-4 py-2">Limpar Dados</button>
                    <button onClick={calculateBodyComposition} className="bg-white hover:bg-zinc-200 text-black font-black px-6 py-3 rounded-xl uppercase text-xs tracking-widest transition-colors shadow-lg">Calcular Percentual</button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">Registro Fotográfico</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['frente', 'perfil', 'costas'].map((pose) => (
                            <label key={pose} className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-800 hover:border-brand flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all bg-black/50">
                                {photos[pose as keyof typeof photos] ? (
                                    <img src={photos[pose as keyof typeof photos]!} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Upload size={20} className="text-zinc-600 mx-auto mb-2" />
                                        <span className="text-[10px] text-zinc-500 font-black uppercase">{pose}</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, pose as any)} />
                            </label>
                        ))}
                    </div>
                </div>

                {results && (
                    <div className="bg-black border border-brand/30 rounded-3xl p-6 md:p-10 shadow-[0_0_40px_rgba(var(--brand),0.1)] relative overflow-hidden animate-in slide-in-from-bottom-10">
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-8">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Composição Corporal</h2>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <button onClick={saveAssessment} disabled={isSaving} className="w-full md:w-auto bg-zinc-800 text-white border border-zinc-700 px-6 py-3 rounded-xl hover:bg-zinc-700 font-black uppercase text-xs flex justify-center gap-2 items-center transition-all">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <SaveAll size={16} />}
                                    {isSaving ? "Salvando..." : "Salvar no Prontuário"}
                                </button>
                                <button onClick={() => window.print()} className="w-full md:w-auto bg-brand text-black px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-brand/20 font-black uppercase text-xs flex justify-center gap-2 items-center">
                                    <Printer size={16} /> Imprimir PDF 
                                </button>
                            </div>
                        </div>

                        <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs uppercase font-black text-zinc-400">Massa Magra</span>
                                <span className="text-xs uppercase font-black text-brand">Gordura</span>
                            </div>
                            <div className="flex h-5 w-full rounded-full overflow-hidden bg-zinc-800">
                                <div style={{ width: `${100 - results.bf}%` }} className="h-full bg-zinc-300"></div>
                                <div style={{ width: `${results.bf}%`, backgroundColor: brandColor }} className="h-full"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                                <p className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-2 z-10">Gordura Corporal</p>
                                <p className="text-5xl font-black text-brand tracking-tighter z-10">{results.bf.toFixed(1)}<span className="text-2xl">%</span></p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                                <p className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-2">Massa Magra</p>
                                <p className="text-4xl font-black text-white tracking-tighter">{results.leanMass.toFixed(1)}<span className="text-lg text-zinc-500">kg</span></p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                                <p className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-2">Massa Gorda</p>
                                <p className="text-4xl font-black text-zinc-300 tracking-tighter">{results.fatMass.toFixed(1)}<span className="text-lg text-zinc-500">kg</span></p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- ÁREA EXCLUSIVA DE IMPRESSÃO (PDF EM 2 PÁGINAS) --- */}
        {results && (
            <div className="hidden print:block w-full bg-white text-black font-sans p-8">
                
                {/* PÁGINA 1: DADOS E TABELAS */}
                <div className="mb-10">
                    <div className="border-b-2 pb-4 mb-8 flex justify-between items-end" style={{ borderColor: brandColor }}>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: brandColor }}>Avaliação Física</h1>
                            <p className="text-xs font-bold uppercase text-zinc-600 mt-1">Protocolo: Jackson & Pollock (7 Dobras)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase text-zinc-500">Atleta</p>
                            <p className="text-lg font-black text-black">{student.full_name}</p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">
                                {age ? `${age} anos` : ''} {age && height ? ' | ' : ''} {height ? `${height} cm` : ''}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">Avaliador: Paulo Adriano TEAM</p>
                            <p className="text-[10px] font-bold text-zinc-500">{formattedDate}</p>
                        </div>
                    </div>

                    <div className="mb-8 avoid-break">
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] uppercase font-black text-zinc-600">Massa Magra ({results.leanMass.toFixed(1)}kg)</span>
                            <span className="text-[10px] uppercase font-black" style={{ color: brandColor }}>Gordura ({results.fatMass.toFixed(1)}kg)</span>
                        </div>
                        <img 
                            src={`data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='24'%3E%3Crect width='${100 - results.bf}%25' height='24' fill='%23f4f4f5'/%3E%3Crect x='${100 - results.bf}%25' width='${results.bf}%25' height='24' fill='${brandColor.replace('#', '%23')}'/%3E%3C/svg%3E`}
                            style={{ width: '100%', height: '16px', borderRadius: '99px', objectFit: 'cover' }} 
                            alt="Gráfico"
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-10 avoid-break">
                        <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                            <p className="text-[9px] uppercase font-black text-zinc-500">Peso Total</p>
                            <p className="text-xl font-black text-black">{weight} kg</p>
                        </div>
                        <div className="p-3 rounded-lg text-center border" style={{ backgroundColor: brandColor, borderColor: brandColor, boxShadow: `inset 0 0 0 1000px ${brandColor}` }}>
                            <p className="text-[9px] uppercase font-black text-black">Gordura (BF)</p>
                            <p className="text-xl font-black text-black">{results.bf.toFixed(1)} %</p>
                        </div>
                        <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                            <p className="text-[9px] uppercase font-black text-zinc-500">Massa Magra</p>
                            <p className="text-xl font-black text-black">{results.leanMass.toFixed(1)} kg</p>
                        </div>
                        <div className="p-3 rounded-lg text-center border border-zinc-300" style={{ backgroundColor: '#f4f4f5', boxShadow: 'inset 0 0 0 1000px #f4f4f5' }}>
                            <p className="text-[9px] uppercase font-black text-zinc-500">Massa Gorda</p>
                            <p className="text-xl font-black text-black">{results.fatMass.toFixed(1)} kg</p>
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

                {/* PÁGINA 2: GUIA DE DEFINIÇÃO + FOTOS UNIFICADOS PARA CABER NUMA FOLHA SÓ */}
                <div className="page-break avoid-break">
                    <h3 className="text-xl font-black uppercase border-b-2 pb-1 mb-4 tracking-tighter" style={{ color: brandColor, borderColor: brandColor }}>
                        Guia de Hipertrofia e Definição
                    </h3>
                    <div className="border border-zinc-300 p-4 rounded-xl mb-6 bg-zinc-50" style={{ boxShadow: 'inset 0 0 0 1000px #f8fafc' }}>
                        <p className="text-sm font-black uppercase mb-1 flex items-center gap-2" style={{ color: brandColor }}>⚠️ Regra de Ouro</p>
                        <p className="text-xs text-black leading-relaxed font-medium">
                            Exercício direcionado gera <b>hipertrofia</b> do músculo, mas <b>NÃO</b> queima a gordura da região. 
                            Para o músculo ficar visível, é obrigatório <b>Déficit Calórico, Dieta e Cardio</b>.
                        </p>
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

                    {/* FOTOS RENDEREZIDAS NA MESMA PÁGINA 2 */}
                    {(photos.frente || photos.perfil || photos.costas) && (
                        <div className="mt-6 avoid-break">
                            <h3 className="text-xl font-black uppercase border-b-2 pb-1 mb-4 tracking-tighter" style={{ color: brandColor, borderColor: brandColor }}>
                                Registro Fotográfico
                            </h3>
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
        )}
    </div>
  );
}