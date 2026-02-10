"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

// Função 1: Login
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

// Função 2: Signup (A que estava faltando)
export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

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

  if (data.user) {
    const tenantId = crypto.randomUUID();
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      role: 'coach',
      tenant_id: tenantId 
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}