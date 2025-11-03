import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Package, Scale, Ruler, IndianRupee } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface BookingStep2Props {
  pickupPincode: string;
  deliveryPincode: string;
  goodsType: string;
  packageWeight: string;
  dimensions: { length: string; width: string; height: string };
  shipmentValue: string;
  onInputChange: (field: string, value: string) => void;
  onDimensionChange: (dimension: string, value: string) => void;
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
  onInputChange,
  onDimensionChange,
  onNext, 
  onBack 
}: BookingStep2Props) => {
  const { toast } = useToast();
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [serviceabilityChecked, setServiceabilityChecked] = useState(false);
  
  const isValid = pickupPincode && deliveryPincode && goodsType && packageWeight && dimensions.length && dimensions.width && dimensions.height && shipmentValue;

  useEffect(() => {
    setServiceabilityChecked(false);
  }, [pickupPincode, deliveryPincode]);

  const checkServiceability = async () => {
    if (!pickupPincode || !deliveryPincode) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and delivery pincodes",
        variant: "destructive",
      });
      return;
    }

    if (pickupPincode.length !== 6 || deliveryPincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Pincodes must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingServiceability(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-serviceability', {
        body: {
          source_postal_code: pickupPincode,
          destination_postal_code: deliveryPincode
        }
      });

      if (error) throw error;

      setServiceabilityChecked(true);
      toast({
        title: "Serviceability Confirmed",
        description: "Delivery is available for this route",
      });
    } catch (error: any) {
      console.error('Serviceability check error:', error);
      toast({
        title: "Serviceability Check Failed",
        description: error.message || "Unable to verify serviceability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingServiceability(false);
    }
  };

  const handleNext = () => {
    if (!serviceabilityChecked) {
      toast({
        title: "Serviceability Check Required",
        description: "Please check serviceability before continuing",
        variant: "destructive",
      });
      return;
    }
    onNext();
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
            <Button
              onClick={checkServiceability}
              disabled={!pickupPincode || !deliveryPincode || pickupPincode.length !== 6 || deliveryPincode.length !== 6 || isCheckingServiceability}
              className="w-full"
              variant={serviceabilityChecked ? "outline" : "default"}
            >
              {isCheckingServiceability ? "Checking..." : serviceabilityChecked ? "✓ Serviceability Confirmed" : "Check Serviceability"}
            </Button>
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

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!isValid || !serviceabilityChecked}
          className="flex-1 h-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BookingStep2;