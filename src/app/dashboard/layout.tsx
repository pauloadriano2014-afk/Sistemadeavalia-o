export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
       {/* Removemos a Navbar antiga daqui.
          Agora a navegação é controlada pelo arquivo principal src/app/layout.tsx 
       */}
       {children}
    </section>
  );
}