"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- CRIAR ALUNO (JÁ EXISTIA) ---
export async function createStudent(formData: FormData) {
  const supabase = await createServerClient();
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

  // Cliente Admin para criar usuário
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use a chave service_role no .env
    { auth: { autoRefreshToken: false, persistSession: false } } as any
  );

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const goal = formData.get("goal") as string;

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password, 
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) return { error: createError.message };
  if (!newUser.user) return { error: "Erro desconhecido." };

  await supabaseAdmin.from("profiles").update({
      role: "student",
      tenant_id: coachProfile.tenant_id,
      selected_goal: goal,
      full_name: fullName
    }).eq("id", newUser.user.id);

  revalidatePath("/dashboard/alunos");
  redirect("/dashboard/alunos");
}

// --- NOVA FUNÇÃO: SALVAR FEEDBACK ---
export async function saveFeedback(formData: FormData) {
  const supabase = await createServerClient();
  
  const checkinId = formData.get("checkinId") as string;
  const feedback = formData.get("feedback") as string;
  const studentId = formData.get("studentId") as string; // Para revalidar a página certa

  if (!checkinId || !feedback) return;

  const { error } = await supabase
    .from("checkins")
    .update({
      feedback: feedback,
      status: "reviewed" // Marca como avaliado
    })
    .eq("id", checkinId);

  if (error) {
    console.error("Erro ao salvar feedback:", error);
    return { error: "Erro ao salvar" };
  }

  // Atualiza a página do aluno para mostrar o feedback na hora
  revalidatePath(`/dashboard/alunos/${studentId}`);
}