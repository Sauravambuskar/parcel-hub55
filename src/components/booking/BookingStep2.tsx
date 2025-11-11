import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, CheckCircle, Globe } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PRAYOG_CONFIG } from "@/config/prayog";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getCountryName } from "@/data/countries";

interface PricingData {
  basePrice: number;
  convenienceFee: number;
  totalPrice: number;
  serviceType: string;
  weightRange: string;
  locationType: string;
}

interface BookingStep2Props {
  shipmentType: 'domestic' | 'international';
  pickupPincode: string;
  deliveryPincode: string;
  senderCountry: string;
  receiverCountry: string;
  goodsType: string;
  packageWeight: string;
  dimensions: { length: string; width: string; height: string };
  shipmentValue: string;
  urgency: string;
  onInputChange: (field: string, value: string) => void;
  onDimensionChange: (dimension: string, value: string) => void;
  onPricingCalculated?: (pricing: PricingData) => void;
  onServiceabilityData?: (data: any) => void;
  onLocationData?: (pickupCity: string, pickupState: string, deliveryCity: string, deliveryState: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep2 = ({ 
  shipmentType,
  pickupPincode,
  deliveryPincode,
  senderCountry,
  receiverCountry,
  goodsType,
  packageWeight,
  dimensions,
  shipmentValue,
  urgency,
  onInputChange,
  onDimensionChange,
  onPricingCalculated,
  onServiceabilityData,
  onLocationData,
  onNext, 
  onBack 
}: BookingStep2Props) => {
  const { toast } = useToast();
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isServiceable, setIsServiceable] = useState(false);
  
  const isValid = pickupPincode && deliveryPincode && (shipmentType === 'domestic' || (shipmentType === 'international' && receiverCountry && receiverCountry !== 'IN'));

  const handleContinue = async () => {
    if (!isValid) return;
    
    // Validation for domestic
    if (shipmentType === 'domestic') {
      if (pickupPincode.length !== 6 || deliveryPincode.length !== 6) {
        toast({
          title: "Invalid Pincode",
          description: "Please enter valid 6-digit pincodes",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Validation for international
      if (pickupPincode.length !== 6) {
        toast({
          title: "Invalid Pincode",
          description: "Please enter a valid 6-digit Indian pincode",
          variant: "destructive"
        });
        return;
      }
      
      if (!receiverCountry || receiverCountry === 'IN') {
        toast({
          title: "Country Required",
          description: "Please select a destination country",
          variant: "destructive"
        });
        return;
      }
      
      if (!deliveryPincode || deliveryPincode.trim().length === 0) {
        toast({
          title: "Postal Code Required",
          description: `Please enter the destination postal code for ${getCountryName(receiverCountry)}`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsCheckingServiceability(true);

    try {
      // First, get location data for both pincodes
      let pickupCity = '';
      let pickupState = '';
      let deliveryCity = '';
      let deliveryState = '';

      // Fetch pickup location details
      try {
        const pickupResponse = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/serviceability/v2/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-TENANT-ID': PRAYOG_CONFIG.TENANT_ID,
          },
          body: JSON.stringify({
            source_postal_code: pickupPincode,
            destination_postal_code: pickupPincode, // Same to get source location
            parcel_category: 'ecomm',
            packages: [{
              weight: { value: 1, unit: 'kg' },
              dimensions: { length: 10, width: 10, height: 10, unit: 'cm' }
            }]
          })
        });
        const pickupData = await pickupResponse.json();
        if (pickupData.partners?.[0]?.capabilities) {
          pickupCity = pickupData.partners[0].capabilities.city_name || '';
          pickupState = pickupData.partners[0].capabilities.state_name || '';
        }
      } catch (error) {
        console.log('Could not fetch pickup location details');
      }

      // Check serviceability between pincodes
      const response = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/serviceability/v2/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TENANT-ID': PRAYOG_CONFIG.TENANT_ID,
        },
        body: JSON.stringify({
          source_postal_code: pickupPincode,
          destination_postal_code: deliveryPincode,
          source_country: senderCountry,
          destination_country: receiverCountry,
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
        setIsServiceable(false);
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
        
        // Extract delivery location data from serviceable partner
        if (data.partners) {
          const serviceablePartner = data.partners.find((p: any) => p.is_serviceable);
          if (serviceablePartner?.capabilities) {
            deliveryCity = serviceablePartner.capabilities.city_name || '';
            deliveryState = serviceablePartner.capabilities.state_name || '';
          }
        }
        
        // Pass location data to parent for auto-fill
        if (onLocationData) {
          onLocationData(pickupCity, pickupState, deliveryCity, deliveryState);
        }
        
        setIsServiceable(true);
        
        toast({
          title: "Service Available ✓",
          description: "Great! Delivery is available for this route. City and state auto-filled for addresses.",
        });
      } else {
        setIsServiceable(false);
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
        <h2 className="text-2xl font-semibold">
          {shipmentType === 'international' ? 'Origin & Destination' : 'Pincode Information'}
        </h2>
        <p className="text-muted-foreground">
          {shipmentType === 'international' 
            ? 'Enter origin and select destination country' 
            : 'Enter pickup and delivery pincodes'}
        </p>
        {shipmentType === 'international' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mt-2">
            <Globe className="w-4 h-4" />
            International Shipment
          </div>
        )}
      </div>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {shipmentType === 'international' ? 'Location Details' : 'Pincode Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {shipmentType === 'domestic' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-pincode">Pickup Pincode *</Label>
                  <Input
                    id="pickup-pincode"
                    value={pickupPincode}
                    onChange={(e) => onInputChange('pickupPincode', e.target.value)}
                    placeholder="e.g., 110001"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-pincode">Delivery Pincode *</Label>
                  <Input
                    id="delivery-pincode"
                    value={deliveryPincode}
                    onChange={(e) => onInputChange('deliveryPincode', e.target.value)}
                    placeholder="e.g., 400001"
                    maxLength={6}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="origin-pincode">Origin Pincode (India) *</Label>
                  <Input
                    id="origin-pincode"
                    value={pickupPincode}
                    onChange={(e) => onInputChange('pickupPincode', e.target.value)}
                    placeholder="e.g., 110001"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">Enter your Indian pincode</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="destination-country">Destination Country *</Label>
                  <Select
                    value={receiverCountry}
                    onValueChange={(value) => {
                      // Update parent component with country selection
                      const event = { target: { value } } as any;
                      onInputChange('receiverCountry', value);
                    }}
                  >
                    <SelectTrigger id="destination-country">
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[300px]">
                        {COUNTRIES.filter(c => c.code !== 'IN').map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              {country.name}
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select where you want to send the package</p>
                </div>

                {receiverCountry && receiverCountry !== 'IN' && (
                  <div className="space-y-2">
                    <Label htmlFor="destination-postal">
                      Destination {receiverCountry === 'US' ? 'ZIP Code' : 'Postal Code'} *
                    </Label>
                    <Input
                      id="destination-postal"
                      value={deliveryPincode}
                      onChange={(e) => onInputChange('deliveryPincode', e.target.value)}
                      placeholder={receiverCountry === 'US' ? 'e.g., 10001' : 'e.g., SW1A 1AA'}
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the {receiverCountry === 'US' ? 'ZIP code' : 'postal code'} for {getCountryName(receiverCountry)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Serviceability Confirmation */}
      {isServiceable && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <AlertDescription className="text-foreground">
            <strong>Serviceability Confirmed!</strong> {shipmentType === 'international' 
              ? `International shipping to ${getCountryName(receiverCountry)} is available.`
              : 'Delivery is available between these pincodes.'} Continue to enter package details.
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing Display */}
      {pricingData && isServiceable && (
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
          onClick={isServiceable ? onNext : handleContinue} 
          disabled={!isValid || isCheckingServiceability}
          className="flex-1 h-12"
        >
          {isCheckingServiceability ? "Checking Serviceability..." : isServiceable ? "Continue to Package Details" : "Check Serviceability"}
        </Button>
      </div>
    </div>
  );
};

export default BookingStep2;