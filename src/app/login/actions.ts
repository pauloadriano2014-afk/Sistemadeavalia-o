"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("ERRO NO LOGIN:", error.message); // <--- Vai aparecer no seu terminal
    return redirect("/login?error=Credenciais inválidas");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Log para garantir que os dados estão chegando (não mostraremos senha)
  console.log("Tentando criar conta para:", email);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: email.split('@')[0], // Usa parte do email como nome provisório
      }
    }
  });

  if (error) {
    console.error("ERRO NO SIGNUP:", error.message, error); // <--- O GRANDE CULPADO VAI APARECER AQUI
    return redirect("/login?error=Erro ao criar conta");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}