import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Package, LogOut, Navigation, Clock, HelpCircle, ArrowRight, Sparkles, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import BottomNav from "@/components/BottomNav";
import { CURRENT_ENV, setEnvironment, isLovablePreview } from "@/config/environment";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
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
    const { data } = await supabase.functions.invoke('get-profile', {
      body: { user_id: userId }
    });
    if (data?.profile) {
      setProfile(data.profile);
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

  const quickActions = [
    {
      icon: Package,
      titleKey: "quickActions.bookDelivery",
      descKey: "quickActions.bookDeliveryDesc",
      path: "/booking",
      gradient: "from-primary/20 to-primary-glow/20",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      featured: true,
    },
    {
      icon: Clock,
      titleKey: "quickActions.orderHistory",
      descKey: "quickActions.orderHistoryDesc",
      path: "/history",
      gradient: "from-secondary/10 to-accent/10",
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary-foreground",
    },
    {
      icon: Navigation,
      titleKey: "quickActions.trackPackage",
      descKey: "quickActions.trackPackageDesc",
      path: "/tracking",
      gradient: "from-success/10 to-success/5",
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      icon: HelpCircle,
      titleKey: "quickActions.support",
      descKey: "quickActions.supportDesc",
      path: "/support",
      gradient: "from-accent/20 to-muted/20",
      iconBg: "bg-accent/50",
      iconColor: "text-accent-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary-glow/5 pb-24 md:pb-4">

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Header Card - Glassmorphism */}
        <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo size="md" />
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {isLovablePreview() && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      CURRENT_ENV === "sandbox" ? "text-warning" : "text-muted-foreground"
                    )}>
                      Sandbox
                    </span>
                    <Switch
                      checked={CURRENT_ENV === "production"}
                      onCheckedChange={(checked) => setEnvironment(checked ? "production" : "sandbox")}
                    />
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      CURRENT_ENV === "production" ? "text-success" : "text-muted-foreground"
                    )}>
                      Live
                    </span>
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="h-9 w-9">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('home.logout')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            {profile?.full_name ? t('home.welcomeWithName', { name: profile.full_name }) : t('home.welcome')}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('home.whatToDo')}
          </h1>
        </div>

        {/* Quick Actions Grid - Enhanced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.path}
                className={cn(
                  "group relative overflow-hidden cursor-pointer transition-all duration-300",
                  "border border-border/50 hover:border-primary/30",
                  "bg-gradient-to-br",
                  action.gradient,
                  "hover:shadow-xl hover:shadow-primary/5",
                  "hover:-translate-y-1",
                  action.featured && "md:col-span-2 border-primary/20"
                )}
                onClick={() => navigate(action.path)}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                
                <CardContent className="relative p-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                      action.iconBg
                    )}>
                      <Icon className={cn("h-6 w-6", action.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-foreground transition-colors">
                        {t(action.titleKey)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(action.descKey)}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;