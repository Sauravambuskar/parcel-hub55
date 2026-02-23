import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Package, User, Users, BookmarkPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import SavedAddressPicker, { useSaveAddress } from "./SavedAddressPicker";

// Validate 10-digit phone number (digits only, no country code)
const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

const formatPhoneDisplay = (phone: string): string => {
  // Remove any non-digit characters except for display
  return phone.replace(/[^\d]/g, '').slice(0, 10);
};
import AddressAutocomplete from "./AddressAutocomplete";

interface PincodeMismatch {
  expected: string;
  actual: string;
}

interface AddressStepProps {
  senderData: {
    name: string;
    phone: string;
    flatNo: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  receiverData: {
    name: string;
    phone: string;
    flatNo: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  pickupPincode: string;
  deliveryPincode: string;
  shipmentValue: string;
  packageDescription: string;
  onSenderChange: (field: string, value: string) => void;
  onReceiverChange: (field: string, value: string) => void;
  onPackageChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onGoToStep?: (step: number) => void;
}

const AddressStep = ({
  senderData,
  receiverData,
  pickupPincode,
  deliveryPincode,
  shipmentValue,
  packageDescription,
  onSenderChange,
  onReceiverChange,
  onPackageChange,
  onNext,
  onBack,
  onGoToStep,
}: AddressStepProps) => {
  const { toast } = useToast();
  const [senderPincodeMismatch, setSenderPincodeMismatch] = useState<PincodeMismatch | null>(null);
  const [receiverPincodeMismatch, setReceiverPincodeMismatch] = useState<PincodeMismatch | null>(null);
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('other');
  const [submitted, setSubmitted] = useState(false);
  const [saveSender, setSaveSender] = useState(false);
  const [saveReceiver, setSaveReceiver] = useState(false);
  const { saveAddress } = useSaveAddress();

  // Auto-fill sender from profile when "Self" is selected
  useEffect(() => {
    if (bookingFor === 'self') {
      try {
        const prayogAuth = localStorage.getItem('prayog_auth');
        const profileData = localStorage.getItem('user_profile');
        let name = '';
        let phone = '';
        if (profileData) {
          const profile = JSON.parse(profileData);
          name = profile.full_name || '';
          phone = profile.phone || '';
        }
        if (!name && prayogAuth) {
          const auth = JSON.parse(prayogAuth);
          name = auth.name || auth.full_name || '';
          phone = phone || auth.phone || '';
        }
        if (name) onSenderChange('name', name);
        if (phone) onSenderChange('phone', formatPhoneDisplay(phone));
      } catch {}
    }
  }, [bookingFor]);

  const isSenderPhoneValid = validatePhone(senderData.phone);
  const isReceiverPhoneValid = validatePhone(receiverData.phone);

  const isSenderValid = 
    senderData.name && 
    senderData.phone && 
    isSenderPhoneValid &&
    senderData.flatNo &&
    senderData.address && 
    senderData.city && 
    senderData.state && 
    senderData.pincode;

  const isReceiverValid = 
    receiverData.name && 
    receiverData.phone && 
    isReceiverPhoneValid &&
    receiverData.flatNo &&
    receiverData.address && 
    receiverData.city && 
    receiverData.state && 
    receiverData.pincode;

  const hasPincodeMismatch = senderPincodeMismatch !== null || receiverPincodeMismatch !== null;
  const isValid = isSenderValid && isReceiverValid && !hasPincodeMismatch;

  // Get missing fields for validation messages
  const getMissingFields = () => {
    const missing: string[] = [];
    if (!senderData.name) missing.push('Sender Name');
    if (!senderData.phone) missing.push('Sender Phone');
    else if (!isSenderPhoneValid) missing.push('Valid Sender Phone');
    if (!senderData.flatNo) missing.push('Sender Flat/House No.');
    if (!senderData.address) missing.push('Sender Address');
    if (!senderData.city) missing.push('Sender City');
    if (!senderData.state) missing.push('Sender State');
    if (!receiverData.name) missing.push('Receiver Name');
    if (!receiverData.phone) missing.push('Receiver Phone');
    else if (!isReceiverPhoneValid) missing.push('Valid Receiver Phone');
    if (!receiverData.flatNo) missing.push('Receiver Flat/House No.');
    if (!receiverData.address) missing.push('Receiver Address');
    if (!receiverData.city) missing.push('Receiver City');
    if (!receiverData.state) missing.push('Receiver State');
    return missing;
  };

  const handleContinue = () => {
    setSubmitted(true);
    if (!isValid) {
      const missing = getMissingFields();
      toast({
        title: "Missing Fields",
        description: `Please fill: ${missing.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    // Save addresses if checked
    if (saveSender) {
      saveAddress({ ...senderData, label: 'Sender' });
    }
    if (saveReceiver) {
      saveAddress({ ...receiverData, label: 'Receiver' });
    }
    onNext();
  };

  const handlePhoneChange = (type: 'sender' | 'receiver', value: string) => {
    // Only allow digits, limit to 10
    const formatted = formatPhoneDisplay(value);
    if (type === 'sender') {
      onSenderChange("phone", formatted);
    } else {
      onReceiverChange("phone", formatted);
    }
  };

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

  const fieldError = (condition: boolean) => submitted && condition ? "border-destructive" : "";

  return (
    <div className="space-y-6">
      {/* Self / Someone Else Toggle */}
      <Card className="p-4">
        <Label className="text-sm font-medium mb-3 block">Sending for</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={bookingFor === 'self' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBookingFor('self')}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-1.5" /> Self
          </Button>
          <Button
            type="button"
            variant={bookingFor === 'other' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBookingFor('other')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1.5" /> Someone Else
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sender Details</h2>
          <SavedAddressPicker type="sender" onSelect={(addr) => {
            onSenderChange('name', addr.name);
            onSenderChange('phone', addr.phone);
            onSenderChange('flatNo', addr.flatNo);
            onSenderChange('address', addr.address);
            onSenderChange('city', addr.city);
            onSenderChange('state', addr.state);
          }} />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sender-name">Full Name *</Label>
              <Input
                id="sender-name"
                value={senderData.name}
                onChange={(e) => onSenderChange("name", e.target.value)}
                placeholder="Enter sender name"
                readOnly={bookingFor === 'self'}
                className={`${fieldError(!senderData.name)} ${bookingFor === 'self' ? 'bg-muted' : ''}`}
              />
              {submitted && !senderData.name && <p className="text-xs text-destructive mt-1">Name is required</p>}
            </div>
            <div>
              <Label htmlFor="sender-phone">Phone Number * (10 digits)</Label>
              <Input
                id="sender-phone"
                type="tel"
                value={senderData.phone}
                onChange={(e) => handlePhoneChange('sender', e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                readOnly={bookingFor === 'self'}
                className={`${(senderData.phone && !isSenderPhoneValid) || (submitted && !senderData.phone) ? "border-destructive" : ""} ${bookingFor === 'self' ? 'bg-muted' : ''}`}
              />
              {senderData.phone && !isSenderPhoneValid && (
                <p className="text-xs text-destructive mt-1">
                  Please enter a valid 10-digit phone number
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="sender-flatNo">Flat No./Building Name/House No. *</Label>
            <Input
              id="sender-flatNo"
              value={senderData.flatNo}
              onChange={(e) => onSenderChange("flatNo", e.target.value)}
              placeholder="Enter flat no., building name, or house no."
              className={fieldError(!senderData.flatNo)}
            />
            {submitted && !senderData.flatNo && <p className="text-xs text-destructive mt-1">Required</p>}
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
          <div className="flex items-center gap-2 mt-3">
            <Checkbox id="save-sender" checked={saveSender} onCheckedChange={(v) => setSaveSender(!!v)} />
            <Label htmlFor="save-sender" className="text-sm text-muted-foreground cursor-pointer">Save this address</Label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Receiver Details</h2>
          <SavedAddressPicker type="receiver" onSelect={(addr) => {
            onReceiverChange('name', addr.name);
            onReceiverChange('phone', addr.phone);
            onReceiverChange('flatNo', addr.flatNo);
            onReceiverChange('address', addr.address);
            onReceiverChange('city', addr.city);
            onReceiverChange('state', addr.state);
          }} />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiver-name">Full Name *</Label>
              <Input
                id="receiver-name"
                value={receiverData.name}
                onChange={(e) => onReceiverChange("name", e.target.value)}
                placeholder="Enter receiver name"
                className={fieldError(!receiverData.name)}
              />
              {submitted && !receiverData.name && <p className="text-xs text-destructive mt-1">Name is required</p>}
            </div>
            <div>
              <Label htmlFor="receiver-phone">Phone Number * (10 digits)</Label>
              <Input
                id="receiver-phone"
                type="tel"
                value={receiverData.phone}
                onChange={(e) => handlePhoneChange('receiver', e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                className={`${(receiverData.phone && !isReceiverPhoneValid) || (submitted && !receiverData.phone) ? "border-destructive" : ""}`}
              />
              {receiverData.phone && !isReceiverPhoneValid && (
                <p className="text-xs text-destructive mt-1">
                  Please enter a valid 10-digit phone number
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="receiver-flatNo">Flat No./Building Name/House No. *</Label>
            <Input
              id="receiver-flatNo"
              value={receiverData.flatNo}
              onChange={(e) => onReceiverChange("flatNo", e.target.value)}
              placeholder="Enter flat no., building name, or house no."
              className={fieldError(!receiverData.flatNo)}
            />
            {submitted && !receiverData.flatNo && <p className="text-xs text-destructive mt-1">Required</p>}
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
          <div className="flex items-center gap-2 mt-3">
            <Checkbox id="save-receiver" checked={saveReceiver} onCheckedChange={(v) => setSaveReceiver(!!v)} />
            <Label htmlFor="save-receiver" className="text-sm text-muted-foreground cursor-pointer">Save this address</Label>
          </div>
        </div>
      </Card>

      {/* Package Information Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Package Information
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="shipment-value">Shipment Value (₹)</Label>
            <Input
              id="shipment-value"
              type="number"
              value={shipmentValue}
              onChange={(e) => onPackageChange("shipmentValue", e.target.value)}
              placeholder="Enter value for insurance"
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: For insurance purposes
            </p>
          </div>

          <div>
            <Label htmlFor="package-description">Package Contents *</Label>
            <Input
              id="package-description"
              value={packageDescription}
              onChange={(e) => onPackageChange("packageDescription", e.target.value)}
              placeholder="e.g., Documents, Electronics, Clothing"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Describe the contents of your package
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default AddressStep;
