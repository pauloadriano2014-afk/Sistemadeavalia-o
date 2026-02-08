"use client";

import { useState } from "react";
import { MessageSquare, Check, Loader2 } from "lucide-react";
import { saveFeedback } from "@/app/dashboard/alunos/actions";

interface FeedbackFormProps {
  checkinId: string;
  studentId: string;
  initialFeedback?: string;
}

export default function FeedbackForm({ checkinId, studentId, initialFeedback }: FeedbackFormProps) {
  const [isEditing, setIsEditing] = useState(!initialFeedback); // Se já tem feedback, começa fechado
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    await saveFeedback(formData);
    setLoading(false);
    setIsEditing(false);
  };

  if (!isEditing && initialFeedback) {
    return (
      <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg mt-4">
        <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-sm uppercase">
          <MessageSquare size={16} /> Feedback do Coach
        </div>
        <p className="text-white text-sm whitespace-pre-wrap">{initialFeedback}</p>
        <button 
          onClick={() => setIsEditing(true)}
          className="text-xs text-slate-500 hover:text-white mt-3 underline"
        >
          Editar avaliação
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 animate-in fade-in">
      <input type="hidden" name="checkinId" value={checkinId} />
      <input type="hidden" name="studentId" value={studentId} />
      
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        Sua Avaliação
      </label>
      
      <textarea 
        name="feedback"
        defaultValue={initialFeedback}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-600"
        rows={3}
        placeholder="Escreva aqui o feedback para o aluno (ex: Aprovado, mude a dieta, etc)..."
        required
      />

      <div className="flex justify-end mt-2">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
          {initialFeedback ? "Atualizar Feedback" : "Enviar Avaliação"}
        </button>
      </div>
    </form>
  );
}