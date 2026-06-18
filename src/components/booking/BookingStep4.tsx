import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Coffee } from "lucide-react";

interface BookingStep4Props {
  urgency: string;
  onInputChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const urgencyOptions = [
  {
    value: "super-urgent",
    title: "Express",
    subtitle: "Super Urgent Delivery",
    description: "Lightning fast delivery for critical packages",
    icon: Zap,
    timeframe: "Within 24 to 48 hours",
    color: "bg-destructive/10 text-destructive border-destructive/20"
  },
  {
    value: "no-rush",
    title: "Standard",
    subtitle: "No Rush Delivery", 
    description: "Economy delivery at best rates",
    icon: Coffee,
    timeframe: "2 to 4 working days",
    color: "bg-success/10 text-success border-success/20"
  }
];

const BookingStep4 = ({ urgency, onInputChange, onNext, onBack }: BookingStep4Props) => {
  const isValid = urgency;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Delivery Speed</h2>
        <p className="text-foreground font-medium">Select how quickly you need your package delivered</p>
      </div>

      <div className="grid gap-4">
        {urgencyOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = urgency === option.value;
          
          return (
            <Card 
              key={option.value}
              className={`border-2 cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onInputChange('urgency', option.value)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : option.color
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{option.title}</h3>
                    </div>
                    <p className="text-sm text-foreground font-medium mb-2">{option.description}</p>
                    <Badge variant="outline" className="text-xs">
                      Delivery: {option.timeframe}
                    </Badge>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
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

export default BookingStep4;