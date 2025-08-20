import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Phone } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";

interface BookingStep2Props {
  pickupAddress: string;
  deliveryAddress: string;
  phoneNumber: string;
  onInputChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep2 = ({ 
  pickupAddress, 
  deliveryAddress, 
  phoneNumber, 
  onInputChange, 
  onNext, 
  onBack 
}: BookingStep2Props) => {
  const isValid = pickupAddress && deliveryAddress && phoneNumber;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Pickup & Delivery Details</h2>
        <p className="text-muted-foreground">Enter the addresses for pickup and delivery</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationPicker
            label="Pickup Address"
            value={pickupAddress}
            onChange={(value) => onInputChange('pickupAddress', value)}
            placeholder="Enter pickup address"
          />

          <LocationPicker
            label="Delivery Address"
            value={deliveryAddress}
            onChange={(value) => onInputChange('deliveryAddress', value)}
            placeholder="Enter delivery address"
          />

          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => onInputChange('phoneNumber', e.target.value)}
                placeholder="+91 9876543210"
                className="pl-10"
              />
            </div>
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

export default BookingStep2;