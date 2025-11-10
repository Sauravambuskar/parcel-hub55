import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Scale } from "lucide-react";

interface BookingStep3Props {
  packageWeight: string;
  packageDescription: string;
  onInputChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep3 = ({ 
  packageWeight, 
  packageDescription, 
  onInputChange, 
  onNext, 
  onBack 
}: BookingStep3Props) => {
  const isValid = packageWeight && packageDescription;

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
            <Label>Package Weight</Label>
            <Select value={packageWeight} onValueChange={(value) => onInputChange('packageWeight', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select package weight category" />
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