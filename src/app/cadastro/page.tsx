"use client";

import { signUp } from "./actions";
import { useState } from "react";
import { Loader2, ArrowLeft, Mail, Lock, User } from "lucide-react";
import Link from "next/link";

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMsg("");
    const result = await signUp(formData); 
    if (result?.error) {
      setMsg(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            Criar Conta <span className="text-lime-500">.</span>
          </h1>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
            Junte-se ao time de elite.
          </p>
        </div>

        <form action={handleSubmit} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 space-y-6 shadow-2xl relative">
          {/* Top Border Neon */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-lime-500 to-transparent opacity-50"></div>

          {msg && <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 text-sm font-bold rounded-lg text-center">{msg}</div>}
          
          <div className="space-y-5">
            <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">NOME COMPLETO</label>
                <div className="relative mt-2 group">
                    <User className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-lime-500 transition-colors" size={20}/>
                    <input name="fullName" className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-12 text-white font-bold focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 transition-all placeholder:text-zinc-700" required placeholder="Seu nome" />
                </div>
            </div>
            <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">EMAIL</label>
                <div className="relative mt-2 group">
                    <Mail className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-lime-500 transition-colors" size={20}/>
                    <input name="email" type="email" className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-12 text-white font-bold focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 transition-all placeholder:text-zinc-700" required placeholder="email@exemplo.com" />
                </div>
            </div>
            <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">SENHA</label>
                <div className="relative mt-2 group">
                    <Lock className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-lime-500 transition-colors" size={20}/>
                    <input name="password" type="password" className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-12 text-white font-bold focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 transition-all placeholder:text-zinc-700" required placeholder="Min. 6 caracteres" />
                </div>
            </div>
          </div>

          <button disabled={loading} className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black py-4 rounded-xl flex justify-center gap-2 uppercase tracking-wider shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin"/> : "FINALIZAR CADASTRO"}
          </button>
        </form>

        <div className="text-center">
            <Link href="/login" className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <ArrowLeft size={16}/> Voltar ao Login
            </Link>
        </div>
      </div>
    </div>
  );
}