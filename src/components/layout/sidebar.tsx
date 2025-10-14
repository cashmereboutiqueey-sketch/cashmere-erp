
'use client';

import Link from 'next/link';
import {
  Box,
  Factory,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  BarChart,
  DollarSign,
  MonitorPlay,
  Package,
  BadgePercent,
  Users2,
  Icon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useAuth } from '@/context/auth-context';
import type { TranslationKey } from '@/lib/types';
import { Badge } from '../ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import React from 'react';

type MenuItem = {
  href: string;
  labelKey: string;
  icon: string;
  roles: string[];
};

const icons: { [key: string]: Icon } = {
  LayoutDashboard,
  MonitorPlay,
  ShoppingCart,
  Users2,
  Package,
  Box,
  Users,
  Truck,
  Scissors,
  Factory,
  DollarSign,
  BadgePercent,
  BarChart,
  Settings,
};

export function AppSidebar({ menuItems, side }: { menuItems: MenuItem[], side: 'left' | 'right' }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Sidebar
      side={side}
      variant="sidebar"
      collapsible="icon"
      className="group-data-[variant=sidebar]:border-r-0"
    >
      <SidebarHeader className="h-auto items-center p-4 lg:p-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-auto w-32" />
        </Link>
        {user && (
          <div className="mt-2 w-full text-center group-data-[collapsible=icon]:hidden">
            <Badge variant="secondary" className="border border-sidebar-border capitalize">
              {user.role.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item: any) => {
            const Icon = icons[item.icon];
            return (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={t(item.labelKey as TranslationKey)}
                >
                    <Link href={item.href}>
                        {Icon && <Icon />}
                        <span>{t(item.labelKey as TranslationKey)}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="hidden flex-col gap-2 p-2 group-data-[collapsible=icon]:flex">
          <SidebarMenuButton asChild tooltip="Logout" onClick={handleLogout}>
            <Link href="/login">
              <LogOut />
            </Link>
          </SidebarMenuButton>
        </div>
        <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
          <Card>
            <CardHeader className="p-2 pt-0 md:p-4">
              <CardTitle className="font-headline">{t('needHelp')}</CardTitle>
              <CardDescription>
                Contact support for any issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <Link href="#" className="w-full">
                <span className="font-bold underline">{t('contactSupport')}</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
