import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingStep6Props {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onNext: () => void;
  onBack: () => void;
  totalAmount: number;
}

const BookingStep6 = ({
  selectedDate,
  onDateSelect,
  onNext,
  onBack,
  totalAmount,
}: BookingStep6Props) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const handleQuickSelect = (date: Date) => {
    onDateSelect(date);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Schedule Pickup</h2>
        <p className="text-muted-foreground">Choose when you'd like your parcel picked up</p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Select Pickup Date</h3>
        
        <div className="space-y-4">
          {/* Quick select buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? "default" : "outline"}
              onClick={() => handleQuickSelect(today)}
              className="h-16"
            >
              <div className="text-center">
                <div className="font-semibold">Today</div>
                <div className="text-xs opacity-80">{format(today, 'MMM dd')}</div>
              </div>
            </Button>
            
            <Button
              variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd') ? "default" : "outline"}
              onClick={() => handleQuickSelect(tomorrow)}
              className="h-16"
            >
              <div className="text-center">
                <div className="font-semibold">Tomorrow</div>
                <div className="text-xs opacity-80">{format(tomorrow, 'MMM dd')}</div>
              </div>
            </Button>
          </div>

          {/* Calendar picker for future dates */}
          <div className="pt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a future date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateSelect}
                  disabled={(date) => date < today}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-3 mb-4">
          <Package className="h-5 w-5 mt-1 text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!selectedDate}
          className="flex-1 h-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BookingStep6;