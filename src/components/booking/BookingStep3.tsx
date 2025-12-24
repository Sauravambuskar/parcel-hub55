import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Scale, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingStep3Props {
  goodsType: string;
  packageWeight: string;
  customWeight: string;
  dimensions: { length: string; width: string; height: string };
  shipmentValue: string;
  packageDescription: string;
  onInputChange: (field: string, value: string) => void;
  onDimensionChange: (dimension: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep3 = ({ 
  goodsType,
  packageWeight,
  customWeight,
  dimensions,
  shipmentValue,
  packageDescription, 
  onInputChange,
  onDimensionChange,
  onNext, 
  onBack 
}: BookingStep3Props) => {
  const isCustomWeight = packageWeight === "above-1kg";
  const customWeightKg = parseFloat(customWeight) || 0;
  const isOverweight = isCustomWeight && customWeightKg > 20;
  
  const isValid = goodsType && 
    packageWeight && 
    (isCustomWeight ? customWeight && customWeightKg > 0 && !isOverweight : true) &&
    dimensions.length && 
    dimensions.width && 
    dimensions.height && 
    packageDescription;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Package Information</h2>
        <p className="text-muted-foreground">Tell us about your package to get accurate pricing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goods-type">Type of Goods *</Label>
            <Select value={goodsType} onValueChange={(value) => onInputChange('goodsType', value)}>
              <SelectTrigger id="goods-type">
                <SelectValue placeholder="Select goods type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="food">Food Items</SelectItem>
                <SelectItem value="fragile">Fragile Items</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Package Weight *</Label>
            <Select value={packageWeight} onValueChange={(value) => {
              onInputChange('packageWeight', value);
              if (value !== 'above-1kg') {
                onInputChange('customWeight', '');
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select package weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-250g">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>0 - 250 gms</span>
                  </div>
                </SelectItem>
                <SelectItem value="250-500g">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>250 - 500 gms</span>
                  </div>
                </SelectItem>
                <SelectItem value="500g-1kg">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>500 gms - 1 kg</span>
                  </div>
                </SelectItem>
                <SelectItem value="above-1kg">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>Above 1 kg (Enter weight)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomWeight && (
            <div className="space-y-2">
              <Label htmlFor="custom-weight">Enter Weight (in kg) *</Label>
              <Input
                id="custom-weight"
                type="number"
                value={customWeight}
                onChange={(e) => onInputChange('customWeight', e.target.value)}
                placeholder="Enter weight in kg (e.g., 2.5)"
                min="1"
                max="20"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">
                Maximum weight: 20 kg
              </p>
            </div>
          )}

          {isOverweight && (
            <Alert variant="destructive">
              <Mail className="h-4 w-4" />
              <AlertDescription className="ml-2">
                For packages weighing more than 20 kg, please contact us directly at{" "}
                <a 
                  href="mailto:support@yourcompany.com?subject=Heavy Package Inquiry&body=I have a package weighing more than 20kg and would like to arrange shipping."
                  className="underline font-medium"
                >
                  support@yourcompany.com
                </a>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Package Dimensions (cm) *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="Length"
                value={dimensions.length}
                onChange={(e) => onDimensionChange('length', e.target.value)}
                min="1"
                required
              />
              <Input
                type="number"
                placeholder="Width"
                value={dimensions.width}
                onChange={(e) => onDimensionChange('width', e.target.value)}
                min="1"
                required
              />
              <Input
                type="number"
                placeholder="Height"
                value={dimensions.height}
                onChange={(e) => onDimensionChange('height', e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipment-value">Shipment Value (₹)</Label>
            <Input
              id="shipment-value"
              type="number"
              value={shipmentValue}
              onChange={(e) => onInputChange('shipmentValue', e.target.value)}
              placeholder="Enter value for insurance"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Optional: For insurance purposes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Package Contents *</Label>
            <div className="relative">
              <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="description"
                value={packageDescription}
                onChange={(e) => onInputChange('packageDescription', e.target.value)}
                placeholder="e.g., Documents, Electronics, Clothing"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Describe the contents of your package
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="flex-1 h-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BookingStep3;