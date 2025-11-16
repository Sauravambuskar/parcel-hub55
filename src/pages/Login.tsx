import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, ArrowLeft, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const Login = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [prayogSession, setPrayogSession] = useState('');
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check if user is already logged in with Supabase
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
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
      const {
        data,
        error
      } = await supabase.functions.invoke('prayog-send-otp', {
        body: {
          phone: `+91${phoneNumber}`,
          name: 'User'
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
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
      // Verify with Prayog API
      const {
        data,
        error
      } = await supabase.functions.invoke('prayog-verify-otp', {
        body: {
          phone: `+91${phoneNumber}`,
          session: prayogSession,
          otp: otp
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Create/sign in user to Supabase with phone
      const phoneWithCountryCode = `+91${phoneNumber}`;
      const generatedPassword = `prayog_${phoneNumber}_${data.user_id}`;
      
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: phoneWithCountryCode,
        password: generatedPassword,
      });

      // If sign in fails, user doesn't exist - create account
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          phone: phoneWithCountryCode,
          password: generatedPassword,
          options: {
            data: {
              prayog_user_id: data.user_id,
            }
          }
        });
        
        if (signUpError) throw signUpError;

        // Sign in after creating account
        const { error: signInAfterSignUpError } = await supabase.auth.signInWithPassword({
          phone: phoneWithCountryCode,
          password: generatedPassword,
        });
        
        if (signInAfterSignUpError) throw signInAfterSignUpError;
      }

      // Store Prayog tokens for API calls
      localStorage.setItem('prayog_auth', JSON.stringify({
        phone: phoneWithCountryCode,
        id_token: data.id_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        platform_role: data.platform_role,
        user_id: data.user_id,
        user_email: data.user_email,
        authenticated_at: new Date().toISOString()
      }));

      toast({
        title: "Welcome to Setu!",
        description: "Login successful"
      });
      navigate("/");
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
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary">
            ViaSetu.
          </h1>
          
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {step === 'otp' && <Button variant="ghost" size="icon" onClick={() => setStep('phone')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>}
              <CardTitle>
                {step === 'phone' ? 'Enter Mobile Number' : 'Verify OTP'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'phone' ? <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 py-2 border border-r-0 rounded-l-md bg-muted text-sm">
                      +91
                    </div>
                    <Input id="phone" type="tel" placeholder="Enter 10-digit mobile number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} className="rounded-l-none" />
                  </div>
                </div>
                
                <Button onClick={handleSendOTP} disabled={loading || phoneNumber.length !== 10} className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </> : <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input id="otp" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-lg tracking-widest" />
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
              </>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Login;