import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Mail, Lock, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { usePartner } from '@/contexts/PartnerContext';
import { useToast } from '@/hooks/use-toast';

const PartnerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = usePartner();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to your partner dashboard.",
      });
      navigate('/partner/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Customer App */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customer App
        </Link>

        {/* Logo */}
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Login</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Access your delivery partner dashboard
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="partner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have a partner account?
              </p>
              <Link 
                to="/partner/register" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Apply to become a partner
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Email: demo@partner.com<br />
              Password: demo123
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerLogin;