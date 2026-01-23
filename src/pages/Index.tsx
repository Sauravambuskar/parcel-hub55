import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, LogOut, TrendingDown, MapPin, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { CURRENT_ENV } from "@/config/environment";
const Index = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
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
      fetchProfile(authData.user_id);
    }
  };
  const fetchProfile = async (userId: string) => {
    const {
      data
    } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      setProfile(data);
    }
  };
  const handleLogout = async () => {
    localStorage.removeItem('prayog_auth');
    setUser(null);
    setProfile(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/login');
  };
  // Always show the dashboard now (no login required)
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo size="md" />
                <Badge 
                  variant={CURRENT_ENV === "production" ? "default" : "secondary"}
                  className={CURRENT_ENV === "production" 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                  }
                >
                  {CURRENT_ENV === "production" ? "LIVE" : "SANDBOX"}
                </Badge>
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
    </div>;
}
export default Index;