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
  const studentId = params.id as string;
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const [student, setStudent] = useState<any>(null);
  const [weight, setWeight] = useState<number|''>('');
  const [age, setAge] = useState<number|''>('');
  
  const [folds, setFolds] = useState<Folds>({ peitoral: '', axilar_media: '', triceps: '', subescapular: '', abdomen: '', suprailiaca: '', coxa: '' });
  const [circs, setCircs] = useState<Circs>({ torax: '', cintura: '', abdomen_circ: '', quadril: '', braco_dir: '', braco_esq: '', coxa_dir: '', coxa_esq: '', panturrilha_dir: '', panturrilha_esq: '' });
  
  const [photos, setPhotos] = useState<{ frente: string | null, perfil: string | null, costas: string | null }>({ frente: null, perfil: null, costas: null });

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [results, setResults] = useState<{ bf: number, fatMass: number, leanMass: number } | null>(null);

  // --- AUTO-SAVE OFFLINE ---
  useEffect(() => {
    const savedData = localStorage.getItem(`pollock_draft_${studentId}`);
    if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.folds) setFolds(parsed.folds);
        if (parsed.circs) setCircs(parsed.circs);
        if (parsed.weight) setWeight(parsed.weight);
        if (parsed.age) setAge(parsed.age);
    }
    
    async function loadStudent() {
      const { data } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      setStudent(data);
      if (!localStorage.getItem(`pollock_draft_${studentId}`)) {
          setAge(30); 
      }
    }
    loadStudent();
  }, [studentId, supabase]);

  useEffect(() => {
      localStorage.setItem(`pollock_draft_${studentId}`, JSON.stringify({ folds, circs, weight, age }));
  }, [folds, circs, weight, age, studentId]);

  // --- MICROFONE INTELIGENTE (CORTA SOZINHO NO SILÊNCIO) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop()); 
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
      };

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
              if ((hasSpoken && silenceDuration > 2000) || (!hasSpoken && silenceDuration > 6000)) {
                  stopRecording();
                  return;
              }
          }
          requestAnimationFrame(detectSilence);
      };

      mediaRecorder.start();
      setIsRecording(true);
      detectSilence();

    } catch (err) { alert("Permita o uso do microfone no navegador."); }
  };

  const stopRecording = () => { 
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') { 
          mediaRecorderRef.current.stop(); 
          setIsRecording(false); 
      } 
  };

  const processAudio = async (audioBlob: Blob) => {
      setIsProcessing(true);
      try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");
          const { text } = await transcribeAudio(formData);
          
          if (text) {
              const res = await extractMetricsFromTranscript(text);
              if (res.data) {
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
          setWeight(''); setResults(null);
      }
  };

  const formatName = (key: string) => key.replace('_circ', '').replace('_dir', ' Dir.').replace('_esq', ' Esq.').replace('_', ' ');

  if (!student) return <div className="min-h-screen bg-black flex items-center justify-center text-brand font-bold uppercase tracking-widest">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative">
        
        {/* CSS DE IMPRESSÃO CEGO E ESTRUTURADO (COM HACK PARA IOS) */}
        <style jsx global>{`
            @media print {
                body * { visibility: hidden; }
                body { background-color: white !important; color: black !important; margin: 0; padding: 0; }
                #print-area, #print-area * { visibility: visible; }
                #print-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
                
                /* Hack para forçar cores de fundo no Safari Mobile (iOS) */
                .print-bg-brand { box-shadow: inset 0 0 0 1000px var(--brand) !important; color: black !important; }
                .print-bg-zinc { box-shadow: inset 0 0 0 1000px #f4f4f5 !important; color: black !important; border: 1px solid #e4e4e7 !important; }
                .print-text-black { color: black !important; }
                
                /* Quebras de página seguras e blindadas */
                .page-break { page-break-before: always; break-before: page; margin-top: 10mm; }
                .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; display: inline-block; width: 100%; }
                
                /* Blindagem das Fotos */
                .print-photo-container { display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-inside: avoid; break-inside: avoid; }
                .print-photo { max-height: 40vh !important; width: auto !important; object-fit: contain !important; border-radius: 8px !important; }
            }
            #print-area { display: none; }
        `}</style>

        {/* --- INTERFACE DO APLICATIVO (ESCONDIDA NA IMPRESSÃO) --- */}
        <div className="print:hidden">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 border-b border-zinc-900 sticky top-0 bg-black/90 backdrop-blur z-40 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <Link href={`/dashboard/alunos/${studentId}`} className="text-zinc-400 hover:text-brand flex items-center gap-2 font-bold uppercase text-xs">
                    <ArrowLeft size={16} /> Voltar
                </Link>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                            isProcessing ? "bg-zinc-800 text-zinc-500" : 
                            isRecording ? "bg-red-500 text-white animate-pulse shadow-red-500/20" : "bg-brand text-black shadow-brand/20"
                        }`}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={16}/> : isRecording ? <><Square size={14}/> Ouvindo...</> : <><Mic size={14}/> Gravar Medidas</>}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                
                <div className="flex items-center gap-2 text-brand text-[10px] uppercase font-black tracking-widest bg-brand/10 border border-brand/20 p-3 rounded-lg">
                    <SaveAll size={14}/> <span>Auto-Save Ativo: Preencha sem medo de perder os dados.</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Aluno</p>
                        <p className="font-bold text-sm uppercase">{student.full_name}</p>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Peso (kg)</label>
                        <input type="number" value={weight} onChange={e => setWeight(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-brand font-bold focus:border-brand outline-none" placeholder="00.0" />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Idade</label>
                        <input type="number" value={age} onChange={e => setAge(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white font-bold focus:border-brand outline-none" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-brand/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Dobras Cutâneas (mm)</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {FOLD_KEYS.map((key) => (
                                <div key={key}>
                                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1 block">{formatName(key)}</label>
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
                                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1 block">{formatName(key)}</label>
                                    <input type="number" value={circs[key as keyof Circs]} onChange={e => setCircs({...circs, [key as keyof Circs]: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center transition-all" placeholder="0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <button onClick={clearDraft} className="text-xs text-red-500 hover:text-red-400 uppercase font-bold tracking-widest px-4 py-2">
                        Limpar Dados
                    </button>
                    <button onClick={calculateBodyComposition} className="bg-white hover:bg-zinc-200 text-black font-black px-6 py-3 rounded-xl uppercase text-xs tracking-widest transition-colors shadow-lg">
                        Calcular Percentual
                    </button>
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
                            <button onClick={() => window.print()} className="w-full md:w-auto bg-brand text-black px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-brand/20 font-black uppercase text-xs flex justify-center gap-2 items-center">
                                <Printer size={16} /> Imprimir PDF 
                            </button>
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

        {/* --- ÁREA EXCLUSIVA DE IMPRESSÃO (PDF) --- */}
        {results && (
            <div className="hidden print:block w-full bg-white text-black font-sans p-8">
                
                {/* PÁGINA 1: DADOS E TABELAS */}
                <div className="avoid-break mb-10">
                    <div className="border-b-2 pb-4 mb-8 flex justify-between items-end" style={{ borderColor: 'var(--brand)' }}>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: 'var(--brand)' }}>Avaliação Física</h1>
                            <p className="text-xs font-bold uppercase text-zinc-600 mt-1">Protocolo: Jackson & Pollock (7 Dobras)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase text-zinc-500">Atleta</p>
                            <p className="text-lg font-black print-text-black">{student.full_name}</p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">Avaliador: Paulo Adriano TEAM</p>
                            <p className="text-[10px] font-bold text-zinc-500">{new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    {/* Gráfico Visual Dinâmico (Vetor inquebrável) */}
                    <div className="mb-8 avoid-break">
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] uppercase font-black text-zinc-600">Massa Magra ({results.leanMass.toFixed(1)}kg)</span>
                            <span className="text-[10px] uppercase font-black" style={{ color: 'var(--brand)' }}>Gordura ({results.fatMass.toFixed(1)}kg)</span>
                        </div>
                        <div className="h-5 w-full rounded-full overflow-hidden relative bg-zinc-100 border border-zinc-200">
                            {/* SVG obriga o Safari a imprimir as cores do Tema escolhido */}
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                <rect x="0" y="0" width={`${100 - results.bf}%`} height="100%" fill="#f4f4f5" />
                                <rect x={`${100 - results.bf}%`} y="0" width={`${results.bf}%`} height="100%" fill="var(--brand)" />
                            </svg>
                        </div>
                    </div>

                    {/* Caixinhas Resumo Clean */}
                    <div className="grid grid-cols-4 gap-4 mb-10">
                        <div className="print-bg-zinc p-3 rounded-xl border border-zinc-200 text-center">
                            <p className="text-[9px] uppercase font-black text-zinc-500">Peso Total</p>
                            <p className="text-xl font-black print-text-black">{weight} kg</p>
                        </div>
                        <div className="print-bg-brand p-3 rounded-xl text-center">
                            <p className="text-[9px] uppercase font-black print-text-black">Gordura (BF)</p>
                            <p className="text-xl font-black print-text-black">{results.bf.toFixed(1)} %</p>
                        </div>
                        <div className="print-bg-zinc p-3 rounded-xl border border-zinc-200 text-center">
                            <p className="text-[9px] uppercase font-black text-zinc-500">Massa Magra</p>
                            <p className="text-xl font-black print-text-black">{results.leanMass.toFixed(1)} kg</p>
                        </div>
                        <div className="print-bg-zinc p-3 rounded-xl border border-zinc-200 text-center">
                            <p className="text-[9px] uppercase font-black text-zinc-500">Massa Gorda</p>
                            <p className="text-xl font-black print-text-black">{results.fatMass.toFixed(1)} kg</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mb-8">
                        <div>
                            <h3 className="text-xs font-black uppercase border-b-2 pb-2 mb-4 tracking-widest" style={{ color: 'var(--brand)', borderColor: '#e4e4e7' }}>Dobras Cutâneas (mm)</h3>
                            {FOLD_KEYS.map(k => (
                                <div key={k} className="flex justify-between border-b border-zinc-100 py-1.5">
                                    <span className="text-[10px] uppercase font-bold text-zinc-600">{formatName(k)}</span>
                                    <span className="text-xs font-black print-text-black">{folds[k as keyof Folds] || '--'}</span>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase border-b-2 pb-2 mb-4 tracking-widest" style={{ color: 'var(--brand)', borderColor: '#e4e4e7' }}>Perímetros (cm)</h3>
                            {CIRC_KEYS.map(k => (
                                <div key={k} className="flex justify-between border-b border-zinc-100 py-1.5">
                                    <span className="text-[10px] uppercase font-bold text-zinc-600">{formatName(k)}</span>
                                    <span className="text-xs font-black print-text-black">{circs[k as keyof Circs] || '--'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PÁGINA 2: GUIA DE DEFINIÇÃO E HIPERTROFIA */}
                <div className="page-break avoid-break">
                    <h3 className="text-3xl font-black uppercase border-b-2 pb-2 mb-8 tracking-tighter" style={{ color: 'var(--brand)', borderColor: 'var(--brand)' }}>
                        Guia de Hipertrofia e Definição
                    </h3>
                    
                    <div className="border border-zinc-300 p-6 rounded-2xl mb-8 bg-zinc-50">
                        <p className="text-lg font-black uppercase mb-3 flex items-center gap-2" style={{ color: 'var(--brand)' }}>⚠️ Atenção à Regra de Ouro</p>
                        <p className="text-base print-text-black leading-relaxed text-justify font-medium">
                            Exercício direcionado (ex: abdominal) gera <b>hipertrofia</b> do músculo local, mas <b>NÃO</b> queima a gordura daquela região específica. 
                            Para o músculo ficar visível ("definido"), é obrigatório reduzir a camada de gordura (dobra cutânea) através de <b>Déficit Calórico, Dieta alinhada e Cardio em dia</b>.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="avoid-break">
                            <h4 className="text-sm font-black uppercase border-b-2 border-zinc-200 pb-2 mb-4 text-zinc-500 tracking-widest">Alvo de Definição Visível</h4>
                            <ul className="text-sm space-y-4 font-medium print-text-black">
                                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }}></div> <b>Homens:</b> Dobras abaixo de 8 a 10mm.</li>
                                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }}></div> <b>Mulheres:</b> Dobras abaixo de 12 a 15mm.</li>
                                <li className="text-[10px] text-zinc-500 italic mt-2">* Variações ocorrem por genética e hidratação.</li>
                            </ul>
                        </div>
                        <div className="avoid-break">
                            <h4 className="text-sm font-black uppercase border-b-2 border-zinc-200 pb-2 mb-4 text-zinc-500 tracking-widest">Mapeamento de Regiões</h4>
                            <ul className="text-sm space-y-3 font-medium print-text-black">
                                <li><b>Peitoral:</b> Supinos, Crucifixos, Flexões.</li>
                                <li><b>Tríceps (Tchauzinho):</b> Tríceps Testa, Polia, Francesa.</li>
                                <li><b>Costas (Subescapular):</b> Puxadas Altas, Remadas.</li>
                                <li><b>Abdômen e Cintura:</b> Pranchas, Crunches, Elevações.</li>
                                <li><b>Coxas (Quadríceps):</b> Agachamentos, Leg Press.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* PÁGINA 3: FOTOS */}
                {(photos.frente || photos.perfil || photos.costas) && (
                    <div className="page-break avoid-break">
                        <h3 className="text-3xl font-black uppercase border-b-2 pb-2 mb-8 tracking-tighter" style={{ color: 'var(--brand)', borderColor: 'var(--brand)' }}>Registro Fotográfico</h3>
                        <div className="grid grid-cols-3 gap-6">
                            {['frente', 'perfil', 'costas'].map(pose => (
                                photos[pose as keyof typeof photos] ? (
                                    <div key={pose} className="print-photo-container">
                                        <img src={photos[pose as keyof typeof photos]!} className="print-photo" />
                                        <p className="text-sm font-black uppercase mt-4 tracking-widest" style={{ color: 'var(--brand)' }}>{pose}</p>
                                    </div>
                                ) : null
                            ))}
                        </div>
                        
                        <div className="mt-20 pt-8 border-t-2 border-zinc-200 flex justify-between items-end opacity-80 avoid-break">
                            <div>
                                <div className="h-1 w-48 mb-3 rounded-full" style={{ backgroundColor: 'var(--brand)' }}></div>
                                <p className="text-xs font-black uppercase tracking-widest print-text-black">Treinador Responsável</p>
                            </div>
                            <p className="text-[10px] font-black italic text-zinc-400">GERADO VIA COACHPRO SYSTEM</p>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}
