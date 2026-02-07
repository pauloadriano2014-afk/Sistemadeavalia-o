"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function createCheckin(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Quem está enviando?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // 2. Buscar dados básicos
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  
  const weight = formData.get("weight") as string;
  const notes = formData.get("notes") as string;
  
  // 3. Criar o registro do Check-in Primeiro (para ter o ID)
  const { data: checkin, error: checkinError } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      tenant_id: profile?.tenant_id,
      weight: parseFloat(weight),
      notes: notes
    })
    .select()
    .single();

  if (checkinError || !checkin) {
    console.error("Erro ao criar checkin:", checkinError);
    return redirect("/dashboard?error=Erro ao salvar dados");
  }

  // 4. Função auxiliar para subir foto
  async function uploadPhoto(file: File, pose: string) {
    if (!file || file.size === 0) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${checkin.id}/${pose}.${fileExt}`;

    // Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from('checkin-photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error(`Erro upload ${pose}:`, uploadError);
      return;
    }

    // Pegar URL Pública
    const { data: { publicUrl } } = supabase.storage
      .from('checkin-photos')
      .getPublicUrl(fileName);

    // Salvar na tabela Photos
    await supabase.from("photos").insert({
      checkin_id: checkin.id,
      user_id: user.id,
      storage_path: fileName,
      pose_label: pose,
      // Se você tiver coluna url na tabela photos, descomente abaixo:
      // url: publicUrl 
    });
  }

  // 5. Processar as 3 fotos
  const photoFront = formData.get("photo_front") as File;
  const photoBack = formData.get("photo_back") as File;
  const photoSide = formData.get("photo_side") as File;

  await uploadPhoto(photoFront, "frente");
  await uploadPhoto(photoBack, "costas");
  await uploadPhoto(photoSide, "perfil");

  // 6. Sucesso!
  redirect("/dashboard?success=Checkin enviado");
}