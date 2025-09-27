
'use client';

import { useState } from 'react';
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
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (user) {
        // Redirect based on role after successful login
        let redirectPath = '/dashboard';
         switch (user.role) {
            case 'admin':
            case 'accountant':
                redirectPath = '/dashboard';
                break;
            case 'sales':
                redirectPath = '/pos';
                break;
            case 'production':
                redirectPath = '/production';
                break;
            case 'warehouse_manager':
                redirectPath = '/products';
                break;
        }
        router.push(redirectPath);
      } else {
         throw new Error("Login failed: User not found");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = (error as Error).message
        .replace('Firebase: ', '')
        .replace(/(\(auth\/.*\))/, '');

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-auto w-48" />
          </div>
          <CardTitle className="font-headline text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to login to your account.
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
