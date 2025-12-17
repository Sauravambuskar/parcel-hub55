import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Truck, Phone } from "lucide-react";

interface CourierCardProps {
  courier: {
    id: number;
    name: string;
    rating: number;
    deliveryTime: string;
    basePrice: number;
    convenienceFee: number;
    vehicleType: string;
    image: string;
    features: string[];
  };
  isSelected: boolean;
  onSelect: () => void;
}

const CourierCard = ({ courier, isSelected, onSelect }: CourierCardProps) => {
  const totalPrice = courier.basePrice + courier.convenienceFee;
  const [imageError, setImageError] = useState(false);

  const hasValidImage = courier.image && courier.image !== '/placeholder.svg' && !imageError;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-primary border-primary shadow-lg' 
          : 'hover:shadow-md border-border'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-border">
              {hasValidImage ? (
                <img 
                  src={courier.image} 
                  alt={`${courier.name} logo`} 
                  className="w-10 h-10 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Truck className="h-6 w-6 text-primary" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">{courier.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span>{courier.rating}</span>
                </div>
                <span>•</span>
                <span>{courier.vehicleType}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">₹{totalPrice}</div>
            <div className="text-xs text-muted-foreground">
              Base: ₹{courier.basePrice} + Fee: ₹{courier.convenienceFee}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Delivers in {courier.deliveryTime}</span>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {courier.features.map((feature, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs"
            >
              {feature}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourierCard;