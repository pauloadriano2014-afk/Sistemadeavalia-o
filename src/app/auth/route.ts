import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. Cria o cliente do Supabase no servidor
  const supabase = await createClient();

  // 2. Destrói a sessão do usuário (Logout real)
  await supabase.auth.signOut();

  // 3. Pega a URL base do site para montar o redirect
  const requestUrl = new URL(request.url);
  
  // 4. Redireciona para a tela de Login (/entrar) com status 302 (Redirecionamento temporário)
  return NextResponse.redirect(`${requestUrl.origin}/entrar`, {
    status: 302,
  });
}