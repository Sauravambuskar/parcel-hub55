import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PRAYOG_CONFIG } from "@/config/prayog";
import { supabase } from "@/integrations/supabase/client";

interface PricingData {
  basePrice: number;
  convenienceFee: number;
  totalPrice: number;
  serviceType: string;
  weightRange: string;
  locationType: string;
}

interface BookingStep2Props {
  pickupPincode: string;
  deliveryPincode: string;
  goodsType: string;
  packageWeight: string;
  dimensions: { length: string; width: string; height: string };
  shipmentValue: string;
  urgency: string;
  onInputChange: (field: string, value: string) => void;
  onDimensionChange: (dimension: string, value: string) => void;
  onPricingCalculated?: (pricing: PricingData) => void;
  onServiceabilityData?: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep2 = ({ 
  pickupPincode,
  deliveryPincode,
  goodsType,
  packageWeight,
  dimensions,
  shipmentValue,
  urgency,
  onInputChange,
  onDimensionChange,
  onPricingCalculated,
  onServiceabilityData,
  onNext, 
  onBack 
}: BookingStep2Props) => {
  const { toast } = useToast();
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  
  const isValid = pickupPincode && deliveryPincode;

  const handleContinue = async () => {
    if (!isValid) return;
    
    if (pickupPincode.length !== 6 || deliveryPincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter valid 6-digit pincodes",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingServiceability(true);

    try {
      // Use default values for initial serviceability check
      const response = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/serviceability/v2/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TENANT-ID': PRAYOG_CONFIG.TENANT_ID,
        },
        body: JSON.stringify({
          source_postal_code: pickupPincode,
          destination_postal_code: deliveryPincode,
          parcel_category: 'ecomm',
          packages: [
            {
              weight: {
                value: 2,
                unit: 'kg'
              },
              dimensions: {
                length: 10,
                width: 10,
                height: 10,
                unit: 'cm'
              }
            }
          ]
        })
      });

      const data = await response.json();

      if (data.success === false || data.metadata?.serviceable_count === 0) {
        toast({
          title: "Service Unavailable",
          description: "Delivery is not available for this route. Please try different pincodes.",
          variant: "destructive"
        });
      } else if (data.success === true && data.metadata?.serviceable_count > 0) {
        // Extract pricing from serviceability response
        extractPricingFromResponse(data);
        
        // Pass full serviceability data to parent
        if (onServiceabilityData) {
          onServiceabilityData(data);
        }
        
        toast({
          title: "Service Available",
          description: "Route is serviceable. Pricing calculated!",
        });
        
        setTimeout(() => {
          onNext();
        }, 1500);
      } else {
        toast({
          title: "Service Unavailable",
          description: "Unable to check serviceability. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Serviceability check error:', error);
      toast({
        title: "Error",
        description: "Failed to check serviceability. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingServiceability(false);
    }
  };

  const extractPricingFromResponse = (serviceabilityData: any) => {
    try {
      // Extract pricing from the first serviceable partner
      const serviceablePartner = serviceabilityData.partners?.find(
        (p: any) => p.is_serviceable
      );

      if (serviceablePartner?.services && serviceablePartner.services.length > 0) {
        // Use the first available service (Prayog API returns best match)
        const service = serviceablePartner.services[0];

        // Extract price from rate object
        const totalPrice = Math.round(service.rate?.price?.amount || 0);
        const basePrice = totalPrice; // Prayog API returns total price only
        const convenienceFee = 0;

        const pricing: PricingData = {
          basePrice,
          convenienceFee,
          totalPrice,
          serviceType: service.service_name.toUpperCase(),
          weightRange: 'Based on package details',
          locationType: serviceablePartner.capabilities?.city_name || 'Standard'
        };

        setPricingData(pricing);
        if (onPricingCalculated) {
          onPricingCalculated(pricing);
        }

        console.log('Extracted pricing from Prayog API:', pricing);
      }
    } catch (error) {
      console.error('Error extracting pricing:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Pincode Information</h2>
        <p className="text-muted-foreground">Enter pickup and delivery pincodes</p>
      </div>

      {/* Pincode Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Pincode Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup-pincode">Pickup Pincode</Label>
                <Input
                  id="pickup-pincode"
                  value={pickupPincode}
                  onChange={(e) => onInputChange('pickupPincode', e.target.value)}
                  placeholder="e.g., 110001"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-pincode">Delivery Pincode</Label>
                <Input
                  id="delivery-pincode"
                  value={deliveryPincode}
                  onChange={(e) => onInputChange('deliveryPincode', e.target.value)}
                  placeholder="e.g., 400001"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Pricing Display */}
      {pricingData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-success" />
              Estimated Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-semibold">₹{pricingData.basePrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Convenience Fee</span>
              <span className="font-semibold">₹{pricingData.convenienceFee}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Total Estimated Cost</span>
              <span className="text-xl font-bold text-primary">₹{pricingData.totalPrice}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <p>Service Type: {pricingData.serviceType}</p>
              <p>Weight Range: {pricingData.weightRange}</p>
              <p>Location Type: {pricingData.locationType}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={!isValid || isCheckingServiceability}
          className="flex-1 h-12"
        >
          {isCheckingServiceability ? "Checking..." : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default BookingStep2;