import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, User, Phone } from "lucide-react";
import GoogleAddressAutocomplete from "./GoogleAddressAutocomplete";

interface AddressData {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressInputStepProps {
  pickupData: AddressData;
  deliveryData: AddressData;
  onPickupChange: (field: string, value: string) => void;
  onDeliveryChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddressInputStep = ({
  pickupData,
  deliveryData,
  onPickupChange,
  onDeliveryChange,
  onNext,
  onBack,
}: AddressInputStepProps) => {
  const handlePickupAddressChange = (address: string, data: { fullAddress: string; city: string; state: string; pincode: string }) => {
    onPickupChange("address", address);
    if (data.city) onPickupChange("city", data.city);
    if (data.state) onPickupChange("state", data.state);
    if (data.pincode) onPickupChange("pincode", data.pincode);
  };

  const handleDeliveryAddressChange = (address: string, data: { fullAddress: string; city: string; state: string; pincode: string }) => {
    onDeliveryChange("address", address);
    if (data.city) onDeliveryChange("city", data.city);
    if (data.state) onDeliveryChange("state", data.state);
    if (data.pincode) onDeliveryChange("pincode", data.pincode);
  };

  const isPickupValid = pickupData.name && pickupData.phone && pickupData.address && pickupData.pincode;
  const isDeliveryValid = deliveryData.name && deliveryData.phone && deliveryData.address && deliveryData.pincode;
  const isValid = isPickupValid && isDeliveryValid;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Pickup & Delivery Address</h2>
        <p className="text-muted-foreground">Enter pickup and delivery details</p>
      </div>

      {/* Pickup Address */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <MapPin className="w-5 h-5" />
            Pickup Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" /> Sender Name *
              </Label>
              <Input
                value={pickupData.name}
                onChange={(e) => onPickupChange("name", e.target.value)}
                placeholder="Enter sender name"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone Number *
              </Label>
              <Input
                type="tel"
                value={pickupData.phone}
                onChange={(e) => onPickupChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <GoogleAddressAutocomplete
            label="Pickup Address *"
            value={pickupData.address}
            onChange={handlePickupAddressChange}
            placeholder="Search pickup address..."
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={pickupData.city} onChange={(e) => onPickupChange("city", e.target.value)} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={pickupData.state} onChange={(e) => onPickupChange("state", e.target.value)} placeholder="State" />
            </div>
            <div className="space-y-2">
              <Label>Pincode *</Label>
              <Input value={pickupData.pincode} onChange={(e) => onPickupChange("pincode", e.target.value)} placeholder="110001" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <MapPin className="w-5 h-5" />
            Delivery Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" /> Receiver Name *
              </Label>
              <Input
                value={deliveryData.name}
                onChange={(e) => onDeliveryChange("name", e.target.value)}
                placeholder="Enter receiver name"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone Number *
              </Label>
              <Input
                type="tel"
                value={deliveryData.phone}
                onChange={(e) => onDeliveryChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <GoogleAddressAutocomplete
            label="Delivery Address *"
            value={deliveryData.address}
            onChange={handleDeliveryAddressChange}
            placeholder="Search delivery address..."
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={deliveryData.city} onChange={(e) => onDeliveryChange("city", e.target.value)} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={deliveryData.state} onChange={(e) => onDeliveryChange("state", e.target.value)} placeholder="State" />
            </div>
            <div className="space-y-2">
              <Label>Pincode *</Label>
              <Input value={deliveryData.pincode} onChange={(e) => onDeliveryChange("pincode", e.target.value)} placeholder="110001" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default AddressInputStep;
