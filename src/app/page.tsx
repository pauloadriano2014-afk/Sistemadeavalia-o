"use client";

import { login } from "@/app/login/auth-service";
import { useState } from "react";
import { Loader2, Lock, Mail, Dumbbell } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Efeito de fundo Neon sutil */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-lime-900/20 blur-[120px] opacity-30"></div>
        <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-lime-900/20 blur-[120px] opacity-30"></div>
      </div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
        
        {/* Logo / Cabeçalho */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-500 mb-4 shadow-lg shadow-lime-900/20 group hover:border-lime-500 transition-all duration-500">
            <Dumbbell size={40} className="group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            COACH <span className="text-lime-400">PRO</span>
          </h1>
          <p className="text-zinc-400 text-sm uppercase tracking-widest font-bold">
            Sistema de Alta Performance
          </p>
        </div>

        {/* Formulário */}
        <form action={handleSubmit} className="bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-2xl p-8 space-y-6 shadow-2xl">
          
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-900/50 rounded-lg text-sm text-red-400 text-center font-bold flex items-center justify-center gap-2">
             ⚠️ {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1 tracking-widest">Email de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-zinc-500 group-focus-within:text-lime-400 transition-colors duration-300" size={20} />
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all duration-300"
                  placeholder="seumail@treinador.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1 tracking-widest">Sua Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-zinc-500 group-focus-within:text-lime-400 transition-colors duration-300" size={20} />
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black uppercase tracking-wider py-4 rounded-xl transition-all duration-300 shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 flex items-center justify-center gap-3 scale-100 hover:scale-[1.02] active:scale-95"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : "Entrar no Painel ➜"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 font-bold uppercase tracking-widest">
          Fitness SaaS © 2026
        </p>
      </div>
    </div>
  );
}