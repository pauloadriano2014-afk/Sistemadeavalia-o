"use client";

import { login } from "@/app/login/actions";
import { useState } from "react";
import { Loader2, Lock, Mail, Dumbbell } from "lucide-react";
import Link from "next/link"; // Adicionado Link

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");
    
    const result = await login(formData);
    
    // Se a action retornar um objeto com erro, exibimos.
    // Se der sucesso, ela faz o redirect e a página muda.
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Logo / Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 text-blue-500 mb-4 ring-1 ring-blue-600/50 shadow-[0_0_30px_-5px_rgba(37,99,235,0.3)]">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Painel do Treinador
          </h1>
          <p className="text-slate-400">
            Acesso administrativo exclusivo.
          </p>
        </div>

        {/* Formulário de Login */}
        <form action={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-200 text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  placeholder="admin@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Entrar no Sistema"}
          </button>
        </form>

        {/* --- ADICIONEI ESTE BLOCO ABAIXO PARA O LINK DE CADASTRO --- */}
        <div className="text-center">
            <p className="text-sm text-slate-400">
                Ainda não tem conta?{" "}
                <Link href="/cadastro" className="text-blue-500 hover:text-blue-400 font-bold transition-colors">
                    Cadastre-se aqui
                </Link>
            </p>
        </div>

        <p className="text-center text-xs text-slate-500 pt-4">
          &copy; 2026 Sistema de Consultoria
        </p>
      </div>
    </div>
  );
}