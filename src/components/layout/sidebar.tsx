
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
import type { Role, TranslationKey } from '@/lib/types';
import { Badge } from '../ui/badge';
import { capitalize } from 'string-ts';
import { useTranslation } from '@/hooks/use-translation';

const allMenuItems: {
  href: string;
  labelKey: TranslationKey;
  icon: React.ElementType;
  roles: Role['name'][];
}[] = [
  {
    href: '/dashboard',
    labelKey: 'dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'accountant'],
  },
  {
    href: '/pos',
    labelKey: 'pos',
    icon: MonitorPlay,
    roles: ['admin', 'sales'],
  },
  {
    href: '/orders',
    labelKey: 'orders',
    icon: ShoppingCart,
    roles: ['admin', 'sales'],
  },
  {
    href: '/shipping',
    labelKey: 'shipping',
    icon: Package,
    roles: ['admin', 'sales', 'warehouse_manager'],
  },
  {
    href: '/products',
    labelKey: 'products',
    icon: Box,
    roles: ['admin', 'production', 'warehouse_manager'],
  },
  {
    href: '/customers',
    labelKey: 'customers',
    icon: Users,
    roles: ['admin', 'sales'],
  },
  {
    href: '/suppliers',
    labelKey: 'suppliers',
    icon: Truck,
    roles: ['admin', 'production'],
  },
  {
    href: '/fabrics',
    labelKey: 'fabrics',
    icon: Scissors,
    roles: ['admin', 'production'],
  },
  {
    href: '/production',
    labelKey: 'production',
    icon: Factory,
    roles: ['admin', 'production'],
  },
  {
    href: '/finance',
    labelKey: 'finance',
    icon: DollarSign,
    roles: ['admin', 'accountant'],
  },
  {
    href: '/reports',
    labelKey: 'reports',
    icon: BarChart,
    roles: ['admin', 'accountant'],
  },
  {
    href: '/settings',
    labelKey: 'settings',
    icon: Settings,
    roles: ['admin'],
  },
];

const hasAccess = (
  userRole: Role['name'] | undefined,
  itemRoles: Role['name'][]
) => {
  if (!userRole) return false;
  return itemRoles.includes(userRole);
};

export function AppSidebar({ side }: { side: 'left' | 'right' }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = allMenuItems.filter((item) =>
    hasAccess(user?.role, item.roles)
  );

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
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={t(item.labelKey)}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
