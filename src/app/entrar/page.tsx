"use client";

import { login, signup } from "./auth"; // Importa as duas funções
import { useState } from "react";
import { Loader2, Lock, Mail, Dumbbell, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Função genérica para lidar com Login ou Cadastro
  const handleAction = async (formData: FormData, action: any) => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess("Conta criada! Redirecionando...");
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeitos de Fundo (Neon) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lime-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
        
        {/* Cabeçalho */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-500 mb-4 shadow-[0_0_40px_-10px_rgba(132,204,22,0.3)]">
            <Dumbbell size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
            COACH<span className="text-lime-500">PRO</span>
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">
            Sistema de Alta Performance
          </p>
        </div>

        {/* Formulário */}
        <form className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-3xl p-8 space-y-6 shadow-2xl">
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold text-center uppercase tracking-wide">
              ⚠️ {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-lime-500/10 border border-lime-500/20 rounded-xl text-xs text-lime-400 font-bold text-center uppercase tracking-wide">
              🎉 {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 mb-1 block tracking-widest">Email de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-lime-500 transition-colors" size={20} />
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white font-bold placeholder:text-zinc-800 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 mb-1 block tracking-widest">Senha de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-lime-500 transition-colors" size={20} />
                <input 
                  name="password" 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white font-bold placeholder:text-zinc-800 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              {/* CAMPO ESCONDIDO PARA O NOME (Opcional, se quiser pedir nome no cadastro já) */}
              <input name="fullName" type="hidden" value="Treinador Novo" />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {/* BOTÃO DE ENTRAR */}
            <button 
              formAction={(formData) => handleAction(formData, login)}
              disabled={loading}
              className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_30px_rgba(132,204,22,0.4)] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20}/> ACESSAR PAINEL</>}
            </button>

            {/* BOTÃO DE CRIAR CONTA */}
            <button 
              formAction={(formData) => handleAction(formData, signup)}
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 font-bold uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <UserPlus size={20}/> CRIAR NOVA CONTA
            </button>
          </div>

        </form>
        
        <p className="text-center text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
          Fitness SaaS © 2026 • Coach Pro System
        </p>
      </div>
    </div>
  );
}