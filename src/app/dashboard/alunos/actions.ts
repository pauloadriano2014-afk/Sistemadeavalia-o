"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createStudent(formData: FormData) {
  console.log("🔥 AÇÃO INICIADA! Processando formulário...");

  // 1. Validar Coach Logado
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // 2. Buscar Time do Coach
  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!coachProfile?.tenant_id) {
    throw new Error("ERRO: Coach sem time definido.");
  }

  // 3. Configurar Admin (Usando a chave que você colocou no .env.local)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // 4. Pegar dados
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const goal = formData.get("goal") as string;

  console.log(`Tentando criar aluno: ${fullName} (${email})`);

  // 5. Criar Usuário
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) {
    console.error("❌ ERRO AO CRIAR USUÁRIO:", createError.message);
    return { error: createError.message };
  }

  // 6. Atualizar Perfil do Aluno (Vincular ao time do Coach)
  if (newUser.user) {
    await supabaseAdmin
      .from("profiles")
      .update({
        role: "student",
        tenant_id: coachProfile.tenant_id,
        selected_goal: goal,
        full_name: fullName
      })
      .eq("id", newUser.user.id);
      
    console.log("✅ Aluno criado e vinculado com sucesso!");
  }

  revalidatePath("/dashboard/alunos");
  redirect("/dashboard/alunos");
}