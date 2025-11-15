import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    // Check for Prayog auth
    const prayogAuth = localStorage.getItem('prayog_auth');
    if (prayogAuth) {
      const authData = JSON.parse(prayogAuth);
      setUser({ 
        phone: authData.phone,
        user_id: authData.user_id 
      });
    }
  };

  const fetchProfile = async (userId: string) => {
    // Profile fetching can be implemented later if needed
    // For now, we're using Prayog auth only
  };

  const handleLogout = async () => {
    // Clear Prayog auth
    localStorage.removeItem('prayog_auth');
    
    setUser(null);
    setProfile(null);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    navigate('/login');
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with User Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {profile?.full_name || 'Welcome'}
                    </h2>
                    <p className="text-muted-foreground">{user.phone || profile?.phone}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/booking')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Book New Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Send packages quickly and securely
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/history')}>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View your past deliveries
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/tracking')}>
              <CardHeader>
                <CardTitle>Track Package</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor your delivery in real-time
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/support')}>
              <CardHeader>
                <CardTitle>Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get help with your deliveries
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-3xl font-bold mb-2">Welcome to ViaSetu.</h1>
          <p className="text-muted-foreground mb-8">
            PAN-India coverage: 21,000+ pincodes connected through one app
          </p>
        </div>

        <div className="space-y-4">
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
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => navigate('/admin/login')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Admin Access
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
