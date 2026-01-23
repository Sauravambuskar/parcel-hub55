import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle, Package, Loader2, FileText, Mail, AlertTriangle, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PRAYOG_CONFIG } from "@/config/environment";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const goodsTypes = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'box', label: 'Box/Parcel', icon: Package },
  { id: 'envelope', label: 'Envelope', icon: Mail },
  { id: 'fragile', label: 'Fragile', icon: AlertTriangle },
  { id: 'others', label: 'Others', icon: MoreHorizontal },
];

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
  pickupCity?: string;
  deliveryCity?: string;
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
  pickupPincode,
  deliveryPincode,
  pickupCity,
  deliveryCity,
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
  const [isLoadingPickupCity, setIsLoadingPickupCity] = useState(false);
  const [isLoadingDeliveryCity, setIsLoadingDeliveryCity] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg');
  
  // Refs to track previous pincode values for debouncing
  const pickupDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const deliveryDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced city lookup for pickup pincode
  useEffect(() => {
    if (pickupDebounceRef.current) {
      clearTimeout(pickupDebounceRef.current);
    }

    if (pickupPincode.length === 6) {
      setIsLoadingPickupCity(true);
      pickupDebounceRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('google-geocode-pincode', {
            body: { pincodes: [pickupPincode] }
          });

          if (!error && data?.results?.[0]) {
            const result = data.results[0];
            if (onLocationData && result.city) {
              // Only update pickup city, preserve delivery city
              onLocationData(result.city, result.state || '', deliveryCity || '', '');
            }
          }
        } catch (err) {
          console.error('Pickup city lookup error:', err);
        } finally {
          setIsLoadingPickupCity(false);
        }
      }, 500);
    }

    return () => {
      if (pickupDebounceRef.current) {
        clearTimeout(pickupDebounceRef.current);
      }
    };
  }, [pickupPincode]);

  // Debounced city lookup for delivery pincode
  useEffect(() => {
    if (deliveryDebounceRef.current) {
      clearTimeout(deliveryDebounceRef.current);
    }

    if (deliveryPincode.length === 6) {
      setIsLoadingDeliveryCity(true);
      deliveryDebounceRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('google-geocode-pincode', {
            body: { pincodes: [deliveryPincode] }
          });

          if (!error && data?.results?.[0]) {
            const result = data.results[0];
            if (onLocationData && result.city) {
              // Only update delivery city, preserve pickup city
              onLocationData(pickupCity || '', '', result.city, result.state || '');
            }
          }
        } catch (err) {
          console.error('Delivery city lookup error:', err);
        } finally {
          setIsLoadingDeliveryCity(false);
        }
      }, 500);
    }

    return () => {
      if (deliveryDebounceRef.current) {
        clearTimeout(deliveryDebounceRef.current);
      }
    };
  }, [deliveryPincode]);
  
  const isValid = pickupPincode && deliveryPincode && goodsType && packageWeight && dimensions.length && dimensions.width && dimensions.height;

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
      let pickupCity = '';
      let pickupState = '';
      let deliveryCity = '';
      let deliveryState = '';

      // Get auth token for API calls
      const prayogAuth = localStorage.getItem('prayog_auth');
      const authData = prayogAuth ? JSON.parse(prayogAuth) : null;
      const userId = authData?.user_id || '';

      // Call Prayog serviceability v3 API directly
      const response = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/serviceability/v3/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': PRAYOG_CONFIG.TENANT_ID,
          ...(userId && { 'x-user-id': userId }),
        },
        body: JSON.stringify({
          source_location: {
            postal_code: pickupPincode,
            country_code: 'IN'
          },
          destination_location: {
            postal_code: deliveryPincode,
            country_code: 'IN'
          },
          packages: [{
            weight: { 
              value: weightUnit === 'g' 
                ? (parseFloat(packageWeight) || 1000) / 1000 
                : parseFloat(packageWeight) || 1.0, 
              unit: 'kg' 
            },
            dimensions: { 
              length: parseFloat(dimensions.length) || 10.0, 
              width: parseFloat(dimensions.width) || 10.0,
              height: parseFloat(dimensions.height) || 10.0, 
              unit: 'cm' 
            }
          }]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Prayog API error:', data);
        toast({
          title: "Error",
          description: data.message || "Failed to check serviceability. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('Serviceability response:', data);

      if (data.success === false || data.metadata?.serviceable_count === 0) {
        setIsServiceable(false);
        toast({
          title: "Service Unavailable",
          description: "Delivery is not available for this route. Please try different pincodes.",
          variant: "destructive"
        });
        return;
      } else if (data.success === true && data.metadata?.serviceable_count > 0) {
        // Fetch city names using Google Geocoding API
        try {
          const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('google-geocode-pincode', {
            body: { pincodes: [pickupPincode, deliveryPincode] }
          });

          if (!geocodeError && geocodeData?.results) {
            const pickupResult = geocodeData.results.find((r: any) => r.pincode === pickupPincode);
            const deliveryResult = geocodeData.results.find((r: any) => r.pincode === deliveryPincode);
            
            if (pickupResult) {
              pickupCity = pickupResult.city || '';
              pickupState = pickupResult.state || '';
            }
            if (deliveryResult) {
              deliveryCity = deliveryResult.city || '';
              deliveryState = deliveryResult.state || '';
            }
            
            console.log('Geocode results:', { pickupCity, pickupState, deliveryCity, deliveryState });
          } else {
            console.warn('Geocoding failed:', geocodeError);
          }
        } catch (geocodeErr) {
          console.error('Geocoding error:', geocodeErr);
        }
        
        extractPricingFromResponse(data);
        
        if (onServiceabilityData) {
          onServiceabilityData(data);
        }
        
        if (onLocationData) {
          onLocationData(pickupCity, pickupState, deliveryCity, deliveryState);
        }
        
        setIsServiceable(true);
        
        toast({
          title: "Service Available ✓",
          description: "Great! Delivery is available for this route.",
        });
        
        onNext();
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
      const serviceablePartner = serviceabilityData.partners?.find(
        (p: any) => p.is_serviceable
      );

      if (serviceablePartner?.services && serviceablePartner.services.length > 0) {
        const service = serviceablePartner.services[0];
        const apiPrice = Math.round(service.rate?.price?.amount || 0);
        const platformFee = 50; // Platform fee added to base price
        const basePrice = apiPrice + platformFee;
        const convenienceFee = 0;
        const totalPrice = basePrice;

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Pincode Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              {isLoadingPickupCity ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Looking up city...
                </p>
              ) : pickupCity ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {pickupCity}
                </p>
              ) : null}
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
              {isLoadingDeliveryCity ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Looking up city...
                </p>
              ) : deliveryCity ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {deliveryCity}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type of Good - Icon Selector */}
          <div className="space-y-3">
            <Label>Type of Good *</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {goodsTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = goodsType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onInputChange('goodsType', type.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="package-weight">Weight ({weightUnit})</Label>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setWeightUnit('kg')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    weightUnit === 'kg' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setWeightUnit('g')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    weightUnit === 'g' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  g
                </button>
              </div>
            </div>
            <Input
              id="package-weight"
              type="number"
              value={packageWeight}
              onChange={(e) => onInputChange('packageWeight', e.target.value)}
              placeholder={weightUnit === 'kg' ? "e.g., 1.5" : "e.g., 500"}
              min={weightUnit === 'kg' ? "0.1" : "1"}
              step={weightUnit === 'kg' ? "0.1" : "1"}
            />
          </div>
          <div className="space-y-2">
            <Label>Dimensions (cm)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="length" className="text-xs text-muted-foreground">Length</Label>
                <Input
                  id="length"
                  type="number"
                  value={dimensions.length}
                  onChange={(e) => onDimensionChange('length', e.target.value)}
                  placeholder="L"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="width" className="text-xs text-muted-foreground">Breadth</Label>
                <Input
                  id="width"
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => onDimensionChange('width', e.target.value)}
                  placeholder="B"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height" className="text-xs text-muted-foreground">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => onDimensionChange('height', e.target.value)}
                  placeholder="H"
                  min="1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isServiceable && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <AlertDescription className="text-foreground">
            <strong>Serviceability Confirmed!</strong> Delivery is available between these pincodes. 
            Continue to enter package details.
          </AlertDescription>
        </Alert>
      )}

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
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Total Estimated Cost</span>
              <span className="text-xl font-bold text-primary">₹{pricingData.totalPrice}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              * Price is inclusive of all taxes, pickup and delivery charges
            </p>
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
          {isCheckingServiceability ? "Checking..." : "Check & Continue"}
        </Button>
      </div>
    </div>
  );
};

export default BookingStep2;
