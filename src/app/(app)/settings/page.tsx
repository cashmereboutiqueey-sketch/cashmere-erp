
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { Role } from '@/lib/types';
import { capitalize } from 'string-ts';
import { Separator } from '@/components/ui/separator';

const roles: Role['name'][] = ['admin', 'sales', 'accountant', 'production', 'warehouse_manager'];

export default function SettingsPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Settings</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Update your company's profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" placeholder="Cashmere" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Textarea
                    id="company-address"
                    placeholder="123 Fashion Ave, Style City, 12345"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="company-email">Contact Email</Label>
                  <Input id="company-email" type="email" placeholder="contact@cashmere.com" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shopify Integration</CardTitle>
                <CardDescription>
                  Connect your Shopify store to sync products and orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopify-url">Shopify Store URL</Label>
                  <Input
                    id="shopify-url"
                    placeholder="your-store.myshopify.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopify-api-key">API Key</Label>
                  <Input id="shopify-api-key" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopify-api-secret">API Secret Key</Label>
                  <Input id="shopify-api-secret" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Connect to Shopify</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Shipping Integrations</CardTitle>
                <CardDescription>
                  Connect your shipping carriers to generate labels and track shipments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier-a-key">Carrier A API Key</Label>
                  <Input id="carrier-a-key" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier-b-key">Carrier B API Key</Label>
                  <Input id="carrier-b-key" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Shipping Keys</Button>
              </CardFooter>
            </Card>

          </TabsContent>
           <TabsContent value="users">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>
                                Manage user access and roles within the system.
                            </CardDescription>
                        </div>
                        <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Select defaultValue={user.role}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(role => (
                                                    <SelectItem key={role} value={role} className="capitalize">
                                                        {capitalize(role.replace('_', ' '))}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Activity</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
           </TabsContent>
            <TabsContent value="notifications">
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                    Notification Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                    This feature is under construction.
                    </p>
                </div>
            </div>
           </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
