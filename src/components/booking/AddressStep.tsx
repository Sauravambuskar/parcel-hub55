import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import AddressAutocomplete from "./AddressAutocomplete";

interface PincodeMismatch {
  expected: string;
  actual: string;
}

interface AddressStepProps {
  senderData: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  receiverData: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  pickupPincode: string;
  deliveryPincode: string;
  onSenderChange: (field: string, value: string) => void;
  onReceiverChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onGoToStep?: (step: number) => void;
}

const AddressStep = ({
  senderData,
  receiverData,
  pickupPincode,
  deliveryPincode,
  onSenderChange,
  onReceiverChange,
  onNext,
  onBack,
  onGoToStep,
}: AddressStepProps) => {
  const [senderPincodeMismatch, setSenderPincodeMismatch] = useState<PincodeMismatch | null>(null);
  const [receiverPincodeMismatch, setReceiverPincodeMismatch] = useState<PincodeMismatch | null>(null);

  const isSenderValid = 
    senderData.name && 
    senderData.phone && 
    senderData.address && 
    senderData.city && 
    senderData.state && 
    senderData.pincode;

  const isReceiverValid = 
    receiverData.name && 
    receiverData.phone && 
    receiverData.address && 
    receiverData.city && 
    receiverData.state && 
    receiverData.pincode;

  const hasPincodeMismatch = senderPincodeMismatch !== null || receiverPincodeMismatch !== null;
  const isValid = isSenderValid && isReceiverValid && !hasPincodeMismatch;

  const handleSenderAddressSelect = (components: { address: string; city?: string; state?: string; pincode?: string }) => {
    onSenderChange("address", components.address);
    if (components.city) onSenderChange("city", components.city);
    if (components.state) onSenderChange("state", components.state);
    
    // Check pincode mismatch
    if (components.pincode) {
      if (components.pincode !== pickupPincode) {
        setSenderPincodeMismatch({
          expected: pickupPincode,
          actual: components.pincode,
        });
      } else {
        setSenderPincodeMismatch(null);
      }
    }
  };

  const handleReceiverAddressSelect = (components: { address: string; city?: string; state?: string; pincode?: string }) => {
    onReceiverChange("address", components.address);
    if (components.city) onReceiverChange("city", components.city);
    if (components.state) onReceiverChange("state", components.state);
    
    // Check pincode mismatch
    if (components.pincode) {
      if (components.pincode !== deliveryPincode) {
        setReceiverPincodeMismatch({
          expected: deliveryPincode,
          actual: components.pincode,
        });
      } else {
        setReceiverPincodeMismatch(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sender Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sender-name">Full Name *</Label>
              <Input
                id="sender-name"
                value={senderData.name}
                onChange={(e) => onSenderChange("name", e.target.value)}
                placeholder="Enter sender name"
              />
            </div>
            <div>
              <Label htmlFor="sender-phone">Phone Number *</Label>
              <Input
                id="sender-phone"
                type="tel"
                value={senderData.phone}
                onChange={(e) => onSenderChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <AddressAutocomplete
            id="sender-address"
            label="Complete Address *"
            value={senderData.address}
            onChange={(value) => {
              onSenderChange("address", value);
              // Clear mismatch when user manually types
              setSenderPincodeMismatch(null);
            }}
            onAddressSelect={handleSenderAddressSelect}
            placeholder="Start typing address..."
          />

          {senderPincodeMismatch && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Pincode Mismatch</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  The address you selected has pincode <strong>{senderPincodeMismatch.actual}</strong>, 
                  but you entered <strong>{senderPincodeMismatch.expected}</strong> for pickup.
                </p>
                <p className="text-sm">
                  Please select an address within pincode {senderPincodeMismatch.expected} or go back to update the pincode.
                </p>
                <Button variant="outline" size="sm" onClick={() => onGoToStep?.(2)} className="mt-2">
                  Go Back to Change Pincode
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sender-city">City *</Label>
              <Input
                id="sender-city"
                value={senderData.city}
                onChange={(e) => onSenderChange("city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="sender-state">State *</Label>
              <Input
                id="sender-state"
                value={senderData.state}
                onChange={(e) => onSenderChange("state", e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="sender-pincode">Pincode *</Label>
              <Input
                id="sender-pincode"
                value={senderData.pincode}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Receiver Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiver-name">Full Name *</Label>
              <Input
                id="receiver-name"
                value={receiverData.name}
                onChange={(e) => onReceiverChange("name", e.target.value)}
                placeholder="Enter receiver name"
              />
            </div>
            <div>
              <Label htmlFor="receiver-phone">Phone Number *</Label>
              <Input
                id="receiver-phone"
                type="tel"
                value={receiverData.phone}
                onChange={(e) => onReceiverChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <AddressAutocomplete
            id="receiver-address"
            label="Complete Address *"
            value={receiverData.address}
            onChange={(value) => {
              onReceiverChange("address", value);
              // Clear mismatch when user manually types
              setReceiverPincodeMismatch(null);
            }}
            onAddressSelect={handleReceiverAddressSelect}
            placeholder="Start typing address..."
          />

          {receiverPincodeMismatch && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Pincode Mismatch</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  The address you selected has pincode <strong>{receiverPincodeMismatch.actual}</strong>, 
                  but you entered <strong>{receiverPincodeMismatch.expected}</strong> for delivery.
                </p>
                <p className="text-sm">
                  Please select an address within pincode {receiverPincodeMismatch.expected} or go back to update the pincode.
                </p>
                <Button variant="outline" size="sm" onClick={() => onGoToStep?.(2)} className="mt-2">
                  Go Back to Change Pincode
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="receiver-city">City *</Label>
              <Input
                id="receiver-city"
                value={receiverData.city}
                onChange={(e) => onReceiverChange("city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="receiver-state">State *</Label>
              <Input
                id="receiver-state"
                value={receiverData.state}
                onChange={(e) => onReceiverChange("state", e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="receiver-pincode">Pincode *</Label>
              <Input
                id="receiver-pincode"
                value={receiverData.pincode}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
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

export default AddressStep;
