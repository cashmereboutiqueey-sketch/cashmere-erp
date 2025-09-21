import Link from 'next/link';
import {
  Bell,
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
  MonitorPlay
} from 'lucide-react';

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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { mockUser } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pos', label: 'Point of Sale', icon: MonitorPlay },
    { href: '/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/products', label: 'Products', icon: Box },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/suppliers', label: 'Suppliers', icon: Truck },
    { href: '/fabrics', label: 'Fabrics', icon: Scissors },
    { href: '/production', label: 'Production', icon: Factory },
    { href: '/finance', label: 'Finance', icon: DollarSign },
    { href: '/reports', label: 'Reports', icon: BarChart },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  // In a real app, you'd get the current path from `usePathname`
  const pathname = '/dashboard';

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="group-data-[variant=sidebar]:border-r-0"
    >
      <SidebarHeader className="h-14 items-center px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-auto w-32" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="hidden flex-col gap-2 p-2 group-data-[collapsible=icon]:flex">
            <SidebarMenuButton asChild tooltip="Logout">
                <Link href="/login"><LogOut /></Link>
            </SidebarMenuButton>
        </div>
        <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
        <Card>
          <CardHeader className="p-2 pt-0 md:p-4">
            <CardTitle className="font-headline">Need Help?</CardTitle>
            <CardDescription>
              Contact support for any issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
            <Link href="#" className="w-full">
              <span className="font-bold underline">Contact Support</span>
            </Link>
          </CardContent>
        </Card>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
