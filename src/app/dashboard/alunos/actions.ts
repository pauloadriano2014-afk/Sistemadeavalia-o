"use server";

// 1. IMPORT CORRETO DA BIBLIOTECA OFICIAL (Para o Admin)
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 2. IMPORT DO SEU PROJETO (Para verificar o Coach logado)
import { createClient } from "@/lib/supabase-server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- CRIAR ALUNO ---
export async function createStudent(formData: FormData) {
  // A. Usar o cliente do servidor para verificar quem está fazendo a requisição
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!coachProfile?.tenant_id) {
    throw new Error("Coach sem time definido.");
  }

  // B. Configurar Cliente ADMIN (A Chave Mestra)
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const goal = formData.get("goal") as string;
  const gender = formData.get("gender") as string; // <--- NOVO: Pegando o gênero

  // C. Criar Usuário no Auth (Admin)
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password, 
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) {
    console.error("Erro ao criar Auth:", createError);
    return { error: createError.message };
  }

  if (!newUser.user) return { error: "Erro desconhecido ao criar usuário." };

  // D. Atualizar o Perfil
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      role: "student",
      tenant_id: coachProfile.tenant_id,
      selected_goal: goal,
      full_name: fullName,
      gender: gender // <--- NOVO: Salvando no banco
    })
    .eq("id", newUser.user.id);

  if (updateError) {
    console.error("Erro ao atualizar perfil:", updateError);
  }

  revalidatePath("/dashboard/alunos");
  redirect("/dashboard/alunos");
}

// --- SALVAR FEEDBACK ---
export async function saveFeedback(formData: FormData) {
  const supabase = await createClient();
  
  const checkinId = formData.get("checkinId") as string;
  const feedback = formData.get("feedback") as string;
  const studentId = formData.get("studentId") as string;

  if (!checkinId || !feedback) return;

  const { error } = await supabase
    .from("checkins")
    .update({
      feedback: feedback,
      status: "reviewed"
    })
    .eq("id", checkinId);

  if (error) {
    console.error("Erro ao salvar feedback:", error);
    return { error: "Erro ao salvar" };
  }

  revalidatePath(`/dashboard/alunos/${studentId}`);
}