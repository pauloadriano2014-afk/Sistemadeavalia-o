"use client";

import { createCheckin } from "../actions";
import { Upload, Camera, Save, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import imageCompression from 'browser-image-compression';

export default function NovoCheckinPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Função mágica de compressão
  async function compressFile(file: File) {
    const options = {
      maxSizeMB: 1,          // Máximo 1MB
      maxWidthOrHeight: 1920, // Reduz resolução absurda de 4k pra Full HD
      useWebWorker: true,
      fileType: "image/jpeg"
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.log("Erro na compressão", error);
      return file; // Se falhar, tenta enviar o original
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setStatus("Preparando fotos...");

    try {
      // 1. Pegar as fotos originais
      const front = formData.get("photo_front") as File;
      const back = formData.get("photo_back") as File;
      const side = formData.get("photo_side") as File;

      // 2. Comprimir (se existirem)
      if (front.size > 0) {
        setStatus("Otimizando foto de Frente...");
        const compressed = await compressFile(front);
        formData.set("photo_front", compressed);
      }

      if (back.size > 0) {
        setStatus("Otimizando foto de Costas...");
        const compressed = await compressFile(back);
        formData.set("photo_back", compressed);
      }

      if (side.size > 0) {
        setStatus("Otimizando foto de Perfil...");
        const compressed = await compressFile(side);
        formData.set("photo_side", compressed);
      }

      // 3. Enviar
      setStatus("Enviando para o Coach...");
      await createCheckin(formData);

    } catch (error) {
      console.error(error);
      alert("Erro ao processar envio. Tente fotos menores.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar ao Painel
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Novo Check-in 📸</h1>
        <p className="text-slate-400 mt-2">Atualize seu peso e fotos para o Coach analisar.</p>
      </div>

      <form action={handleSubmit} className="space-y-8">
        
        {/* Dados Corporais */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Upload size={20} className="text-blue-500"/> Dados Corporais
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Peso Atual (kg)</label>
            <input name="weight" type="number" step="0.1" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Ex: 75.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Como foi a semana?</label>
            <textarea name="notes" rows={3} required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Resumo da dieta e treino..." />
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Camera size={20} className="text-blue-500"/> Fotos do Shape
          </h3>
          <p className="text-sm text-slate-500">As fotos serão otimizadas automaticamente.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PhotoInput label="Frente" name="photo_front" />
            <PhotoInput label="Costas" name="photo_back" />
            <PhotoInput label="Perfil" name="photo_side" />
          </div>
        </div>

        {/* Botão de Enviar Inteligente */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {status}
            </>
          ) : (
            <>
              <Save size={20} /> Enviar Check-in
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Componente PhotoInput (Pode manter o mesmo, vou incluir aqui pra garantir que não quebre)
function PhotoInput({ label, name }: { label: string, name: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };
  return (
    <div className="relative group">
      <label className="block text-sm font-medium text-slate-400 mb-2 text-center">{label}</label>
      <div className={`relative w-full aspect-[3/4] bg-slate-950 border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden ${preview ? 'border-blue-500' : 'border-slate-800 hover:border-blue-500'}`}>
        {preview ? (
          <>
            <img src={preview} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1"><CheckCircle size={14} /></div>
          </>
        ) : (
          <>
            <Camera className="text-slate-600 mb-2" />
            <span className="text-xs text-slate-600">Selecionar</span>
          </>
        )}
        <input type="file" name={name} accept="image/*" required onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
      </div>
    </div>
  );
}