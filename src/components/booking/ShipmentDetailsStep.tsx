import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, Scale, Ruler } from "lucide-react";

interface ShipmentDetailsStepProps {
  weight: string;
  dimensions: { length: string; width: string; height: string };
  goodsType: string;
  description: string;
  onWeightChange: (value: string) => void;
  onDimensionChange: (dimension: string, value: string) => void;
  onGoodsTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const ShipmentDetailsStep = ({
  weight,
  dimensions,
  goodsType,
  description,
  onWeightChange,
  onDimensionChange,
  onGoodsTypeChange,
  onDescriptionChange,
  onNext,
  onBack,
}: ShipmentDetailsStepProps) => {
  const isValid = weight && dimensions.length && dimensions.width && dimensions.height && goodsType;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Shipment Details</h2>
        <p className="text-muted-foreground">Enter package weight and dimensions</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Weight */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <Scale className="w-5 h-5 text-primary" />
              Package Weight (in grams) *
            </Label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => onWeightChange(e.target.value)}
              placeholder="Enter weight in grams (e.g., 500)"
              min="1"
            />
            <p className="text-xs text-muted-foreground">Enter weight in grams. 1 kg = 1000 grams</p>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <Ruler className="w-5 h-5 text-primary" />
              Package Dimensions (L × W × H in cm) *
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Length</Label>
                <Input
                  type="number"
                  value={dimensions.length}
                  onChange={(e) => onDimensionChange("length", e.target.value)}
                  placeholder="L"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => onDimensionChange("width", e.target.value)}
                  placeholder="W"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => onDimensionChange("height", e.target.value)}
                  placeholder="H"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Goods Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-primary" />
              Type of Goods *
            </Label>
            <Select value={goodsType} onValueChange={onGoodsTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select goods type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing & Apparel</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="food">Food & Perishables</SelectItem>
                <SelectItem value="fragile">Fragile Items</SelectItem>
                <SelectItem value="medicines">Medicines</SelectItem>
                <SelectItem value="books">Books & Stationery</SelectItem>
                <SelectItem value="gifts">Gifts & Accessories</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Package Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Brief description of the package contents"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Check Serviceability
        </Button>
      </div>
    </div>
  );
};

export default ShipmentDetailsStep;
