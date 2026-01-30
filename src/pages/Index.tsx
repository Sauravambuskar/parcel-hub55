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
import PageBackground from "@/components/PageBackground";
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
      iconColor: "text-primary",
      featured: true,
    },
    {
      icon: Clock,
      titleKey: "quickActions.orderHistory",
      descKey: "quickActions.orderHistoryDesc",
      path: "/history",
      iconColor: "text-amber-400",
    },
    {
      icon: Navigation,
      titleKey: "quickActions.trackPackage",
      descKey: "quickActions.trackPackageDesc",
      path: "/tracking",
      iconColor: "text-green-400",
    },
    {
      icon: HelpCircle,
      titleKey: "quickActions.support",
      descKey: "quickActions.supportDesc",
      path: "/support",
      iconColor: "text-blue-400",
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-4 relative">
      <PageBackground variant="logistics" opacity={0.75} />

      <div className="p-4 max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header Card */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo size="md" />
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {isLovablePreview() && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      CURRENT_ENV === "sandbox" ? "text-warning" : "text-white/60"
                    )}>
                      Sandbox
                    </span>
                    <Switch
                      checked={CURRENT_ENV === "production"}
                      onCheckedChange={(checked) => setEnvironment(checked ? "production" : "sandbox")}
                    />
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      CURRENT_ENV === "production" ? "text-green-400" : "text-white/60"
                    )}>
                      Live
                    </span>
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="h-9 w-9 text-white hover:bg-white/10">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={handleLogout} className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('home.logout')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-4 shadow-lg">
            <Sparkles className="h-4 w-4" />
            {profile?.full_name ? t('home.welcomeWithName', { name: profile.full_name }) : t('home.welcome')}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
            {t('home.whatToDo')}
          </h1>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.path}
                className={cn(
                  "group relative overflow-hidden cursor-pointer transition-all duration-300",
                  "border border-white/20 hover:border-white/40",
                  "bg-white/10 backdrop-blur-xl",
                  "hover:shadow-2xl hover:shadow-primary/10",
                  "hover:-translate-y-1",
                  action.featured && "md:col-span-2 border-primary/30"
                )}
                onClick={() => navigate(action.path)}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                
                <CardContent className="relative p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-white/10">
                      <Icon className={cn("h-6 w-6", action.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white group-hover:text-white transition-colors">
                        {t(action.titleKey)}
                      </h3>
                      <p className="text-sm text-white/70">
                        {t(action.descKey)}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
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