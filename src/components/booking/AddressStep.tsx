import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

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
  const [senderSuggestions, setSenderSuggestions] = useState<any[]>([]);
  const [receiverSuggestions, setReceiverSuggestions] = useState<any[]>([]);
  const [showSenderSuggestions, setShowSenderSuggestions] = useState(false);
  const [showReceiverSuggestions, setShowReceiverSuggestions] = useState(false);
  const senderInputRef = useRef<HTMLTextAreaElement>(null);
  const receiverInputRef = useRef<HTMLTextAreaElement>(null);
  const senderDebounceRef = useRef<NodeJS.Timeout>();
  const receiverDebounceRef = useRef<NodeJS.Timeout>();

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const fetchPlaceSuggestions = async (input: string, type: 'sender' | 'receiver') => {
    if (!input || input.length < 3) return;

    try {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: { input }
      });
      
      if (error) {
        console.error('Error fetching place suggestions:', error);
        return;
      }
      
      if (data.status === 'OK' && data.predictions) {
        if (type === 'sender') {
          setSenderSuggestions(data.predictions);
          setShowSenderSuggestions(true);
        } else {
          setReceiverSuggestions(data.predictions);
          setShowReceiverSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
    }
  };

  const handleAddressChange = (value: string, type: 'sender' | 'receiver') => {
    if (type === 'sender') {
      onSenderChange('address', value);
      if (senderDebounceRef.current) {
        clearTimeout(senderDebounceRef.current);
      }
      senderDebounceRef.current = setTimeout(() => {
        if (value.length >= 3) {
          fetchPlaceSuggestions(value, type);
        } else {
          setSenderSuggestions([]);
          setShowSenderSuggestions(false);
        }
      }, 300);
    } else {
      onReceiverChange('address', value);
      if (receiverDebounceRef.current) {
        clearTimeout(receiverDebounceRef.current);
      }
      receiverDebounceRef.current = setTimeout(() => {
        if (value.length >= 3) {
          fetchPlaceSuggestions(value, type);
        } else {
          setReceiverSuggestions([]);
          setShowReceiverSuggestions(false);
        }
      }, 300);
    }
  };

  const selectSuggestion = (suggestion: any, type: 'sender' | 'receiver') => {
    if (type === 'sender') {
      onSenderChange('address', suggestion.description);
      setSenderSuggestions([]);
      setShowSenderSuggestions(false);
    } else {
      onReceiverChange('address', suggestion.description);
      setReceiverSuggestions([]);
      setShowReceiverSuggestions(false);
    }
  };

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
    return () => {
      if (senderDebounceRef.current) {
        clearTimeout(senderDebounceRef.current);
      }
      if (receiverDebounceRef.current) {
        clearTimeout(receiverDebounceRef.current);
      }
    };
  }, []);

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
    senderData.pincode;

  const isReceiverValid = 
    receiverData.name && 
    receiverData.phone && 
    receiverData.address && 
    receiverData.city && 
    receiverData.state && 
    receiverData.pincode;

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

          <div className="relative">
            <Label htmlFor="sender-address">Complete Address *</Label>
            <Textarea
              ref={senderInputRef}
              id="sender-address"
              value={senderData.address}
              onChange={(e) => handleAddressChange(e.target.value, 'sender')}
              onFocus={() => senderSuggestions.length > 0 && setShowSenderSuggestions(true)}
              placeholder="House/Flat No., Building Name, Street, Area"
              rows={3}
            />
            {showSenderSuggestions && senderSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
                <ScrollArea className="h-full max-h-60">
                  {senderSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="px-4 py-3 hover:bg-accent cursor-pointer flex items-start gap-2 border-b border-border last:border-0"
                      onClick={() => selectSuggestion(suggestion, 'sender')}
                    >
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{suggestion.structured_formatting?.main_text}</p>
                        <p className="text-xs text-muted-foreground truncate">{suggestion.structured_formatting?.secondary_text}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
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

          <div className="relative">
            <Label htmlFor="receiver-address">Complete Address *</Label>
            <Textarea
              ref={receiverInputRef}
              id="receiver-address"
              value={receiverData.address}
              onChange={(e) => handleAddressChange(e.target.value, 'receiver')}
              onFocus={() => receiverSuggestions.length > 0 && setShowReceiverSuggestions(true)}
              placeholder="House/Flat No., Building Name, Street, Area"
              rows={3}
            />
            {showReceiverSuggestions && receiverSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
                <ScrollArea className="h-full max-h-60">
                  {receiverSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="px-4 py-3 hover:bg-accent cursor-pointer flex items-start gap-2 border-b border-border last:border-0"
                      onClick={() => selectSuggestion(suggestion, 'receiver')}
                    >
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{suggestion.structured_formatting?.main_text}</p>
                        <p className="text-xs text-muted-foreground truncate">{suggestion.structured_formatting?.secondary_text}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
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
