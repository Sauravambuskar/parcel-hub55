import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, ArrowLeft, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PageBackground from "@/components/PageBackground";

const Login = () => {
  const [step, setStep] = useState<'phone' | 'name'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const prayogAuth = localStorage.getItem('prayog_auth');
    if (prayogAuth) {
      navigate("/home");
    }
  }, [navigate]);

  const handlePhoneSubmit = async () => {
    if (phoneNumber.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const phoneWithCountryCode = `+91${phoneNumber}`;
      // Generate a deterministic user_id from phone number
      const oderId = btoa(phoneWithCountryCode).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);

      // Check if profile exists with this phone
      const profileResponse = await supabase.functions.invoke('get-profile', {
        body: { user_id: oderId }
      });

      const existingProfile = profileResponse.data?.profile;

      if (existingProfile?.full_name) {
        // Returning user — login directly
        const authData = {
          phone: phoneWithCountryCode,
          user_id: oderId,
          customer_id: oderId,
          userName: existingProfile.full_name,
          authenticated_at: new Date().toISOString()
        };
        localStorage.setItem('prayog_auth', JSON.stringify(authData));

        toast({
          title: "Welcome back!",
          description: `Good to see you again, ${existingProfile.full_name}`
        });
        navigate("/home");
      } else {
        // New user — prompt for name
        setUserId(oderId);
        setStep('name');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (userName.trim().length === 0) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const phoneWithCountryCode = `+91${phoneNumber}`;

      await supabase.functions.invoke('update-profile', {
        body: {
          user_id: userId,
          full_name: userName.trim(),
          phone: phoneWithCountryCode
        }
      });

      const authData = {
        phone: phoneWithCountryCode,
        user_id: userId,
        customer_id: userId,
        userName: userName.trim(),
        authenticated_at: new Date().toISOString()
      };
      localStorage.setItem('prayog_auth', JSON.stringify(authData));

      toast({
        title: "Welcome to ViaSetu!",
        description: `Nice to meet you, ${userName.trim()}`
      });
      navigate("/home");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save your name. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <PageBackground variant="parcels" opacity={0.7} />

      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Package className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            ViaSetu.
          </h1>
          <p className="text-white/70 mt-1">AI-Powered Multi-Courier Platform</p>
        </div>

        <Card className="border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              {step === 'name' && (
                <Button variant="ghost" size="icon" onClick={() => setStep('phone')} className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-white">
                  {step === 'phone' ? 'Enter Mobile Number' : 'Almost there!'}
                </CardTitle>
                <p className="text-sm text-white/70 mt-1">
                  {step === 'phone'
                    ? 'Sign in with your phone number'
                    : 'What should we call you?'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/90">Mobile Number</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 py-2 border border-r-0 rounded-l-md bg-white/20 text-white text-sm border-white/30">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="rounded-l-none bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>

                <Button onClick={handlePhoneSubmit} disabled={loading || phoneNumber.length !== 10} className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  {loading ? 'Signing in...' : 'Continue'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/90">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="text-lg bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    autoFocus
                  />
                  <p className="text-sm text-white/70">
                    This will be used to personalize your experience
                  </p>
                </div>

                <Button onClick={handleSaveName} disabled={loading || userName.trim().length === 0} className="w-full">
                  {loading ? 'Saving...' : 'Continue to ViaSetu'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
