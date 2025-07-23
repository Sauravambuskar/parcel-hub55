import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Package, Clock, Star, ArrowLeft, Truck, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Booking = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    deliveryType: "",
    weightRange: "",
    phone: "",
    selectedSlot: ""
  });

  // Calculate convenience fee based on weight and delivery type
  const calculateConvenienceFee = () => {
    if (!formData.weightRange || !formData.deliveryType) return 0;
    const baseIntercity = 10;
    const baseInterstate = 25;
    const weightMultipliers = {
      "0-1": 1,
      "1-5": 1.5,
      "5-10": 2,
      "10+": 2.5
    };
    const base = formData.deliveryType === "intercity" ? baseIntercity : baseInterstate;
    const multiplier = weightMultipliers[formData.weightRange as keyof typeof weightMultipliers] || 1;
    return Math.round(base * multiplier);
  };

  // Generate dynamic courier pricing based on form data
  const getCouriers = () => {
    if (!formData.deliveryType || !formData.weightRange) return [];
    
    const basePrices = {
      intercity: { min: 80, max: 150 },
      interstate: { min: 200, max: 500 }
    };
    
    const weightMultipliers = {
      "0-1": 1,
      "1-5": 1.3,
      "5-10": 1.6,
      "10+": 2
    };
    
    const base = basePrices[formData.deliveryType as keyof typeof basePrices];
    const multiplier = weightMultipliers[formData.weightRange as keyof typeof weightMultipliers];
    
    return [
      {
        id: 1,
        name: "FastTrack Express",
        rating: 4.5,
        price: Math.round(base.min * multiplier),
        estimatedTime: formData.deliveryType === "intercity" ? "4-8 hours" : "1-2 days",
        description: "Reliable & fast delivery",
        slots: ["9:00 AM - 11:00 AM", "2:00 PM - 4:00 PM", "5:00 PM - 7:00 PM"]
      },
      {
        id: 2,
        name: "SpeedyLogistics",
        rating: 4.2,
        price: Math.round((base.min + base.max) / 2 * multiplier),
        estimatedTime: formData.deliveryType === "intercity" ? "6-10 hours" : "2-3 days",
        description: "Budget-friendly option",
        slots: ["10:00 AM - 12:00 PM", "3:00 PM - 5:00 PM"]
      },
      {
        id: 3,
        name: "PremiumCourier",
        rating: 4.7,
        price: Math.round(base.max * multiplier),
        estimatedTime: formData.deliveryType === "intercity" ? "2-4 hours" : "6-12 hours",
        description: "Premium same-day delivery",
        slots: ["11:00 AM - 1:00 PM", "4:00 PM - 6:00 PM", "6:00 PM - 8:00 PM"]
      }
    ];
  };

  const couriers = getCouriers();
  const convenienceFee = calculateConvenienceFee();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBooking = (courierId: number) => {
    // For MVP, just navigate to tracking with mock booking
    navigate('/tracking', { state: { bookingId: `BK${Date.now()}`, courierId } });
  };

  const isFormValid = formData.pickupAddress && formData.deliveryAddress && formData.phone && formData.deliveryType && formData.weightRange;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Book Delivery</h1>
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
            <div>
              <Label htmlFor="pickup">Pickup Address</Label>
              <Input
                id="pickup"
                placeholder="Enter pickup location in Pune"
                value={formData.pickupAddress}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="delivery">Delivery Address</Label>
              <Input
                id="delivery"
                placeholder="Enter delivery location in Pune"
                value={formData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Delivery Type</Label>
              <RadioGroup 
                value={formData.deliveryType} 
                onValueChange={(value) => handleInputChange('deliveryType', value)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intercity" id="intercity" />
                  <Label htmlFor="intercity" className="cursor-pointer">Intercity</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interstate" id="interstate" />
                  <Label htmlFor="interstate" className="cursor-pointer">Interstate</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="weight">Package Weight</Label>
              <Select value={formData.weightRange} onValueChange={(value) => handleInputChange('weightRange', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select weight range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0-1 kg</SelectItem>
                  <SelectItem value="1-5">1-5 kg</SelectItem>
                  <SelectItem value="5-10">5-10 kg</SelectItem>
                  <SelectItem value="10+">10+ kg</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Available Couriers */}
        {isFormValid && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Available Partners
            </h2>
            
            {couriers.map((courier) => (
              <Card key={courier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{courier.name}</h3>
                      <p className="text-sm text-muted-foreground">{courier.description}</p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {courier.rating}
                    </Badge>
                  </div>

                  {/* Pricing breakdown */}
                  <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Delivery charge</span>
                      <span>₹{courier.price}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Convenience fee</span>
                      <span>₹{convenienceFee}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-primary border-t pt-1">
                      <span>Total</span>
                      <span>₹{courier.price + convenienceFee}</span>
                    </div>
                  </div>

                  {/* Pickup slots */}
                  <div className="mb-3">
                    <Label className="text-sm font-medium">Select pickup slot</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {courier.slots.map((slot) => (
                        <Button
                          key={slot}
                          variant={formData.selectedSlot === slot ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleInputChange('selectedSlot', slot)}
                          className="text-xs h-8"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {courier.estimatedTime}
                    </div>
                    
                    <Button 
                      onClick={() => handleBooking(courier.id)}
                      disabled={!formData.selectedSlot}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isFormValid && (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Fill in the delivery details to see available partners</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Booking;