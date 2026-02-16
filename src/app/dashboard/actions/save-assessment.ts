"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

interface SaveAssessmentParams {
  studentId: string;
  title: string;
  type: "raio_x" | "manual" | "comparativo";
  content: string;
  photos?: string[]; // URLs das fotos (se tiver)
}

export async function saveAssessment(data: SaveAssessmentParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Usuário não autenticado." };

  try {
    const { error } = await supabase.from("assessments").insert({
      student_id: data.studentId,
      coach_id: user.id, // Você (o treinador logado)
      title: data.title,
      type: data.type,
      content: data.content,
      photos: data.photos || [],
    });

    if (error) throw error;

    // Atualiza a página do aluno para o novo registro aparecer na lista
    revalidatePath(`/dashboard/alunos/${data.studentId}`);
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    return { error: "Erro ao salvar no prontuário." };
  }
}