
'use client';

import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import type { Role } from '@/lib/types';
import allMenuItems from '@/lib/permissions.json';
import { useRouter } from 'next/navigation';

const hasAccess = (
  userRole: Role['name'] | undefined,
  itemRoles: Role['name'][]
) => {
  if (!userRole) return false;
  // Admin always has access
  if (userRole === 'admin') return true;
  return itemRoles.includes(userRole);
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const menuItems = useMemo(() => {
    if (!user) return [];
    return allMenuItems.filter((item: any) =>
      hasAccess(user.role, item.roles as Role['name'][])
    );
  }, [user]);

  if (loading || !user) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            {/* You can replace this with a beautiful spinner component */}
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar menuItems={menuItems} side={language === 'ar' ? 'right' : 'left'} />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex flex-1 flex-col bg-background">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
