import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PRAYOG_CONFIG } from "@/config/environment";

interface OTPVerificationStepProps {
  onBack: () => void;
  onVerified: (userId: string, phone: string) => void;
}

const OTPVerificationStep = ({ onBack, onVerified }: OTPVerificationStepProps) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [prayogSession, setPrayogSession] = useState('');
  const { toast } = useToast();

  // Check if already authenticated
  const isAlreadyAuthenticated = () => {
    const prayogAuth = localStorage.getItem('prayog_auth');
    if (prayogAuth) {
      const authData = JSON.parse(prayogAuth);
      return authData.user_id ? authData : null;
    }
    return null;
  };

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
        token: data.id_token,
        id_token: data.id_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        platform_role: data.platform_role,
        user_id: data.user_id,
        customer_id: data.customer_id || data.user_id,
        user_email: data.user_email,
        authenticated_at: new Date().toISOString()
      };
      localStorage.setItem('prayog_auth', JSON.stringify(authData));

      // Create or update user profile in Supabase
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user_id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({ 
            phone: phoneWithCountryCode,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user_id);
      } else {
        await supabase
          .from('profiles')
          .insert({
            user_id: data.user_id,
            phone: phoneWithCountryCode
          });
      }

      toast({
        title: "Verified!",
        description: "Phone number verified successfully"
      });
      
      onVerified(data.user_id, phoneWithCountryCode);
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

  // Check if already logged in, auto-proceed
  const existingAuth = isAlreadyAuthenticated();
  if (existingAuth) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Verify Your Phone</h2>
          <p className="text-muted-foreground">Confirm your identity to continue</p>
        </div>

        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Already Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Logged in as {existingAuth.phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1 h-12">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={() => onVerified(existingAuth.user_id, existingAuth.phone)} 
            className="flex-1 h-12"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Verify Your Phone</h2>
        <p className="text-muted-foreground">We need to verify your phone number to proceed with booking</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {step === 'phone' ? 'Enter Mobile Number' : 'Enter Verification Code'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {step === 'phone' ? 'We\'ll send you a one-time password' : `OTP sent to +91 ${phoneNumber}`}
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
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  className="text-center text-lg tracking-widest" 
                />
              </div>
              
              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading || otp.length !== 6} 
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
              
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setStep('phone')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change Number
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
};

export default OTPVerificationStep;
