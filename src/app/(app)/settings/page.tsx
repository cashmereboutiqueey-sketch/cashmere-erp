
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
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Role, User, TranslationKey } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { firebaseConfig } from '@/services/firebase';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getUsers, addUser, updateUserRole, deleteUser } from '@/services/user-service';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/use-translation';
import allMenuItems from '@/lib/permissions.json';
import { updatePermissions } from '@/services/permissions-service';


const roles: Role['name'][] = ['admin', 'sales', 'accountant', 'production', 'warehouse_manager'];
type Permissions = {
    href: string;
    labelKey: string;
    icon: string;
    roles: Role['name'][];
}[];


function PermissionsManager() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [permissions, setPermissions] = useState<Permissions>(allMenuItems);
    const [isSaving, setIsSaving] = useState(false);

    const handlePermissionChange = (href: string, role: Role['name'], checked: boolean) => {
        setPermissions(prev => {
            return prev.map(item => {
                if (item.href === href) {
                    const currentRoles = item.roles || [];
                    if (checked) {
                        return { ...item, roles: [...currentRoles, role] };
                    } else {
                        return { ...item, roles: currentRoles.filter(r => r !== role) };
                    }
                }
                return item;
            });
        });
    };
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await updatePermissions(permissions);
            toast({
                title: "Permissions Saved",
                description: "User role permissions have been updated successfully.",
            });
        } catch(e) {
             toast({
                variant: 'destructive',
                title: "Error Saving Permissions",
                description: "Could not write to the permissions file.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>
                    Define which roles can access which pages in the application. Changes will apply on next page load.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Page</TableHead>
                                {roles.map(role => (
                                    <TableHead key={role} className="text-center capitalize">
                                        {role.replace('_', ' ')}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {permissions.filter(item => item.href !== '/settings').map(item => (
                                <TableRow key={item.href}>
                                    <TableCell className="font-medium">{t(item.labelKey as TranslationKey)}</TableCell>
                                    {roles.map(role => (
                                        <TableCell key={role} className="text-center">
                                            <Checkbox
                                                checked={(item.roles || []).includes(role)}
                                                onCheckedChange={(checked) => handlePermissionChange(item.href, role, !!checked)}
                                                disabled={role === 'admin'}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <p className="text-xs text-muted-foreground mt-4">
                    Note: The "Admin" role always has access to all pages, including Settings.
                </p>
            </CardContent>
             <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Permission Changes"}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role['name']>('sales');

  const fetchUsers = async () => {
    setIsLoading(true);
    const fetchedUsers = await getUsers();
    setUsers(fetchedUsers.filter(u => u.id !== currentUser?.id));
    setIsLoading(false);
  }
  
  useEffect(() => {
      if (currentUser) {
        fetchUsers();
      }
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'admin';

  const handleRoleChange = async (userId: string, newRole: Role['name']) => {
    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only admins can change user roles.',
      });
      return;
    }

    try {
        await updateUserRole(userId, newRole);
        setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
        toast({
            title: 'Success',
            description: "User role has been updated.",
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update user role.',
        });
    }
  };

  const handleAddUser = async () => {
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

    const newUser: Omit<User, 'id'> = {
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      avatarUrl: `https://picsum.photos/seed/${newUserName}/100/100`,
    };

    try {
        await addUser(newUser);
        await fetchUsers(); // Refetch all users
        setNewUserName('');
        setNewUserEmail('');
        toast({
          title: 'User Added',
          description: 'The user has been added. Remember to create their login in the Firebase Authentication console.',
        });
    } catch(error) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to add user.',
        });
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only admins can delete users.',
      });
      return;
    }

    try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        toast({
            title: 'Success',
            description: "User has been deleted.",
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete user.',
        });
    }
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Settings</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="permissions">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
          <TabsContent value="users">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>
                                Add users and assign roles. You must create their login separately in the Firebase Console.
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
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : (
                            users.map(user => (
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
                                    <div className="flex items-center gap-2">
                                    {isAdmin ? (
                                        <>
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
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the user account
                                                            for {user.name}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    ) : (
                                        <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
                                    )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                    {isAdmin && (
                      <>
                        <Separator />
                        <CardFooter className="flex-col items-start gap-4 pt-6">
                            <h3 className="font-medium">Add New User</h3>
                            <div className="grid md:grid-cols-4 w-full gap-4">
                               <Input placeholder="Full Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="md:col-span-1" />
                                <Input type="email" placeholder="Email Address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="md:col-span-1"/>
                               <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as Role['name'])}>
                                  <SelectTrigger className="w-full md:col-span-1">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles.map(role => (
                                      <SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button onClick={handleAddUser} className="md:col-span-1"><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                After adding a user here, you must create an account for them with the same email in the Firebase Console.
                            </p>
                        </CardFooter>
                      </>
                    )}
                </Card>
           </TabsContent>
           <TabsContent value="permissions">
                <PermissionsManager />
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
