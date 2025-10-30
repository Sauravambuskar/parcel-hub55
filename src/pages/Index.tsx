import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Welcome */}
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-3xl font-bold mb-2">Welcome to viaSetu</h1>
          <p className="text-muted-foreground mb-8">
            Choose your login type to continue
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          {/* Consumer Login */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>I'm a Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Book deliveries and track your packages
              </p>
              <Button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-primary to-primary-glow">
                Customer Login
              </Button>
            </CardContent>
          </Card>

          {/* Admin Login */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-destructive/20">
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>I'm an Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Manage platform and monitor operations
              </p>
              <Button onClick={() => navigate('/admin/login')} className="w-full bg-gradient-to-r from-destructive to-destructive/80 text-white" variant="outline">
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card className="border-dashed">
          
        </Card>
      </div>
    </div>;
};
export default Index;