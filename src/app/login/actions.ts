"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email ou senha incorretos." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  // 1. Criar Usuário na Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // 2. Criar Perfil no Banco (Caso não tenha Trigger automático no Supabase)
  if (data.user) {
    // Gera um ID de tenant para o novo Coach
    const tenantId = crypto.randomUUID();

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      role: 'coach', // Quem se cadastra na tela pública vira Coach
      tenant_id: tenantId 
    });

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError);
      // Não retornamos erro aqui para não travar o fluxo, pois o usuário já foi criado na Auth
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}