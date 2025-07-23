import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Package, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LocationPicker from "@/components/LocationPicker";
import CourierCard from "@/components/CourierCard";
import PaymentModal from "@/components/PaymentModal";

const Booking = () => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();

  // Calculate convenience fee based on weight and delivery type
  const calculateConvenienceFee = () => {
    if (!packageWeight || !deliveryType) return 0;
    
    const baseIntercity = 15;
    const baseInterstate = 30;
    const weightMultipliers = {
      "light": 1,
      "medium": 1.5,
      "heavy": 2
    };
    
    const base = deliveryType === "intercity" ? baseIntercity : baseInterstate;
    const multiplier = weightMultipliers[packageWeight as keyof typeof weightMultipliers] || 1;
    return Math.round(base * multiplier);
  };

  const getCouriers = () => {
    const basePrice = deliveryType === 'interstate' ? 120 : 80;
    const weightMultiplier = packageWeight === 'heavy' ? 1.5 : packageWeight === 'medium' ? 1.2 : 1;
    const convenienceFee = calculateConvenienceFee();
    
    return [
      {
        id: 1,
        name: "BlueDart Express",
        rating: 4.6,
        deliveryTime: deliveryType === 'interstate' ? '2-3 days' : '4-6 hours',
        basePrice: Math.round(basePrice * weightMultiplier),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Real-time tracking', 'Insurance included', 'SMS updates']
      },
      {
        id: 2,
        name: "DTDC Courier",
        rating: 4.3,
        deliveryTime: deliveryType === 'interstate' ? '3-4 days' : '6-8 hours',
        basePrice: Math.round((basePrice * weightMultiplier) * 0.9),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Affordable rates', 'Wide network', 'COD available']
      },
      {
        id: 3,
        name: "Delhivery Express",
        rating: 4.4,
        deliveryTime: deliveryType === 'interstate' ? '2-3 days' : '4-6 hours',
        basePrice: Math.round((basePrice * weightMultiplier) * 0.95),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Fast delivery', 'Live tracking', 'Safe handling']
      },
      {
        id: 4,
        name: "SpeedPost",
        rating: 4.2,
        deliveryTime: deliveryType === 'interstate' ? '3-5 days' : '6-10 hours',
        basePrice: Math.round((basePrice * weightMultiplier) * 0.8),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Government backed', 'Nationwide reach', 'Budget friendly']
      },
      {
        id: 5,
        name: "Ecom Express",
        rating: 4.5,
        deliveryTime: deliveryType === 'interstate' ? '2-4 days' : '5-7 hours',
        basePrice: Math.round((basePrice * weightMultiplier) * 1.1),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['E-commerce focus', 'Quick pickup', 'Flexible delivery']
      }
    ];
  };

  const handleInputChange = (field: string, value: string) => {
    switch(field) {
      case 'pickupAddress':
        setPickupAddress(value);
        break;
      case 'deliveryAddress':
        setDeliveryAddress(value);
        break;
      case 'deliveryType':
        setDeliveryType(value);
        break;
      case 'packageWeight':
        setPackageWeight(value);
        break;
      case 'phoneNumber':
        setPhoneNumber(value);
        break;
    }
  };

  const handleCourierSelect = (courierId: number) => {
    setSelectedCourier(courierId);
    setSelectedSlot(''); // Reset slot when changing courier
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleProceedToPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentMethod: string) => {
    const selectedCourierData = getCouriers().find(c => c.id === selectedCourier);
    navigate('/tracking', { 
      state: { 
        orderId: `STU${Date.now().toString().slice(-6)}`,
        courier: selectedCourierData?.name,
        pickupAddress,
        deliveryAddress,
        paymentMethod,
        pickupSlot: selectedSlot
      } 
    });
  };

  const isFormValid = pickupAddress && deliveryAddress && deliveryType && packageWeight && phoneNumber;
  const selectedCourierData = selectedCourier ? getCouriers().find(c => c.id === selectedCourier) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Book Delivery</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Delivery Details Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Delivery Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pickup Address */}
            <LocationPicker
              label="Pickup Address"
              value={pickupAddress}
              onChange={(value) => handleInputChange('pickupAddress', value)}
              placeholder="Enter pickup address"
            />

            {/* Delivery Address */}
            <LocationPicker
              label="Delivery Address"
              value={deliveryAddress}
              onChange={(value) => handleInputChange('deliveryAddress', value)}
              placeholder="Enter delivery address"
            />

            {/* Delivery Type */}
            <div className="space-y-2">
              <Label>Delivery Type</Label>
              <Select value={deliveryType} onValueChange={(value) => handleInputChange('deliveryType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intercity">Intercity (Within same state)</SelectItem>
                  <SelectItem value="interstate">Interstate (Across states)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Package Weight */}
            <div className="space-y-2">
              <Label>Package Weight</Label>
              <Select value={packageWeight} onValueChange={(value) => handleInputChange('packageWeight', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light (0-2 kg)</SelectItem>
                  <SelectItem value="medium">Medium (2-10 kg)</SelectItem>
                  <SelectItem value="heavy">Heavy (10+ kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Package Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Package Description (Optional)</Label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="description"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="e.g., Documents, Electronics, Clothing"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+91 9876543210"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Couriers */}
        {isFormValid && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Courier Partners</h2>
            <div className="space-y-3">
              {getCouriers().map((courier) => (
                <CourierCard
                  key={courier.id}
                  courier={courier}
                  isSelected={selectedCourier === courier.id}
                  onSelect={() => handleCourierSelect(courier.id)}
                />
              ))}
            </div>

            {/* Pickup Slot Selection */}
            {selectedCourier && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select Pickup Slot</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['10:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'].map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          onClick={() => handleSlotSelect(slot)}
                          className="h-12"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Proceed to Payment */}
            {selectedCourier && selectedSlot && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-2xl font-bold">
                        ₹{selectedCourierData ? selectedCourierData.basePrice + selectedCourierData.convenienceFee : 0}
                      </span>
                    </div>
                    <Button 
                      onClick={handleProceedToPayment}
                      className="w-full h-12"
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Placeholder when form not valid */}
        {!isFormValid && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Send Your Package?</h3>
              <p className="text-muted-foreground">
                Fill in the delivery details above to see available courier partners and pricing
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      {selectedCourierData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderDetails={{
            courierId: selectedCourier!,
            courierName: selectedCourierData.name,
            basePrice: selectedCourierData.basePrice,
            convenienceFee: selectedCourierData.convenienceFee,
            pickupSlot: selectedSlot
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Booking;