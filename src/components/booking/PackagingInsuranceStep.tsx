import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Package, Shield } from "lucide-react";

interface PackagingInsuranceStepProps {
  packagingRequired: boolean;
  insuranceRequired: boolean;
  onPackagingChange: (checked: boolean) => void;
  onInsuranceChange: (checked: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  shipmentValue: string;
}

const PackagingInsuranceStep = ({
  packagingRequired,
  insuranceRequired,
  onPackagingChange,
  onInsuranceChange,
  onNext,
  onBack,
  shipmentValue,
}: PackagingInsuranceStepProps) => {
  const packagingFee = 50;
  const insuranceFee = shipmentValue ? Math.round(parseFloat(shipmentValue) * 0.02) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start space-x-4">
          <div className="mt-1">
            <Checkbox
              id="packaging"
              checked={packagingRequired}
              onCheckedChange={onPackagingChange}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <Label htmlFor="packaging" className="text-lg font-semibold cursor-pointer">
                Professional Packaging
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Protect your shipment with professional packaging materials including bubble wrap,
              foam padding, and sturdy boxes. Recommended for fragile items.
            </p>
            <p className="text-sm font-semibold">Additional Fee: ₹{packagingFee}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start space-x-4">
          <div className="mt-1">
            <Checkbox
              id="insurance"
              checked={insuranceRequired}
              onCheckedChange={onInsuranceChange}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <Label htmlFor="insurance" className="text-lg font-semibold cursor-pointer">
                Shipment Insurance
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Protect your valuable items with comprehensive insurance coverage. Get full
              compensation in case of loss or damage during transit.
            </p>
            <p className="text-sm font-semibold">
              Coverage: Up to ₹{shipmentValue || "0"} | Premium: ₹{insuranceFee} (2% of shipment value)
            </p>
          </div>
        </div>
      </Card>

      {(packagingRequired || insuranceRequired) && (
        <Card className="p-4 bg-muted">
          <h3 className="font-semibold mb-2">Additional Charges Summary</h3>
          <div className="space-y-1 text-sm">
            {packagingRequired && (
              <div className="flex justify-between">
                <span>Professional Packaging</span>
                <span>₹{packagingFee}</span>
              </div>
            )}
            {insuranceRequired && (
              <div className="flex justify-between">
                <span>Shipment Insurance</span>
                <span>₹{insuranceFee}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Additional Charges</span>
              <span>
                ₹{(packagingRequired ? packagingFee : 0) + (insuranceRequired ? insuranceFee : 0)}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Continue to Courier Selection
        </Button>
      </div>
    </div>
  );
};

export default PackagingInsuranceStep;
