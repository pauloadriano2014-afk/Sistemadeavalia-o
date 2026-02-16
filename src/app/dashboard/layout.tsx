import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar"; 

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('logo_url').eq('id', user.id).single();

  return (
    <div className="min-h-screen bg-black selection:bg-brand selection:text-black flex">
       
       {/* AQUI ESTÁ A CORREÇÃO: Passamos a logoUrl para o componente */}
       <DashboardSidebar logoUrl={profile?.logo_url} />

       <main className="flex-1 md:ml-64 relative min-h-screen">
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden md:pl-64">
                {profile?.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                        src={profile.logo_url} 
                        alt="" 
                        className="w-[80vw] md:w-[40vw] opacity-[0.03] grayscale contrast-200"
                    />
                ) : (
                    <div className="w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full"></div>
                )}
            </div>

            <div className="relative z-10 p-8">
                {children}
            </div>
       </main>
    </div>
  );
}