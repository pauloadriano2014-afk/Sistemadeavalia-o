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

  if (!user) return redirect("/entrar");

  // Busca dados do Coach
  let { data: coachProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // B. Configurar Cliente ADMIN (Necessário para criar Tenant e Usuários)
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

  // --- AUTO-CORREÇÃO: SE NÃO TIVER TIME, CRIA UM AGORA ---
  if (!coachProfile?.tenant_id) {
    console.log("Coach sem time. Criando estrutura do Tenant...");
    const newTenantId = crypto.randomUUID(); // Gera ID único

    // 1. PRIMEIRO: Cria o Time na tabela 'tenants' (Isso resolve o erro 23503)
    // Estamos assumindo que sua tabela tenants tem colunas 'id' e 'name'
    const { error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({ 
        id: newTenantId, 
        name: `Time ${coachProfile.full_name || 'Coach'}`
      });

    if (tenantError) {
        console.error("Erro ao criar tabela tenants:", tenantError);
        // Se der erro aqui, provavelmente a tabela tenants pede mais campos. 
        // Mas o básico geralmente é id e name.
        return { error: "Erro crítico ao criar seu time no sistema." };
    }

    // 2. SEGUNDO: Vincula o Coach a esse novo time
    await supabaseAdmin
      .from("profiles")
      .update({ tenant_id: newTenantId })
      .eq("id", user.id);
    
    // Atualiza a variável local
    if (coachProfile) {
        coachProfile.tenant_id = newTenantId;
    } else {
        coachProfile = { tenant_id: newTenantId };
    }
  }

  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const goal = formData.get("goal") as string;
  const gender = formData.get("gender") as string;
  
  // --- SENHA GERADA (Oculta) ---
  const password = crypto.randomUUID(); 

  // C. Criar Usuário no Auth (Admin)
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password, 
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) {
    console.error("Erro ao criar Auth:", createError);
    return { error: `Erro ao criar conta: ${createError.message}` };
  }

  if (!newUser.user) return { error: "Erro desconhecido ao criar usuário." };

  // D. Atualizar o Perfil do Aluno
  const profileData = {
      role: "student", // Garante que o banco aceite (enum user_role)
      tenant_id: coachProfile.tenant_id,
      selected_goal: goal,
      full_name: fullName,
      gender: gender
  };

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(profileData)
    .eq("id", newUser.user.id);

  if (updateError) {
    console.error("Update falhou, tentando Insert manual...", updateError);
    // Fallback: Tenta inserir se o update falhar (caso o trigger não tenha rodado)
    const { error: insertError } = await supabaseAdmin.from("profiles").insert({
        id: newUser.user.id,
        email: email,
        ...profileData
    });
    
    if (insertError) {
        console.error("Erro final ao inserir perfil:", insertError);
        return { error: "Erro ao salvar dados do aluno no banco." };
    }
  }

  revalidatePath("/dashboard/alunos");
  return { success: true };
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