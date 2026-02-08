"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  // 1. Criar Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Erro ao criar usuário." };

  // 2. Garantir Perfil de COACH
  // Tenta atualizar se já existir (trigger), senão insere
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'coach', full_name: fullName, tenant_id: authData.user.id })
    .eq('id', authData.user.id);

  if (profileError) {
      await supabase.from('profiles').insert({
          id: authData.user.id,
          email: email,
          role: 'coach',
          full_name: fullName,
          tenant_id: authData.user.id
      });
  }

  redirect("/dashboard");
}