import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AuthProvider } from '@/context/auth-context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex flex-1 flex-col bg-background">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
