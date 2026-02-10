"use client";

import { login, signup } from "./actions";
import { Loader2, Dumbbell } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  // Wrapper simples para mostrar loading no botão clicado
  const handleAction = async (formData: FormData, action: any) => {
      setLoading(true);
      await action(formData);
      setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-500 via-transparent to-lime-500 opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-lime-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 bg-zinc-950 p-10 rounded-3xl border border-zinc-900 shadow-2xl relative z-10">
        
        <div className="text-center">
          <div className="inline-flex p-4 rounded-2xl bg-black border border-zinc-800 mb-6 shadow-lg shadow-lime-500/10">
             <Dumbbell className="text-lime-500" size={32} />
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">
            Coach <span className="text-lime-500">App</span>
          </h2>
          <p className="mt-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Acesso Restrito
          </p>
        </div>
        
        <form className="mt-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="email-address" className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest ml-1">
                E-mail
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-xl border border-zinc-800 bg-black py-4 px-4 text-white placeholder-zinc-700 font-bold focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest ml-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-xl border border-zinc-800 bg-black py-4 px-4 text-white placeholder-zinc-700 font-bold focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            {/* Botão de Entrar (Lime Neon) */}
            <button
              formAction={login}
              className="w-full justify-center rounded-xl bg-lime-500 px-4 py-4 text-sm font-black text-black hover:bg-lime-400 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] transform active:scale-95"
            >
              Acessar Painel
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Opções</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            {/* Botão de Criar Conta (Zinc/Outline) */}
            <button
              formAction={signup}
              className="w-full justify-center rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-4 text-sm font-bold text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all uppercase tracking-widest"
            >
              Criar Nova Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}