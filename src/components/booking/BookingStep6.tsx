import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";

interface BookingStep6Props {
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  onProceedToPayment: () => void;
  onBack: () => void;
  totalAmount: number;
}

const timeSlots = [
  { time: "10:00 AM", label: "Morning", available: true },
  { time: "2:00 PM", label: "Afternoon", available: true },
  { time: "4:00 PM", label: "Evening", available: true },
  { time: "6:00 PM", label: "Late Evening", available: false }
];

const BookingStep6 = ({ 
  selectedSlot, 
  onSlotSelect, 
  onProceedToPayment, 
  onBack, 
  totalAmount 
}: BookingStep6Props) => {
  const isValid = selectedSlot;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Select Pickup Time</h2>
        <p className="text-muted-foreground">Choose when we should pick up your package</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium">Today - {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedSlot === slot.time ? "default" : "outline"}
                onClick={() => slot.available && onSlotSelect(slot.time)}
                disabled={!slot.available}
                className="h-16 flex-col gap-1 relative"
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{slot.time}</span>
                </div>
                <span className="text-xs opacity-80">{slot.label}</span>
                {!slot.available && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                    Full
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Includes delivery charges and convenience fee
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button 
          onClick={onProceedToPayment} 
          disabled={!isValid}
          className="flex-1 h-12 text-base"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};

export default BookingStep6;