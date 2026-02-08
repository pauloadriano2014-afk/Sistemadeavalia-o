"use client";

import { signUp } from "./actions";
import { useState } from "react";
import { Loader2, UserPlus, ArrowLeft, Mail, Lock, User } from "lucide-react";
import Link from "next/link";

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMsg("");
    const result = await signUp(formData); // O redirect acontece no server
    if (result?.error) {
      setMsg(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Criar Conta</h1>
          <p className="text-slate-400">Junte-se a nós como Treinador.</p>
        </div>

        <form action={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          {msg && <div className="p-3 bg-red-900/30 text-red-200 text-sm rounded">{msg}</div>}
          
          <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-slate-400">NOME COMPLETO</label>
                <div className="relative mt-1">
                    <User className="absolute left-3 top-3 text-slate-500" size={18}/>
                    <input name="fullName" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white" required placeholder="Seu nome" />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-400">EMAIL</label>
                <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={18}/>
                    <input name="email" type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white" required placeholder="email@exemplo.com" />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-400">SENHA</label>
                <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={18}/>
                    <input name="password" type="password" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white" required placeholder="Min. 6 caracteres" />
                </div>
            </div>
          </div>

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : "Cadastrar"}
          </button>
        </form>

        <div className="text-center">
            <Link href="/" className="text-slate-500 hover:text-white text-sm flex items-center justify-center gap-2"><ArrowLeft size={16}/> Voltar ao Login</Link>
        </div>
      </div>
    </div>
  );
}