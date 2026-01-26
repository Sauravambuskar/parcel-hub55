import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, ArrowLeft, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PRAYOG_CONFIG } from "@/config/environment";
import SecureLoginIllustration from "@/components/illustrations/SecureLoginIllustration";

const Login = () => {
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [prayogSession, setPrayogSession] = useState('');
  const [pendingAuthData, setPendingAuthData] = useState<any>(null);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check if user is already logged in with Prayog
    const prayogAuth = localStorage.getItem('prayog_auth');
    if (prayogAuth) {
      navigate("/home");
    }
  }, [navigate]);
  const handleSendOTP = async () => {
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
      const response = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/auth/signup-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': PRAYOG_CONFIG.API_KEY,
        },
        body: JSON.stringify({
          name: 'phone',
          username: `+91${phoneNumber}`,
          signupType: 'MOBILE',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setPrayogSession(data.session);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: data.message || `Verification code sent to +91 ${phoneNumber}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Verify with Prayog API directly
      const response = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/auth/verify-mfa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': PRAYOG_CONFIG.API_KEY,
        },
        body: JSON.stringify({
          username: `+91${phoneNumber}`,
          session: prayogSession,
          confirmationCode: otp,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      const phoneWithCountryCode = `+91${phoneNumber}`;
      
      // Store Prayog auth data with tokens
      const authData = {
        phone: phoneWithCountryCode,
        token: data.id_token, // Add token alias for compatibility
        id_token: data.id_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        platform_role: data.platform_role,
        user_id: data.user_id,
        customer_id: data.customer_id || data.user_id, // Use customer_id from response or fallback to user_id
        user_email: data.user_email,
        authenticated_at: new Date().toISOString()
      };
      localStorage.setItem('prayog_auth', JSON.stringify(authData));

      // Check if user profile exists and has a name using edge function
      const profileResponse = await supabase.functions.invoke('get-profile', {
        body: { user_id: data.user_id }
      });
      
      const existingProfile = profileResponse.data?.profile;

      if (existingProfile?.full_name) {
        // Update phone in profile
        await supabase.functions.invoke('update-profile', {
          body: { user_id: data.user_id, phone: phoneWithCountryCode }
        });
        
        toast({
          title: "Welcome back!",
          description: `Good to see you again, ${existingProfile.full_name}`
        });
        navigate("/home");
      } else {
        // Create/update profile with phone, then ask for name
        await supabase.functions.invoke('update-profile', {
          body: { user_id: data.user_id, phone: phoneWithCountryCode }
        });
        
        setPendingAuthData(authData);
        setStep('name');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
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
      // Update profile with name using edge function
      await supabase.functions.invoke('update-profile', {
        body: { 
          user_id: pendingAuthData.user_id, 
          full_name: userName.trim() 
        }
      });

      // Save auth data with name
      const authDataWithName = {
        ...pendingAuthData,
        userName: userName.trim()
      };
      localStorage.setItem('prayog_auth', JSON.stringify(authDataWithName));

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left: Illustration (hidden on mobile) */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <SecureLoginIllustration className="mb-8" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Safe & Secure</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your phone number is verified with OTP for secure access to your shipments
            </p>
          </div>
        </div>

        {/* Right: Login form */}
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Header - Only shown on mobile */}
          <div className="text-center md:hidden">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Package className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-secondary">
              ViaSetu.
            </h1>
          </div>

          <Card className="border-border/50 shadow-xl bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                {step === 'otp' && (
                  <Button variant="ghost" size="icon" onClick={() => setStep('phone')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                {step === 'name' && (
                  <Button variant="ghost" size="icon" onClick={() => setStep('otp')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <CardTitle>
                    {step === 'phone' ? 'Enter Mobile Number' : step === 'otp' ? 'Verify OTP' : 'Almost there!'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step === 'phone' 
                      ? 'We\'ll send you a verification code' 
                      : step === 'otp'
                      ? 'Enter the 6-digit code sent to your phone'
                      : 'What should we call you?'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 'phone' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 py-2 border border-r-0 rounded-l-md bg-muted text-sm">
                        +91
                      </div>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="Enter 10-digit mobile number" 
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                        className="rounded-l-none" 
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleSendOTP} disabled={loading || phoneNumber.length !== 10} className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </>
              ) : step === 'otp' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                  <Input 
                      id="otp" 
                      type="password" 
                      placeholder="Enter 6-digit OTP" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                      className="text-center text-lg tracking-widest" 
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      OTP sent to +91 {phoneNumber}
                    </p>
                  </div>
                  
                  <Button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6} className="w-full">
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                  
                  <Button variant="ghost" onClick={handleSendOTP} className="w-full text-sm">
                    Resend OTP
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Enter your name" 
                      value={userName} 
                      onChange={e => setUserName(e.target.value)} 
                      className="text-lg" 
                      autoFocus
                    />
                    <p className="text-sm text-muted-foreground">
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
          
          {/* Desktop branding */}
          <div className="hidden md:block text-center">
            <h1 className="text-2xl font-bold text-secondary">
              ViaSetu.
            </h1>
            <p className="text-sm text-muted-foreground">AI-Powered Multi-Courier Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;