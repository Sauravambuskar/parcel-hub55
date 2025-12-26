import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";

interface BookingStep3Props {
  goodsType: string;
  shipmentValue: string;
  packageDescription: string;
  onInputChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep3 = ({ 
  goodsType,
  shipmentValue,
  packageDescription, 
  onInputChange,
  onNext, 
  onBack 
}: BookingStep3Props) => {
  const isValid = goodsType && packageDescription;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Package Information</h2>
        <p className="text-muted-foreground">Tell us about your package contents</p>
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