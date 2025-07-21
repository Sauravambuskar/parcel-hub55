import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Clock, Star, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Booking = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    packageType: "",
    weight: "",
    phone: ""
  });

  // Mock courier data for Pune
  const couriers = [
    {
      id: 1,
      name: "QuickDelivery Pune",
      rating: 4.5,
      price: 45,
      estimatedTime: "2-4 hours",
      description: "Local Pune specialist"
    },
    {
      id: 2,
      name: "SpeedyLogistics",
      rating: 4.2,
      price: 52,
      estimatedTime: "1-3 hours",
      description: "Express delivery service"
    },
    {
      id: 3,
      name: "EcoTransport",
      rating: 4.7,
      price: 38,
      estimatedTime: "3-5 hours",
      description: "Eco-friendly delivery"
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBooking = (courierId: number) => {
    // For MVP, just navigate to tracking with mock booking
    navigate('/tracking', { state: { bookingId: `BK${Date.now()}`, courierId } });
  };

  const isFormValid = formData.pickupAddress && formData.deliveryAddress && formData.phone;

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="package">Package Type</Label>
                <Input
                  id="package"
                  placeholder="Documents, Food, etc."
                  value={formData.packageType}
                  onChange={(e) => handleInputChange('packageType', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  placeholder="1.5"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="mt-1"
                />
              </div>
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
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">₹{courier.price}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {courier.estimatedTime}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleBooking(courier.id)}
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