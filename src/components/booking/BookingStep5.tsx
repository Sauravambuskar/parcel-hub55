import { Button } from "@/components/ui/button";
import CourierCard from "@/components/CourierCard";

interface Courier {
  id: number;
  name: string;
  rating: number;
  deliveryTime: string;
  basePrice: number;
  convenienceFee: number;
  vehicleType: string;
  image: string;
  features: string[];
}

interface BookingStep5Props {
  couriers: Courier[];
  selectedCourier: number | null;
  onCourierSelect: (courierId: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep5 = ({ 
  couriers, 
  selectedCourier, 
  onCourierSelect, 
  onNext, 
  onBack 
}: BookingStep5Props) => {
  const isValid = selectedCourier !== null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose Your Courier</h2>
        <p className="text-muted-foreground">Select from our trusted delivery partners</p>
      </div>

      <div className="space-y-3">
        {couriers.map((courier) => (
          <CourierCard
            key={courier.id}
            courier={courier}
            isSelected={selectedCourier === courier.id}
            onSelect={() => onCourierSelect(courier.id)}
          />
        ))}
      </div>

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

export default BookingStep5;