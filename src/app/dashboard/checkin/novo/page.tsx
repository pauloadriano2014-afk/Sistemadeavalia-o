"use client";

import { createCheckin } from "@/app/dashboard/checkin/actions";
import { Camera, Save, ArrowLeft, Loader2, User, Trophy, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import imageCompression from 'browser-image-compression';
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr"; 

export default function CoachCheckinPage() {
  const params = useParams();
  const router = useRouter();
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
  const [studentGender, setStudentGender] = useState("feminino"); // Padrão seguro

  useEffect(() => {
    async function fetchStudentData() {
      const { data: student } = await supabase
        .from('profiles')
        .select('selected_goal, gender')
        .eq('id', studentId)
        .single();
      
      const goal = student?.selected_goal || "emagrecimento";
      const rawGender = student?.gender?.toLowerCase() || "female";

      // --- CORREÇÃO DE GÊNERO (Tradução forçada) ---
      let finalGender = "feminino";
      
      // Se vier 'male' (banco) ou 'masculino', vira 'masculino'
      if (rawGender === 'male' || rawGender === 'masculino') {
        finalGender = 'masculino';
      }

      // Override por Categoria (Competição força o gênero)
      if (['classic', 'bodybuilding', 'competicao_men'].includes(goal)) {
        finalGender = 'masculino';
      } else if (['wellness', 'bikini', 'competicao_women'].includes(goal)) {
        finalGender = 'feminino';
      }

      setStudentOriginalGoal(goal);
      setStudentGender(finalGender);

      // Define categoria de poses inicial
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
    setStatus("Salvando...");
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
      
      const result = await createCheckin(formData);
      
      if (result && result.success) {
          setStatus("Salvo! Redirecionando...");
          router.push(result.url);
          router.refresh();
      } else {
          throw new Error("Erro desconhecido");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao lançar check-in. Tente novamente.");
      setLoading(false);
    }
  };

  if (checkingData) return <div className="p-10 text-center text-zinc-500 font-bold uppercase animate-pulse">Carregando dados...</div>;

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      <div className="max-w-4xl mx-auto space-y-8 p-6 animate-in slide-in-from-bottom-4 duration-500">
        
        <Link href={`/dashboard/alunos/${studentId}`} className="inline-flex items-center text-zinc-400 hover:text-lime-400 transition-colors font-bold uppercase text-xs tracking-wider">
          <ArrowLeft size={18} className="mr-2" /> Voltar ao Prontuário
        </Link>

        {/* HEADER DO CHECKIN */}
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-black/50">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-lime-500 rounded-xl text-black shadow-[0_0_15px_rgba(132,204,22,0.3)]"><User size={28}/></div>
              <div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Novo Registro Manual
              </h1>
              <p className="text-zinc-500 text-sm flex items-center gap-2 font-bold mt-1">
                  <span className="opacity-70 uppercase text-[10px] tracking-widest">Atleta:</span> 
                  {/* CORREÇÃO VISUAL DO GÊNERO */}
                  <span className={`font-black px-2 py-0.5 rounded uppercase text-[10px] border ${studentGender === 'masculino' ? 'bg-blue-950/30 border-blue-900 text-blue-400' : 'bg-pink-950/30 border-pink-900 text-pink-400'}`}>
                      {studentGender === 'masculino' ? 'MASCULINO' : 'FEMININO'}
                  </span>
              </p>
              </div>
          </div>

          {/* Menu Estrito */}
          <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-xl focus-within:border-lime-500 transition-colors">
              <LayoutDashboard size={20} className="text-lime-500 ml-2" />
              <select 
                  value={poseCategory}
                  onChange={(e) => setPoseCategory(e.target.value)}
                  className="bg-black text-white font-bold text-sm focus:outline-none cursor-pointer py-2 px-2 border-none ring-0 w-48 uppercase tracking-wide"
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
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 space-y-8 shadow-lg shadow-black/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <label className="block text-[10px] font-black text-lime-400 uppercase mb-3 tracking-widest ml-1">Peso Atual (kg)</label>
                  <input name="weight" type="number" step="0.1" required className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 text-white font-bold text-lg focus:ring-1 focus:ring-lime-500 focus:border-lime-500 focus:outline-none transition-all placeholder:text-zinc-700" placeholder="00.0" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest ml-1">Relato do Aluno</label>
                  <input name="notes" className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 text-white font-bold focus:ring-1 focus:ring-lime-500 focus:border-lime-500 focus:outline-none transition-all placeholder:text-zinc-700" placeholder="Feedback rápido da semana..." />
               </div>
            </div>
          </div>

          {/* Fotos */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg shadow-black/50">
            <div className="flex justify-between items-center">
               <h3 className="font-black text-white flex items-center gap-3 text-lg uppercase tracking-tight italic">
                  <Camera size={24} className="text-lime-500"/> Protocolo de Fotos
               </h3>
               {poseCategory !== 'padrao' && poseCategory !== 'hipertrofia' && (
                   <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-lg font-black flex items-center gap-2 uppercase tracking-wider">
                      <Trophy size={12}/> Competição
                   </span>
               )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
              {/* PADRÃO */}
              {poseCategory === 'padrao' && (
                  <>
                      <PhotoInput label="Frente" name="photo_front" />
                      <PhotoInput label="Costas" name="photo_back" />
                      <PhotoInput label="Perfil" name="photo_side" />
                  </>
              )}

              {/* HIPERTROFIA (Dinâmico para H/M) */}
              {poseCategory === 'hipertrofia' && (
                  <>
                      <PhotoInput label="Frente" name="photo_front" />
                      <PhotoInput label="Costas" name="photo_back" />
                      <PhotoInput label="Perfil" name="photo_side" />
                      
                      {/* POSES ESPECÍFICAS DE HOMEM */}
                      {studentGender === 'masculino' && (
                          <>
                              <PhotoInput label="D. Bíceps (F)" name="photo_front_double_biceps" />
                              <PhotoInput label="D. Bíceps (C)" name="photo_back_double_biceps" />
                          </>
                      )}
                      
                      {/* POSES ESPECÍFICAS DE MULHER */}
                      {studentGender === 'feminino' && (
                          <>
                              <PhotoInput label="Pernas" name="photo_female_legs" />
                              <PhotoInput label="Glúteos" name="photo_female_glutes" />
                          </>
                      )}
                  </>
              )}

              {/* CLASSIC */}
              {poseCategory === 'classic' && (
                  <>
                      <PhotoInput label="D. Bíceps (F)" name="photo_front_double_biceps" />
                      <PhotoInput label="D. Bíceps (C)" name="photo_back_double_biceps" />
                      <PhotoInput label="Expansão (F)" name="photo_front_lat_spread" />
                      <PhotoInput label="Expansão (C)" name="photo_back_lat_spread" />
                      <PhotoInput label="Peitoral" name="photo_side_chest" />
                      <PhotoInput label="Abs e Coxa" name="photo_abs_thigh" />
                      <PhotoInput label="Vacuum" name="photo_vacuum" />
                  </>
              )}

              {/* BODYBUILDING */}
              {poseCategory === 'bodybuilding' && (
                  <>
                      <PhotoInput label="D. Bíceps (F)" name="photo_front_double_biceps" />
                      <PhotoInput label="D. Bíceps (C)" name="photo_back_double_biceps" />
                      <PhotoInput label="Expansão (F)" name="photo_front_lat_spread" />
                      <PhotoInput label="Expansão (C)" name="photo_back_lat_spread" />
                      <PhotoInput label="Peitoral" name="photo_side_chest" />
                      <PhotoInput label="Abs e Coxa" name="photo_abs_thigh" />
                      <PhotoInput label="Most Muscular" name="photo_most_muscular" />
                  </>
              )}

              {/* WELLNESS */}
              {poseCategory === 'wellness' && (
                  <>
                      <PhotoInput label="Perfil Dir." name="photo_female_side_right" />
                      <PhotoInput label="Perfil Esq." name="photo_female_side_left" />
                      <PhotoInput label="Costas (W)" name="photo_female_back" />
                      <PhotoInput label="Frente (W)" name="photo_female_front" />
                      <PhotoInput label="Pose Cat." name="photo_female_quarter" />
                  </>
              )}

               {/* BIQUÍNI */}
               {poseCategory === 'bikini' && (
                  <>
                      <PhotoInput label="Perfil Dir." name="photo_female_side_right" />
                      <PhotoInput label="Perfil Esq." name="photo_female_side_left" />
                      <PhotoInput label="Costas (B)" name="photo_female_back" />
                      <PhotoInput label="Frente (B)" name="photo_female_front" />
                      <PhotoInput label="Transição" name="photo_female_quarter" />
                  </>
              )}

            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-lime-500 hover:bg-lime-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] flex items-center justify-center gap-3 transform active:scale-95">
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            {loading ? status : "SALVAR NO PRONTUÁRIO"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PhotoInput({ label, name }: { label: string, name: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };
  return (
    <div className="relative group col-span-1">
      <label className="block text-[10px] font-black text-zinc-500 mb-2 text-center uppercase h-6 flex items-end justify-center leading-tight tracking-wider">{label}</label>
      <div className={`relative w-full aspect-[3/4] bg-black border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${preview ? 'border-lime-500' : 'border-zinc-800 hover:border-lime-500 group-hover:bg-zinc-950'}`}>
        {preview ? (
          <>
            <img src={preview} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-lime-500 text-black rounded-full p-1.5 shadow-lg"><div className="w-2 h-2 bg-black rounded-full"></div></div>
          </>
        ) : (
          <>
            <Camera className="text-zinc-600 mb-3 group-hover:text-lime-500 transition-colors w-8 h-8 group-hover:scale-110 duration-300" />
            <span className="text-[9px] text-zinc-600 group-hover:text-lime-400 font-black uppercase tracking-widest">Adicionar</span>
          </>
        )}
        <input type="file" name={name} accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
      </div>
    </div>
  );
}