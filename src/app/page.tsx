import { redirect } from "next/navigation";

export default function HomePage() {
  // Redireciona o usuário para a página de login correta (/entrar)
  redirect("/entrar");
}