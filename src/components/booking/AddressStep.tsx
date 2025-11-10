import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddressStepProps {
  senderData: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  receiverData: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  onSenderChange: (field: string, value: string) => void;
  onReceiverChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddressStep = ({
  senderData,
  receiverData,
  onSenderChange,
  onReceiverChange,
  onNext,
  onBack,
}: AddressStepProps) => {
  const { toast } = useToast();
  const [senderValidation, setSenderValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [receiverValidation, setReceiverValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const validateAddress = async (
    address: string,
    city: string,
    state: string,
    pincode: string,
    type: 'sender' | 'receiver'
  ) => {
    if (!address || !city || !state || !pincode) return;
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      return;
    }

    setIsValidating(true);
    try {
      const fullAddress = `${address}, ${city}, ${state}, ${pincode}, India`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;
        
        const addressCity = components.find((c: any) => c.types.includes('locality'))?.long_name || '';
        const addressState = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || '';
        const addressPincode = components.find((c: any) => c.types.includes('postal_code'))?.long_name || '';
        
        const cityMatch = addressCity.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(addressCity.toLowerCase());
        const stateMatch = addressState.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(addressState.toLowerCase());
        const pincodeMatch = addressPincode === pincode;
        
        if (cityMatch && stateMatch && pincodeMatch) {
          const validation = { valid: true, message: 'Address verified successfully' };
          type === 'sender' ? setSenderValidation(validation) : setReceiverValidation(validation);
        } else {
          const validation = { 
            valid: false, 
            message: `Address doesn't match: Expected ${city}, ${state} - ${pincode}` 
          };
          type === 'sender' ? setSenderValidation(validation) : setReceiverValidation(validation);
        }
      } else {
        const validation = { valid: false, message: 'Could not verify address' };
        type === 'sender' ? setSenderValidation(validation) : setReceiverValidation(validation);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      const validation = { valid: false, message: 'Validation error occurred' };
      type === 'sender' ? setSenderValidation(validation) : setReceiverValidation(validation);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (senderData.address && senderData.city && senderData.state && senderData.pincode) {
      const timeoutId = setTimeout(() => {
        validateAddress(senderData.address, senderData.city, senderData.state, senderData.pincode, 'sender');
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setSenderValidation(null);
    }
  }, [senderData.address, senderData.city, senderData.state, senderData.pincode]);

  useEffect(() => {
    if (receiverData.address && receiverData.city && receiverData.state && receiverData.pincode) {
      const timeoutId = setTimeout(() => {
        validateAddress(receiverData.address, receiverData.city, receiverData.state, receiverData.pincode, 'receiver');
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setReceiverValidation(null);
    }
  }, [receiverData.address, receiverData.city, receiverData.state, receiverData.pincode]);

  const isSenderValid = 
    senderData.name && 
    senderData.phone && 
    senderData.address && 
    senderData.city && 
    senderData.state && 
    senderData.pincode &&
    (!GOOGLE_MAPS_API_KEY || senderValidation?.valid);

  const isReceiverValid = 
    receiverData.name && 
    receiverData.phone && 
    receiverData.address && 
    receiverData.city && 
    receiverData.state && 
    receiverData.pincode &&
    (!GOOGLE_MAPS_API_KEY || receiverValidation?.valid);

  const isValid = isSenderValid && isReceiverValid;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sender Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sender-name">Full Name *</Label>
              <Input
                id="sender-name"
                value={senderData.name}
                onChange={(e) => onSenderChange("name", e.target.value)}
                placeholder="Enter sender name"
              />
            </div>
            <div>
              <Label htmlFor="sender-phone">Phone Number *</Label>
              <Input
                id="sender-phone"
                type="tel"
                value={senderData.phone}
                onChange={(e) => onSenderChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sender-address">Complete Address *</Label>
            <Textarea
              id="sender-address"
              value={senderData.address}
              onChange={(e) => onSenderChange("address", e.target.value)}
              placeholder="House/Flat No., Building Name, Street, Area"
              rows={3}
            />
            {senderValidation && (
              <Alert className={`mt-2 ${senderValidation.valid ? 'border-green-500' : 'border-destructive'}`}>
                {senderValidation.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{senderValidation.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sender-city">City *</Label>
              <Input
                id="sender-city"
                value={senderData.city}
                onChange={(e) => onSenderChange("city", e.target.value)}
                placeholder="City"
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="sender-state">State *</Label>
              <Input
                id="sender-state"
                value={senderData.state}
                onChange={(e) => onSenderChange("state", e.target.value)}
                placeholder="State"
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="sender-pincode">Pincode *</Label>
              <Input
                id="sender-pincode"
                value={senderData.pincode}
                onChange={(e) => onSenderChange("pincode", e.target.value)}
                placeholder="110001"
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Receiver Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiver-name">Full Name *</Label>
              <Input
                id="receiver-name"
                value={receiverData.name}
                onChange={(e) => onReceiverChange("name", e.target.value)}
                placeholder="Enter receiver name"
              />
            </div>
            <div>
              <Label htmlFor="receiver-phone">Phone Number *</Label>
              <Input
                id="receiver-phone"
                type="tel"
                value={receiverData.phone}
                onChange={(e) => onReceiverChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="receiver-address">Complete Address *</Label>
            <Textarea
              id="receiver-address"
              value={receiverData.address}
              onChange={(e) => onReceiverChange("address", e.target.value)}
              placeholder="House/Flat No., Building Name, Street, Area"
              rows={3}
            />
            {receiverValidation && (
              <Alert className={`mt-2 ${receiverValidation.valid ? 'border-green-500' : 'border-destructive'}`}>
                {receiverValidation.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{receiverValidation.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="receiver-city">City *</Label>
              <Input
                id="receiver-city"
                value={receiverData.city}
                onChange={(e) => onReceiverChange("city", e.target.value)}
                placeholder="City"
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="receiver-state">State *</Label>
              <Input
                id="receiver-state"
                value={receiverData.state}
                onChange={(e) => onReceiverChange("state", e.target.value)}
                placeholder="State"
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="receiver-pincode">Pincode *</Label>
              <Input
                id="receiver-pincode"
                value={receiverData.pincode}
                onChange={(e) => onReceiverChange("pincode", e.target.value)}
                placeholder="110001"
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default AddressStep;
