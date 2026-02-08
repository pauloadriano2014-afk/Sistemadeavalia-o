"use client";

import { createCheckin } from "../actions";
import { Upload, Camera, Save, ArrowLeft, Loader2, Trophy, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import imageCompression from 'browser-image-compression';
import { createBrowserClient } from "@supabase/ssr";

export default function NovoCheckinPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Estados para controle de categoria
  const [poseCategory, setPoseCategory] = useState("padrao");
  const [studentGender, setStudentGender] = useState("female");
  const [studentGoal, setStudentGoal] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Verificar o Objetivo e Gênero do Aluno logado
  useEffect(() => {
    async function checkGoal() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_goal, gender')
          .eq('id', user.id)
          .single();
        
        const goal = profile?.selected_goal || "";
        // SE O BANCO VIER NULL, VAI ASSUMIR FEMALE. REFORÇANDO: CORRIJA O BANCO COM SQL.
        const gender = profile?.gender || "female";
        
        setStudentGoal(goal);
        setStudentGender(gender);

        const goalLower = goal.toLowerCase();
        if (gender === 'female') {
           if (goalLower.includes('wellness')) setPoseCategory('wellness');
           else if (goalLower.includes('biquini') || goalLower.includes('bikini')) setPoseCategory('bikini');
           else setPoseCategory('padrao');
        } else {
           // Masculino
           if (goalLower.includes('classic')) setPoseCategory('classic');
           else if (goalLower.includes('bodybuilding') || goalLower.includes('competicao')) setPoseCategory('bodybuilding');
           else setPoseCategory('padrao');
        }
      }
      setLoadingProfile(false);
    }
    checkGoal();
  }, [supabase]);

  async function compressFile(file: File) {
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true, fileType: "image/jpeg", initialQuality: 0.7 };
    try { return await imageCompression(file, options); } catch (error) { return file; }
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setStatus("Otimizando imagens...");
    try {
      const keys = Array.from(formData.keys()).filter(key => key.startsWith('photo_'));
      for (const key of keys) {
        const file = formData.get(key) as File;
        if (file && file.size > 0) {
          const compressed = await compressFile(file);
          formData.set(key, compressed);
        }
      }
      setStatus("Enviando para o Coach...");
      await createCheckin(formData);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar. Tente novamente.");
      setLoading(false);
    }
  };

  if (loadingProfile) return <div className="p-10 text-center text-slate-500">Carregando perfil...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar ao Painel
      </Link>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
         <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            Novo Check-in
            </h1>
            <p className="text-slate-400 mt-1 text-sm flex items-center gap-2">
                <span className={`font-mono px-2 py-0.5 rounded uppercase font-bold text-xs ${studentGender === 'male' ? 'bg-blue-950 text-blue-200' : 'bg-pink-950 text-pink-200'}`}>
                  {studentGender === 'male' ? 'Masculino' : 'Feminino'}
                </span>
            </p>
         </div>

         {/* SELETOR DE CATEGORIA */}
         <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 p-2 rounded-lg">
            <LayoutDashboard size={20} className="text-slate-400 ml-2" />
            <select 
                value={poseCategory}
                onChange={(e) => setPoseCategory(e.target.value)}
                className="bg-slate-950 text-white font-bold text-sm focus:outline-none cursor-pointer py-1 px-2 border-none ring-0 w-40"
            >
                <option value="padrao" className="bg-slate-950 text-white">Padrão</option>
                
                {studentGender === 'male' && (
                  <optgroup label="Masculino" className="bg-slate-950 text-slate-400">
                    <option value="bodybuilding" className="bg-slate-950 text-white">Bodybuilding</option>
                    <option value="classic" className="bg-slate-950 text-white">Classic Physique</option>
                  </optgroup>
                )}

                {studentGender === 'female' && (
                  <optgroup label="Feminino" className="bg-slate-950 text-slate-400">
                    <option value="wellness" className="bg-slate-950 text-white">Wellness</option>
                    <option value="bikini" className="bg-slate-950 text-white">Biquíni</option>
                  </optgroup>
                )}
            </select>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-8">
        
        {/* Dados Corporais */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Upload size={20} className="text-blue-500"/> Dados Corporais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Peso Atual (kg)</label>
                <input name="weight" type="number" step="0.1" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Ex: 75.5" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Como foi a semana?</label>
                <input name="notes" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Resumo da dieta e treino..." />
            </div>
          </div>
        </div>

        {/* Fotos (Lógica Dinâmica) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="font-semibold text-white flex items-center gap-2">
               <Camera size={20} className="text-blue-500"/> Fotos do Shape
             </h3>
             {poseCategory !== 'padrao' && (
                 <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-bold flex items-center gap-1">
                    <Trophy size={12}/> COMPETIÇÃO
                 </span>
             )}
          </div>
          
          <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg mb-4">
             <p className="text-sm text-blue-200">
               {poseCategory !== 'padrao'
                 ? "📸 Modo Atleta: Por favor, envie as poses obrigatórias abaixo."
                 : "📸 Envie fotos com boa iluminação, fundo neutro e roupa de banho/íntima."}
             </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* 1. PADRÃO */}
            {poseCategory === 'padrao' && (
                <>
                    <PhotoInput label="Frente" name="photo_front" />
                    <PhotoInput label="Costas" name="photo_back" />
                    <PhotoInput label="Perfil" name="photo_side" />
                </>
            )}

            {/* 2. MASCULINO (Bodybuilding & Classic) */}
            {(poseCategory === 'bodybuilding' || poseCategory === 'classic') && (
                <>
                    <PhotoInput label="Expansão (Frente)" name="photo_front_lat_spread" />
                    <PhotoInput label="Expansão (Costas)" name="photo_back_lat_spread" />
                    <PhotoInput label="Duplo Bíceps (Frente)" name="photo_front_double_biceps" />
                    <PhotoInput label="Duplo Bíceps (Costas)" name="photo_back_double_biceps" />
                    <PhotoInput label="Peitoral" name="photo_side_chest" />
                    <PhotoInput label="Abs e Coxa" name="photo_abs_thigh" />
                    <PhotoInput label="Vacuum" name="photo_vacuum" />
                    <PhotoInput label="Most Muscular" name="photo_most_muscular" />
                </>
            )}

            {/* 3. WELLNESS (COM PERFIL ESQUERDO E DIREITO) */}
            {poseCategory === 'wellness' && (
                <>
                    <PhotoInput label="Frente (Wellness)" name="photo_female_front" />
                    <PhotoInput label="Costas (Wellness)" name="photo_female_back" />
                    <PhotoInput label="Perfil Direito" name="photo_female_side_right" />
                    <PhotoInput label="Perfil Esquerdo" name="photo_female_side_left" />
                    <PhotoInput label="Pose Categoria" name="photo_female_quarter" />
                </>
            )}

             {/* 4. BIKINI (COM PERFIL ESQUERDO E DIREITO) */}
             {poseCategory === 'bikini' && (
                <>
                    <PhotoInput label="Frente" name="photo_female_front" />
                    <PhotoInput label="Costas" name="photo_female_back" />
                    <PhotoInput label="Perfil Direito" name="photo_female_side_right" />
                    <PhotoInput label="Perfil Esquerdo" name="photo_female_side_left" />
                    <PhotoInput label="Transição" name="photo_female_quarter" />
                </>
            )}
          </div>
        </div>

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

// Componente PhotoInput
function PhotoInput({ label, name }: { label: string, name: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };
  return (
    <div className="relative group col-span-1">
      <label className="block text-[10px] md:text-xs font-bold text-slate-400 mb-2 text-center uppercase h-8 flex items-end justify-center leading-tight">{label}</label>
      <div className={`relative w-full aspect-[3/4] bg-slate-950 border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all ${preview ? 'border-emerald-500' : 'border-slate-800 hover:border-blue-500'}`}>
        {preview ? (
          <>
            <img src={preview} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
          </>
        ) : (
          <>
            <Camera className="text-slate-600 mb-2 group-hover:text-blue-500 transition-colors w-6 h-6" />
            <span className="text-[10px] text-slate-600 group-hover:text-blue-400">Add</span>
          </>
        )}
        <input type="file" name={name} accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
      </div>
    </div>
  );
}