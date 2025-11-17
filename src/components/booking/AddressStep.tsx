import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  onSenderChange: (field: string, value: string) => void;
  onReceiverChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddressStep = ({
  senderData,
  receiverData,
  onSenderChange,
  onReceiverChange,
  onNext,
  onBack,
}: AddressStepProps) => {

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

  const isValid = isSenderValid && isReceiverValid;

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

          <div>
            <Label htmlFor="sender-address">Complete Address *</Label>
            <Textarea
              id="sender-address"
              value={senderData.address}
              onChange={(e) => onSenderChange("address", e.target.value)}
              placeholder="House/Flat No., Building Name, Street, Area"
              rows={3}
            />
          </div>

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
                onChange={(e) => onSenderChange("pincode", e.target.value)}
                placeholder="110001"
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

          <div>
            <Label htmlFor="receiver-address">Complete Address *</Label>
            <Textarea
              id="receiver-address"
              value={receiverData.address}
              onChange={(e) => onReceiverChange("address", e.target.value)}
              placeholder="House/Flat No., Building Name, Street, Area"
              rows={3}
            />
          </div>

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
                onChange={(e) => onReceiverChange("pincode", e.target.value)}
                placeholder="110001"
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
