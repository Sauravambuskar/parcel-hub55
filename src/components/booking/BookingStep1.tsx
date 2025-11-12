import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Package } from "lucide-react";

interface BookingStep1Props {
  onNext: (shipmentType: 'domestic' | 'international') => void;
}

const BookingStep1 = ({ onNext }: BookingStep1Props) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Start Your Booking</h2>
        <p className="text-muted-foreground">Domestic delivery service within India</p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Domestic Delivery</h3>
              <p className="text-sm text-muted-foreground">Send packages within India</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">Standard</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Express</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => onNext('domestic')} className="w-full h-12">
        Continue to Location Details
      </Button>
    </div>
  );
};

export default BookingStep1;