"use client";

import { createCheckin } from "@/app/dashboard/checkin/actions";
import { Upload, Camera, Save, ArrowLeft, Loader2, User, Trophy, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import imageCompression from 'browser-image-compression';
import { useParams, useRouter } from "next/navigation"; // <--- Adicionei useRouter
import { createBrowserClient } from "@supabase/ssr"; 

export default function CoachCheckinPage() {
  const params = useParams();
  const router = useRouter(); // <--- Hook de navegação
  const studentId = params.id as string;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  const [poseCategory, setPoseCategory] = useState("");
  const [checkingData, setCheckingData] = useState(true);
  const [studentOriginalGoal, setStudentOriginalGoal] = useState("");
  const [studentGender, setStudentGender] = useState("female"); 

  useEffect(() => {
    async function fetchStudentData() {
      const { data: student } = await supabase
        .from('profiles')
        .select('selected_goal, gender')
        .eq('id', studentId)
        .single();
      
      let goal = student?.selected_goal || "emagrecimento";
      let gender = student?.gender;

      if (['classic', 'bodybuilding', 'competicao_men'].includes(goal)) {
        gender = 'male';
      } else if (['wellness', 'bikini', 'competicao_women'].includes(goal)) {
        gender = 'female';
      }
      if (!gender) gender = 'female';

      setStudentOriginalGoal(goal);
      setStudentGender(gender);

      if (goal === 'emagrecimento') {
          setPoseCategory('padrao');
      } else {
          setPoseCategory(goal);
      }
      setCheckingData(false);
    }
    fetchStudentData();
  }, [studentId, supabase]);

  async function compressFile(file: File) {
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true, fileType: "image/jpeg", initialQuality: 0.7 };
    try { return await imageCompression(file, options); } catch (error) { return file; }
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setStatus("Enviando..."); // Feedback visual
    try {
      formData.append("studentId", studentId);
      const keys = Array.from(formData.keys()).filter(key => key.startsWith('photo_'));
      for (const key of keys) {
        const file = formData.get(key) as File;
        if (file && file.size > 0) {
          const compressed = await compressFile(file);
          formData.set(key, compressed);
        }
      }
      
      // --- MUDANÇA AQUI: Recebe o resultado ---
      const result = await createCheckin(formData);
      
      if (result && result.success) {
          setStatus("Sucesso! Redirecionando...");
          router.push(result.url); // Navegação segura pelo cliente
          router.refresh(); // Garante que os dados novos apareçam
      } else {
          throw new Error("Erro desconhecido");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao lançar check-in. Tente novamente.");
      setLoading(false);
    }
  };

  if (checkingData) return <div className="p-10 text-center text-slate-500">Carregando dados...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <Link href={`/dashboard/alunos/${studentId}`} className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar ao Perfil do Aluno
      </Link>

      <div className="bg-blue-900/20 border border-blue-900/50 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-full text-white"><User size={24}/></div>
            <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Lançamento Manual
            </h1>
            <p className="text-blue-200 text-sm flex items-center gap-2">
                <span className="opacity-70">Aluno:</span> 
                <span className={`font-mono px-2 py-0.5 rounded uppercase font-bold text-xs ${studentGender === 'male' ? 'bg-blue-950 text-blue-200' : 'bg-pink-950 text-pink-200'}`}>
                    {studentGender === 'male' ? 'Masculino' : 'Feminino'}
                </span>
            </p>
            </div>
        </div>

        {/* Menu Estrito */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-lg">
            <LayoutDashboard size={20} className="text-slate-400 ml-2" />
            <select 
                value={poseCategory}
                onChange={(e) => setPoseCategory(e.target.value)}
                className="bg-slate-950 text-white font-bold text-sm focus:outline-none cursor-pointer py-1 px-2 border-none ring-0 w-48"
            >
                {studentOriginalGoal === 'emagrecimento' && <option value="padrao">Padrão (3 Fotos)</option>}
                {studentOriginalGoal === 'hipertrofia' && <option value="hipertrofia">Hipertrofia</option>}
                {studentOriginalGoal === 'classic' && <option value="classic">Classic Physique</option>}
                {studentOriginalGoal === 'bodybuilding' && <option value="bodybuilding">Bodybuilding Open</option>}
                {studentOriginalGoal === 'wellness' && <option value="wellness">Wellness</option>}
                {studentOriginalGoal === 'bikini' && <option value="bikini">Biquíni</option>}
            </select>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-8">
        
        {/* Dados Corporais */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Peso (kg)</label>
                <input name="weight" type="number" step="0.1" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Ex: 80.5" />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
                <input name="notes" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Relato do aluno..." />
             </div>
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="font-semibold text-white flex items-center gap-2">
                <Camera size={20} className="text-blue-500"/> Fotos Necessárias
             </h3>
             {poseCategory !== 'padrao' && poseCategory !== 'hipertrofia' && (
                 <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-bold flex items-center gap-1">
                    <Trophy size={12}/> COMPETIÇÃO
                 </span>
             )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
            {/* ... (Mantém a lógica de fotos exatamente igual ao anterior) ... */}
            
            {/* PADRÃO */}
            {poseCategory === 'padrao' && (
                <>
                    <PhotoInput label="Frente (Relaxado)" name="photo_front" />
                    <PhotoInput label="Costas (Relaxado)" name="photo_back" />
                    <PhotoInput label="Perfil" name="photo_side" />
                </>
            )}

            {/* HIPERTROFIA */}
            {poseCategory === 'hipertrofia' && (
                <>
                    <PhotoInput label="Frente (Relaxado)" name="photo_front" />
                    <PhotoInput label="Costas (Relaxado)" name="photo_back" />
                    <PhotoInput label="Perfil" name="photo_side" />
                    {studentGender === 'male' && (
                        <>
                            <PhotoInput label="Duplo Bíceps (Frente)" name="photo_front_double_biceps" />
                            <PhotoInput label="Duplo Bíceps (Costas)" name="photo_back_double_biceps" />
                        </>
                    )}
                    {studentGender === 'female' && (
                        <>
                            <PhotoInput label="Pernas (Contraindo)" name="photo_female_legs" />
                            <PhotoInput label="Glúteos (Contraindo)" name="photo_female_glutes" />
                        </>
                    )}
                </>
            )}

            {/* CLASSIC */}
            {poseCategory === 'classic' && (
                <>
                    <PhotoInput label="Duplo Bíceps (Frente)" name="photo_front_double_biceps" />
                    <PhotoInput label="Duplo Bíceps (Costas)" name="photo_back_double_biceps" />
                    <PhotoInput label="Expansão (Frente)" name="photo_front_lat_spread" />
                    <PhotoInput label="Expansão (Costas)" name="photo_back_lat_spread" />
                    <PhotoInput label="Peitoral (Lado)" name="photo_side_chest" />
                    <PhotoInput label="Abs e Coxa" name="photo_abs_thigh" />
                    <PhotoInput label="Vacuum" name="photo_vacuum" />
                </>
            )}

            {/* BODYBUILDING */}
            {poseCategory === 'bodybuilding' && (
                <>
                    <PhotoInput label="Duplo Bíceps (Frente)" name="photo_front_double_biceps" />
                    <PhotoInput label="Duplo Bíceps (Costas)" name="photo_back_double_biceps" />
                    <PhotoInput label="Expansão (Frente)" name="photo_front_lat_spread" />
                    <PhotoInput label="Expansão (Costas)" name="photo_back_lat_spread" />
                    <PhotoInput label="Peitoral (Lado)" name="photo_side_chest" />
                    <PhotoInput label="Abs e Coxa" name="photo_abs_thigh" />
                    <PhotoInput label="Most Muscular" name="photo_most_muscular" />
                </>
            )}

            {/* WELLNESS */}
            {poseCategory === 'wellness' && (
                <>
                    <PhotoInput label="Perfil Direito" name="photo_female_side_right" />
                    <PhotoInput label="Perfil Esquerdo" name="photo_female_side_left" />
                    <PhotoInput label="Pose de Costas (W)" name="photo_female_back" />
                    <PhotoInput label="Pose de Frente (W)" name="photo_female_front" />
                    <PhotoInput label="Pose Categoria" name="photo_female_quarter" />
                </>
            )}

             {/* BIQUÍNI */}
             {poseCategory === 'bikini' && (
                <>
                    <PhotoInput label="Perfil Direito" name="photo_female_side_right" />
                    <PhotoInput label="Perfil Esquerdo" name="photo_female_side_left" />
                    <PhotoInput label="Pose de Costas (B)" name="photo_female_back" />
                    <PhotoInput label="Pose de Frente (B)" name="photo_female_front" />
                    <PhotoInput label="Transição" name="photo_female_quarter" />
                </>
            )}

          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {loading ? status : "Salvar no Histórico"}
        </button>
      </form>
    </div>
  );
}

// (Mantenha o componente PhotoInput aqui embaixo igual)
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