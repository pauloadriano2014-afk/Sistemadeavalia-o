import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return redirect("/login");

  // Buscamos a logo do perfil para usar no fundo
  const { data: profile } = await supabase.from('profiles').select('logo_url').eq('id', user.id).single();

  return (
    <section className="bg-black min-h-screen relative overflow-x-hidden selection:bg-lime-500 selection:text-black">
       
       {/* --- MARCA D'ÁGUA (BACKGROUND LOGO) --- */}
       {/* Fica fixa no centro, com pouca opacidade, não interfere no clique */}
       <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {profile?.logo_url ? (
             /* eslint-disable-next-line @next/next/no-img-element */
             <img 
                src={profile.logo_url} 
                alt="" 
                className="w-[80vw] md:w-[40vw] opacity-[0.03] grayscale contrast-200"
             />
          ) : (
             // Se não tiver logo, mostra um círculo sutil
             <div className="w-[600px] h-[600px] bg-lime-500/5 blur-[150px] rounded-full"></div>
          )}
       </div>

       {/* Conteúdo da Página (Fica por cima do background) */}
       <div className="relative z-10">
          {children}
       </div>
    </section>
  );
}