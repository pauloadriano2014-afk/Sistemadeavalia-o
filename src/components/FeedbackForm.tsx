"use client";

import { useState } from "react";
import { Save, Loader2, FileText } from "lucide-react";
import { saveFeedback } from "@/app/dashboard/alunos/actions"; 

interface FeedbackFormProps {
  checkinId: string;
  studentId: string;
  initialFeedback?: string;
}

export default function FeedbackForm({ checkinId, studentId, initialFeedback }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState(initialFeedback || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append("checkinId", checkinId);
    formData.append("studentId", studentId);
    formData.append("feedback", feedback);

    await saveFeedback(formData);
    
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
            <FileText size={12} /> Anotações do Treinador (Privado)
          </label>
          {saved && <span className="text-[10px] text-emerald-600 font-bold animate-pulse">✓ Salvo!</span>}
      </div>
      
      <textarea 
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 text-sm focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none placeholder:text-gray-400 resize-none transition-all"
        rows={3}
        placeholder="Anote aqui observações técnicas para consultar depois..."
      />

      <div className="flex justify-end mt-2">
        <button 
          type="submit" 
          disabled={loading || feedback === initialFeedback}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-gray-200"
        >
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
          {loading ? "Salvando..." : "Salvar Anotação"}
        </button>
      </div>
    </form>
  );
}