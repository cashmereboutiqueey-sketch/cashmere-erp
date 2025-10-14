
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
            default:
                redirectPath = '/dashboard' // Fallback
                break;
        }
        router.push(redirectPath);
      } else {
         throw new Error("Login failed: User is not configured in the ERP system.");
      }
    } catch (error) {
      console.error("Login page error:", error);
      let errorMessage = 'Invalid credentials or user not found.';
      if (error instanceof Error) {
        errorMessage = error.message
          .replace('Firebase: ', '')
          .replace(/(\(auth\/.*\))/, '')
          .trim();
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
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
          <form onSubmit={handleLogin} className="grid gap-4">
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
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
