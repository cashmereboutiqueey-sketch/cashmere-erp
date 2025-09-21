'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Role, User } from '@/lib/types';
import { mockUser, mockCustomers } from '@/lib/data';
import { useState } from 'react';

const roles: Role['name'][] = ['admin', 'sales', 'accountant', 'production', 'warehouse_manager'];

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<Role['name']>('admin');

    const handleLogin = () => {
        const user: User = {
            ...mockUser,
            role: selectedRole
        }
        login(user);
        router.push('/dashboard');
    }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-auto w-48" />
          </div>
          <CardTitle className="font-headline text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Select a role to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                defaultValue={mockUser.email}
                disabled
              />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role['name'])}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role} value={role} className="capitalize">
                                {role.replace('_', ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" className="w-full font-bold" onClick={handleLogin}>
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
