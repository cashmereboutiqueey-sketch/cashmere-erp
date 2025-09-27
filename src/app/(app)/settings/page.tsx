
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
import { mockUsers as initialUsers } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { Role, User } from '@/lib/types';
import { capitalize } from 'string-ts';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { firebaseConfig } from '@/services/firebase';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

const roles: Role['name'][] = ['admin', 'sales', 'accountant', 'production', 'warehouse_manager'];

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role['name']>('sales');

  const isAdmin = currentUser?.role === 'admin';

  const handleRoleChange = (userId: string, newRole: Role['name']) => {
    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only admins can change user roles.',
      });
      return;
    }
    setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    toast({
      title: 'Success',
      description: 'User role has been updated locally. Note: This is a demo and changes are not saved to a database.',
    });
  };

  const handleAddUser = () => {
    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only admins can add new users.',
      });
      return;
    }
    if (!newUserName || !newUserEmail) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a name and email for the new user.',
      });
      return;
    }

    const newUser: User = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      avatarUrl: `https://picsum.photos/seed/${newUserName}/100/100`,
    };

    setUsers([...users, newUser]);
    setNewUserName('');
    setNewUserEmail('');
    toast({
      title: 'User Added',
      description: 'The user has been added to the local list. Remember to create their account in the Firebase Console.',
    });
  }

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
                                Add users, assign roles, then create their login in the Firebase Console.
                            </CardDescription>
                        </div>
                         <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Manage Users in Firebase
                            </Button>
                        </a>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {users.map(user => (
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
                                  {isAdmin ? (
                                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as Role['name'])}>
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select a role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {roles.map(role => (
                                          <SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
                                  )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    {isAdmin && (
                      <>
                        <Separator />
                        <CardFooter className="flex-col items-start gap-4 pt-6">
                            <h3 className="font-medium">Add New User</h3>
                            <div className="flex w-full gap-4">
                               <Input placeholder="Full Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                                <Input type="email" placeholder="Email Address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                               <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as Role['name'])}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles.map(role => (
                                      <SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button onClick={handleAddUser}><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                After adding a user here, you must create an account for them with the same email in the Firebase Console.
                            </p>
                        </CardFooter>
                      </>
                    )}
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

    