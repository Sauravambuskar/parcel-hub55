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
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in with Prayog
    const prayogAuth = localStorage.getItem('prayog_auth');
    if (prayogAuth) {
      navigate("/");
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
      const { data, error } = await supabase.functions.invoke('prayog-send-otp', {
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
        description: data.message || `Verification code sent to +91 ${phoneNumber}`,
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
      const { data, error } = await supabase.functions.invoke('prayog-verify-otp', {
        body: { 
          phone: `+91${phoneNumber}`,
          session: prayogSession,
          otp: otp
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Store Prayog auth data with tokens
      localStorage.setItem('prayog_auth', JSON.stringify({
        phone: `+91${phoneNumber}`,
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
        description: "Login successful",
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

  const handleGuestMode = () => {
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            ViaSetu.
          </h1>
          <p className="text-muted-foreground mt-2">
            Fast delivery across India
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {step === 'otp' && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setStep('phone')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle>
                {step === 'phone' ? 'Enter Mobile Number' : 'Verify OTP'}
              </CardTitle>
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
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendOTP}
                  disabled={loading || phoneNumber.length !== 10}
                  className="w-full"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    OTP sent to +91 {phoneNumber}
                  </p>
                </div>
                
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleSendOTP}
                  className="w-full text-sm"
                >
                  Resend OTP
                </Button>
              </>
            )}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleGuestMode}
              className="w-full"
            >
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;