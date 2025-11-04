import { Button } from "@/components/ui/button";
import CourierCard from "@/components/CourierCard";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import React from "react";

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
  const [selectedServiceType, setSelectedServiceType] = React.useState<string>('all');
  const [selectedServiceMode, setSelectedServiceMode] = React.useState<string>('all');

  // Extract unique service types and modes from couriers
  const serviceTypes = React.useMemo(() => {
    const types = new Set<string>();
    couriers.forEach(courier => {
      // Extract service type from courier name (e.g., "DELHIVERY - ECONOMY")
      const parts = courier.name.split(' - ');
      if (parts.length > 1) {
        types.add(parts[1]);
      }
    });
    return Array.from(types);
  }, [couriers]);

  const serviceModes = React.useMemo(() => {
    const modes = new Set<string>();
    couriers.forEach(courier => {
      if (courier.vehicleType) {
        modes.add(courier.vehicleType);
      }
    });
    return Array.from(modes);
  }, [couriers]);

  // Filter couriers based on selected filters
  const filteredCouriers = React.useMemo(() => {
    return couriers.filter(courier => {
      const serviceTypeMatch = selectedServiceType === 'all' || 
        courier.name.includes(selectedServiceType);
      
      const serviceModeMatch = selectedServiceMode === 'all' || 
        courier.vehicleType === selectedServiceMode;
      
      return serviceTypeMatch && serviceModeMatch;
    });
  }, [couriers, selectedServiceType, selectedServiceMode]);

  const handleServiceTypeChange = (type: string) => {
    setSelectedServiceType(type);
    // Reset courier selection when filter changes
    if (selectedCourier && !filteredCouriers.find(c => c.id === selectedCourier)) {
      onCourierSelect(filteredCouriers[0]?.id);
    }
  };

  const handleServiceModeChange = (mode: string) => {
    setSelectedServiceMode(mode);
    // Reset courier selection when filter changes
    if (selectedCourier && !filteredCouriers.find(c => c.id === selectedCourier)) {
      onCourierSelect(filteredCouriers[0]?.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose Your Courier</h2>
        <p className="text-muted-foreground">Select from our trusted delivery partners</p>
      </div>

      {/* Service Type Filters */}
      {serviceTypes.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            <span>Service Type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedServiceType === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleServiceTypeChange('all')}
            >
              All Services
            </Badge>
            {serviceTypes.map((type) => (
              <Badge
                key={type}
                variant={selectedServiceType === type ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2"
                onClick={() => handleServiceTypeChange(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Service Mode Filters */}
      {serviceModes.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            <span>Delivery Mode</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedServiceMode === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleServiceModeChange('all')}
            >
              All Modes
            </Badge>
            {serviceModes.map((mode) => (
              <Badge
                key={mode}
                variant={selectedServiceMode === mode ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2"
                onClick={() => handleServiceModeChange(mode)}
              >
                {mode}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Couriers List */}
      <div className="space-y-3">
        {filteredCouriers.length > 0 ? (
          filteredCouriers.map((courier) => (
            <CourierCard
              key={courier.id}
              courier={courier}
              isSelected={selectedCourier === courier.id}
              onSelect={() => onCourierSelect(courier.id)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No couriers available for the selected filters. Try adjusting your filters.
          </div>
        )}
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