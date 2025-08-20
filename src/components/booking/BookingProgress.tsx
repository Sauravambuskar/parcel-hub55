import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  "Service Type",
  "Addresses", 
  "Package Details",
  "Service Options",
  "Select Courier",
  "Choose Slot"
];

const BookingProgress = ({ currentStep, totalSteps }: BookingProgressProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-sm text-muted-foreground">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </div>
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.slice(0, totalSteps).map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <div key={step} className="flex flex-col items-center relative flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    !isCompleted && !isCurrent && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 text-center max-w-16",
                  isCurrent && "text-primary font-medium",
                  isCompleted && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}>
                  {step}
                </span>
                
                {index < totalSteps - 1 && (
                  <div 
                    className={cn(
                      "absolute top-4 left-8 right-0 h-0.5 -translate-y-1/2",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingProgress;