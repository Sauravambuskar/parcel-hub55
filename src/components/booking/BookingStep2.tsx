import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Package, Scale, Ruler, IndianRupee, CheckCircle, AlertCircle } from "lucide-react";
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
  
  const isValid = pickupPincode && deliveryPincode && goodsType && packageWeight && dimensions.length && dimensions.width && dimensions.height && shipmentValue;

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
      // Parse weight input - could be from select or direct input
      let weightValue = 10; // default
      if (packageWeight === 'light') weightValue = 2;
      else if (packageWeight === 'medium') weightValue = 10;
      else if (packageWeight === 'heavy') weightValue = 20;
      else if (!isNaN(parseFloat(packageWeight))) weightValue = parseFloat(packageWeight);

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
                value: weightValue,
                unit: 'kg'
              },
              dimensions: {
                length: parseFloat(dimensions.length) || 10,
                width: parseFloat(dimensions.width) || 10,
                height: parseFloat(dimensions.height) || 10,
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
        (p: any) => p.capabilities?.is_serviceable
      );

      if (serviceablePartner?.services && serviceablePartner.services.length > 0) {
        // Get the most appropriate service based on urgency
        const urgencyMap: Record<string, string> = {
          'express': 'STANDARD',
          'super-urgent': 'STANDARD',
          'standard': 'ECONOMY'
        };
        
        const preferredService = urgencyMap[urgency?.toLowerCase()] || 'ECONOMY';
        
        // Find matching service or use first available
        const service = serviceablePartner.services.find(
          (s: any) => s.companyServiceName === preferredService
        ) || serviceablePartner.services[0];

        const basePrice = Math.round(service.base || 0);
        const taxAmount = Math.round(service.tax || 0);
        const totalPrice = Math.round(service.total || 0);
        const convenienceFee = totalPrice - basePrice;

        const pricing: PricingData = {
          basePrice,
          convenienceFee: Math.max(convenienceFee, 0),
          totalPrice,
          serviceType: service.companyServiceName || 'STANDARD',
          weightRange: `${service.appliedWeight || 0}kg`,
          locationType: service.zoneName || 'ZONE 4'
        };

        setPricingData(pricing);
        if (onPricingCalculated) {
          onPricingCalculated(pricing);
        }

        console.log('Extracted pricing:', pricing);
      }
    } catch (error) {
      console.error('Error extracting pricing:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Pincode & Package Information</h2>
        <p className="text-muted-foreground">Enter pickup and delivery pincodes, and package details</p>
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

      {/* Package Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type of Goods</Label>
            <Select value={goodsType} onValueChange={(value) => onInputChange('goodsType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type of goods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing & Textiles</SelectItem>
                <SelectItem value="books">Books & Stationery</SelectItem>
                <SelectItem value="food">Food Items</SelectItem>
                <SelectItem value="fragile">Fragile Items</SelectItem>
                <SelectItem value="medicine">Medicine & Healthcare</SelectItem>
                <SelectItem value="automotive">Automotive Parts</SelectItem>
                <SelectItem value="jewelry">Jewelry & Valuables</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Package Weight</Label>
            <Select value={packageWeight} onValueChange={(value) => onInputChange('packageWeight', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select package weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Light (0-2 kg)</div>
                      <div className="text-xs text-muted-foreground">Documents, small items</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Medium (2-10 kg)</div>
                      <div className="text-xs text-muted-foreground">Books, electronics, clothing</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="heavy">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Heavy (10+ kg)</div>
                      <div className="text-xs text-muted-foreground">Large items, multiple packages</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Dimensions (CM)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={dimensions.length}
                onChange={(e) => onDimensionChange('length', e.target.value)}
                placeholder="Length"
                type="number"
              />
              <Input
                value={dimensions.width}
                onChange={(e) => onDimensionChange('width', e.target.value)}
                placeholder="Width"
                type="number"
              />
              <Input
                value={dimensions.height}
                onChange={(e) => onDimensionChange('height', e.target.value)}
                placeholder="Height"
                type="number"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Helps in accurate pricing and packaging
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipment-value" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Shipment Value (Approx)
            </Label>
            <Input
              id="shipment-value"
              value={shipmentValue}
              onChange={(e) => onInputChange('shipmentValue', e.target.value)}
              placeholder="e.g., 5000"
              type="number"
            />
            <p className="text-xs text-muted-foreground">
              Required for insurance and customs purposes
            </p>
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