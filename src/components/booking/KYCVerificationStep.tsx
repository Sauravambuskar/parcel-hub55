import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle2, Loader2 } from "lucide-react";

interface KYCVerificationStepProps {
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

const KYCVerificationStep = ({ userId, onNext, onBack }: KYCVerificationStepProps) => {
  const [docType, setDocType] = useState("AADHAAR");
  const [docNumber, setDocNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkKYCStatus();
    checkKYCCallback();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('kyc_status, doc_type, doc_number')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setKycStatus(data.kyc_status);
        if (data.doc_type) setDocType(data.doc_type);
        if (data.doc_number) setDocNumber(data.doc_number);
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkKYCCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const kycCallback = urlParams.get('kycCallback');
    
    if (kycCallback === 'true') {
      // User returned from Digilocker
      handleKYCSuccess();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleKYCSuccess = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'verified',
          kyc_completed_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      setKycStatus('verified');
      toast({
        title: "KYC Verified!",
        description: "Your identity has been successfully verified.",
      });
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initiateKYC = async () => {
    if (!docNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your Aadhaar number.",
        variant: "destructive",
      });
      return;
    }

    if (docType === "AADHAAR" && docNumber.length !== 12) {
      toast({
        title: "Invalid Aadhaar",
        description: "Aadhaar number must be 12 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Get Prayog auth from localStorage
      const prayogAuth = localStorage.getItem('prayog_auth');
      if (!prayogAuth) {
        throw new Error('Authentication required. Please log in again.');
      }

      const authData = JSON.parse(prayogAuth);
      
      // Validate we have the necessary auth data
      if (!authData.id_token && !authData.token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Get tenant ID and customer ID
      const tenantId = '6901d6e05021c666ba4bef43';
      const customerId = authData.customer_id || authData.user_id || userId;
      const authToken = authData.id_token || authData.token;

      // Save KYC details to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          doc_type: docType,
          doc_number: docNumber,
          kyc_status: 'pending'
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Get current origin for redirect URL
      const origin = window.location.origin;
      const redirectUrl = `${origin}/booking?kycCallback=true`;

      // Prepare KYC payload
      const kycPayload = {
        KYC: {
          docType,
          docNumber,
          redirectUrl
        }
      };

      console.log('Calling Prayog KYC API directly');

      // Call Prayog KYC API directly
      const response = await fetch(
        `https://sandbox-apis.prayog.io/gateway/onboarding/api/v1/onboarding/${tenantId}/prospay/customer/${customerId}/kyc`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(kycPayload)
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `KYC API error: ${response.status}`);
      }

      console.log('Prayog KYC API Response:', data);

      if (data?.redirectUrl) {
        toast({
          title: "Redirecting to Digilocker",
          description: "Please complete your KYC verification.",
        });

        // Redirect to Digilocker
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('Failed to get redirect URL from Prayog');
      }

    } catch (error: any) {
      console.error('KYC initiation error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to initiate KYC. Please try again.",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };

  const handleSkipKYC = () => {
    // For now, allow skip but mark status
    toast({
      title: "KYC Skipped",
      description: "You can complete KYC verification later from your profile.",
    });
    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (kycStatus === 'verified') {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <CardTitle>KYC Verified</CardTitle>
          </div>
          <CardDescription>
            Your identity has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Your {docType} verification is complete
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button onClick={onNext} className="flex-1">
              Continue to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>KYC Verification</CardTitle>
        </div>
        <CardDescription>
          Verify your identity to complete the booking process securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="docType">Document Type</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AADHAAR">Aadhaar Card</SelectItem>
              <SelectItem value="PAN">PAN Card</SelectItem>
              <SelectItem value="PASSPORT">Passport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="docNumber">
            {docType === "AADHAAR" ? "Aadhaar Number" : 
             docType === "PAN" ? "PAN Number" : "Passport Number"}
          </Label>
          <Input
            id="docNumber"
            type={docType === "AADHAAR" ? "number" : "text"}
            placeholder={docType === "AADHAAR" ? "Enter 12-digit Aadhaar" : `Enter ${docType} number`}
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            maxLength={docType === "AADHAAR" ? 12 : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Your information is secure and will only be used for verification.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            How it works:
          </p>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Click "Verify with Digilocker"</li>
            <li>You'll be redirected to Digilocker</li>
            <li>Complete the verification process</li>
            <li>You'll be redirected back automatically</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSkipKYC} 
            className="flex-1"
          >
            Skip for Now
          </Button>
          <Button 
            onClick={initiateKYC} 
            disabled={isVerifying}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify with Digilocker"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCVerificationStep;
