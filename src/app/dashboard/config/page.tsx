"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";

export default function ConfigPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const filename = `${user.id}-${Date.now()}.jpg`;
      await supabase.storage.from('logos').upload(filename, file);
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(filename);

      await supabase.from('profiles').update({ logo_url: publicUrl }).eq('id', user.id);
      alert("Logo atualizada com sucesso!");
    } catch (error) {
      alert("Erro ao enviar logo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6 bg-black min-h-screen">
      <div className="border-b border-zinc-900 pb-4">
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Configurações</h1>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">Personalize sua área</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl shadow-lg">
         <h2 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
            <ImageIcon className="text-brand" size={20}/> 
            Identidade Visual
         </h2>
         
         <label className="cursor-pointer bg-black border-2 border-dashed border-zinc-800 hover:border-brand hover:bg-zinc-900/50 rounded-xl p-12 flex flex-col items-center justify-center transition-all group">
            {loading ? (
                <Loader2 className="animate-spin text-brand" size={32}/>
            ) : (
                <div className="bg-zinc-900 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="text-zinc-500 group-hover:text-brand transition-colors" size={24}/>
                </div>
            )}
            <span className="text-sm font-bold text-zinc-400 group-hover:text-white uppercase tracking-wide">
                {loading ? "Enviando..." : "Clique para alterar a Logo"}
            </span>
            <span className="text-[10px] text-zinc-600 mt-2 font-bold">JPG ou PNG (Max 2MB)</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
         </label>
      </div>
    </div>
  );
}