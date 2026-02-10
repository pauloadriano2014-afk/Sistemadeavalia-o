"use client";

import { createStudent } from "../actions";
import { Save, UserPlus, ArrowLeft, Loader2, Mail, Lock, User, Target, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function NovoAlunoPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Estados para controlar a lógica automática
  const [goal, setGoal] = useState("emagrecimento");
  const [gender, setGender] = useState("female");
  const [isGenderLocked, setIsGenderLocked] = useState(false);

  // Lógica inteligente de seleção
  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGoal = e.target.value;
    setGoal(selectedGoal);

    if (['bodybuilding', 'classic'].includes(selectedGoal)) {
      setGender('male');
      setIsGenderLocked(true);
    } else if (['wellness', 'bikini'].includes(selectedGoal)) {
      setGender('female');
      setIsGenderLocked(true);
    } else {
      setIsGenderLocked(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setErrorMsg("");

    try {
        formData.set("gender", gender);
        
        const result = await createStudent(formData);
        
        if (result?.error) {
            setErrorMsg(result.error);
            setLoading(false);
        } 
    } catch (e) {
        setErrorMsg("Erro de conexão. Tente novamente.");
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 bg-black min-h-screen p-6">
      
      <Link href="/dashboard/alunos" className="inline-flex items-center text-zinc-500 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">
        <ArrowLeft size={16} className="mr-2" /> Voltar para Lista
      </Link>

      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
          <UserPlus className="text-lime-500" size={32}/> Novo Aluno
        </h1>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-2">Cadastre um novo atleta para o seu time.</p>
      </div>

      <form action={handleSubmit} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 blur-3xl rounded-full pointer-events-none"></div>

        {/* Exibição de Erro */}
        {errorMsg && (
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400 text-sm font-bold">
                <AlertCircle size={20} />
                {errorMsg}
            </div>
        )}

        {/* Nome Completo */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
            <User size={14} className="text-lime-500"/> Nome Completo
          </label>
          <input name="fullName" type="text" required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all placeholder:text-zinc-700" placeholder="Ex: João Silva" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Mail size={14} className="text-lime-500"/> Email de Acesso
              </label>
              <input name="email" type="email" required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all placeholder:text-zinc-700" placeholder="cliente@email.com" />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Lock size={14} className="text-lime-500"/> Senha Provisória
              </label>
              <input name="password" type="text" required minLength={6} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all placeholder:text-zinc-700" placeholder="Mínimo 6 caracteres" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-900">
            {/* Objetivo (Controla o Gênero) */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} className="text-lime-500"/> Categoria / Objetivo
              </label>
              <div className="relative">
                <select name="goal" value={goal} onChange={handleGoalChange} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none appearance-none cursor-pointer uppercase text-xs tracking-wide">
                    <option value="emagrecimento">Emagrecimento (Geral)</option>
                    <option value="hipertrofia">Hipertrofia (Geral)</option>
                    <optgroup label="Masculino (Atleta)" className="bg-zinc-900 text-lime-400">
                        <option value="bodybuilding">Bodybuilding Open</option>
                        <option value="classic">Classic Physique</option>
                    </optgroup>
                    <optgroup label="Feminino (Atleta)" className="bg-zinc-900 text-lime-400">
                        <option value="wellness">Wellness</option>
                        <option value="bikini">Biquíni</option>
                    </optgroup>
                </select>
              </div>
            </div>

            {/* GÊNERO (Automático ou Manual) */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-lime-500"/> Gênero {isGenderLocked && <span className="text-[9px] text-lime-600 bg-lime-500/10 px-1.5 py-0.5 rounded ml-1">AUTO</span>}
              </label>
              <div className={`relative ${isGenderLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={isGenderLocked}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none appearance-none cursor-pointer uppercase text-xs tracking-wide"
                >
                    <option value="female">Feminino</option>
                    <option value="male">Masculino</option>
                </select>
              </div>
            </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-lime-500 hover:bg-lime-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] flex items-center justify-center gap-2 mt-6 transform active:scale-95">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          CADASTRAR ALUNO
        </button>

      </form>
    </div>
  );
}