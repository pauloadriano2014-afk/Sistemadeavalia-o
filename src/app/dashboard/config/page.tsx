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
      alert("Logo atualizada! Atualize a página.");
    } catch (error) {
      alert("Erro ao enviar logo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
         <h2 className="text-lg font-semibold text-white mb-4 flex gap-2"><ImageIcon/> Logo do App</h2>
         <label className="cursor-pointer bg-slate-950 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center transition-all">
            {loading ? <Loader2 className="animate-spin text-blue-500"/> : <Upload className="text-slate-400 mb-2"/>}
            <span className="text-sm text-slate-400">Clique para enviar sua logo</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
         </label>
      </div>
    </div>
  );
}