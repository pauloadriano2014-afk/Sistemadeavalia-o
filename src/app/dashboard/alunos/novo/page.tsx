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
      setIsGenderLocked(false); // Emagrecimento/Hipertrofia libera a escolha
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setErrorMsg("");

    try {
        // Garante que o gênero correto seja enviado mesmo se o select estiver disabled
        formData.set("gender", gender);
        
        const result = await createStudent(formData);
        
        // Se a action retornar um erro (ex: email duplicado)
        if (result?.error) {
            setErrorMsg(result.error);
            setLoading(false);
        } 
        // Se der sucesso, o redirect acontece no server e essa tela desmonta.
    } catch (e) {
        setErrorMsg("Erro de conexão. Tente novamente.");
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      <Link href="/dashboard/alunos" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar para Lista
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <UserPlus className="text-blue-500" /> Novo Aluno
        </h1>
        <p className="text-slate-400 mt-2">Cadastre um novo atleta para o seu time.</p>
      </div>

      <form action={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        
        {/* Exibição de Erro */}
        {errorMsg && (
            <div className="p-4 bg-red-900/30 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-200 text-sm">
                <AlertCircle size={20} />
                {errorMsg}
            </div>
        )}

        {/* Nome Completo */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <User size={16} /> Nome Completo
          </label>
          <input name="fullName" type="text" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Ex: João Silva" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Mail size={16} /> Email de Acesso
              </label>
              <input name="email" type="email" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="cliente@email.com" />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Lock size={16} /> Senha Provisória
              </label>
              <input name="password" type="text" required minLength={6} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Mínimo 6 caracteres" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            {/* Objetivo (Controla o Gênero) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Target size={16} /> Categoria / Objetivo
              </label>
              <div className="relative">
                <select name="goal" value={goal} onChange={handleGoalChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none appearance-none cursor-pointer">
                    <option value="emagrecimento">Emagrecimento (Geral)</option>
                    <option value="hipertrofia">Hipertrofia (Geral)</option>
                    <optgroup label="Masculino (Atleta)">
                        <option value="bodybuilding">Bodybuilding Open</option>
                        <option value="classic">Classic Physique</option>
                    </optgroup>
                    <optgroup label="Feminino (Atleta)">
                        <option value="wellness">Wellness</option>
                        <option value="bikini">Biquíni</option>
                    </optgroup>
                </select>
              </div>
            </div>

            {/* GÊNERO (Automático ou Manual) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Users size={16} /> Gênero {isGenderLocked && <span className="text-xs text-slate-500">(Automático)</span>}
              </label>
              <div className={`relative ${isGenderLocked ? 'opacity-50' : ''}`}>
                <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={isGenderLocked}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none appearance-none cursor-pointer"
                >
                    <option value="female">Feminino</option>
                    <option value="male">Masculino</option>
                </select>
              </div>
            </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-6">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Cadastrar Aluno
        </button>

      </form>
    </div>
  );
}