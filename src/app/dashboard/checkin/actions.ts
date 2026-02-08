"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createCheckin(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 2. Perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error("Perfil não encontrado");

  // 3. Definir Aluno Alvo
  let studentId = user.id;
  if (profile.role === 'coach') {
    const targetStudentId = formData.get("studentId") as string;
    if (!targetStudentId) throw new Error("ID do aluno obrigatório");
    studentId = targetStudentId;
  }

  // 4. Criar Check-in
  const weight = parseFloat(formData.get("weight") as string);
  const notes = formData.get("notes") as string;

  const { data: checkin, error: checkinError } = await supabase
    .from("checkins")
    .insert({
      user_id: studentId,
      tenant_id: profile.tenant_id,
      weight,
      notes,
      status: profile.role === 'coach' ? "reviewed" : "pending"
    })
    .select()
    .single();

  if (checkinError) {
    console.error(checkinError);
    throw new Error("Erro ao salvar no banco de dados");
  }

  // 5. Upload das Fotos
  const photoUploads = [];
  const possiblePhotos = [
    { key: "photo_front", label: "Frente" },
    { key: "photo_back", label: "Costas" },
    { key: "photo_side", label: "Perfil" },
    { key: "photo_female_legs", label: "Pernas (Contraindo)" },
    { key: "photo_female_glutes", label: "Glúteos (Contraindo)" },
    { key: "photo_front_double_biceps", label: "Duplo Bíceps (Frente)" },
    { key: "photo_back_double_biceps", label: "Duplo Bíceps (Costas)" },
    { key: "photo_front_lat_spread", label: "Expansão de Dorsais (Frente)" },
    { key: "photo_back_lat_spread", label: "Expansão de Dorsais (Costas)" },
    { key: "photo_side_chest", label: "Peitoral (Melhor Lado)" },
    { key: "photo_abs_thigh", label: "Abdominais e Coxas" },
    { key: "photo_vacuum", label: "Vacuum Abdominal" },
    { key: "photo_most_muscular", label: "Most Muscular" },
    { key: "photo_female_front", label: "Pose de Frente" },
    { key: "photo_female_back", label: "Pose de Costas" },
    { key: "photo_female_side_right", label: "Perfil Direito" },
    { key: "photo_female_side_left", label: "Perfil Esquerdo" },
    { key: "photo_female_quarter", label: "Pose de Transição/Categoria" }
  ];

  for (const item of possiblePhotos) {
    const file = formData.get(item.key) as File;
    if (file && file.size > 0) {
      const filename = `${studentId}/${checkin.id}/${item.key}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("checkin-photos")
        .upload(filename, file);

      if (!uploadError) {
        photoUploads.push({
          user_id: studentId,
          checkin_id: checkin.id,
          storage_path: filename,
          pose_label: item.label
        });
      }
    }
  }

  if (photoUploads.length > 0) {
    await supabase.from("photos").insert(photoUploads);
  }

  // 6. Finalização (SEM REDIRECT BRUSCO)
  // Apenas revalidamos o cache e retornamos sucesso
  if (profile.role === 'coach') {
    revalidatePath(`/dashboard/alunos/${studentId}`);
    return { success: true, url: `/dashboard/alunos/${studentId}` };
  } else {
    revalidatePath("/dashboard");
    return { success: true, url: "/dashboard?success=Checkin enviado" };
  }
}