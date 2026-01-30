import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
interface BookingProgressProps {
  currentStep: number;
  totalSteps: number;
}
const steps = ["Service Type", "Addresses", "Package Details", "Select Courier", "Contact Details", "Disclaimer", "Review"];
const BookingProgress = ({
  currentStep,
  totalSteps
}: BookingProgressProps) => {
  const progressPercentage = (currentStep - 1) / (totalSteps - 1) * 100;
  return <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-sm font-medium text-primary">
          {Math.round(currentStep / totalSteps * 100)}% Complete
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{
        width: `${progressPercentage}%`
      }} />
        <div className="absolute left-0 top-0 h-full bg-primary/50 rounded-full animate-pulse" style={{
        width: `${progressPercentage}%`
      }} />
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.slice(0, totalSteps).map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          return <div key={step} className="flex flex-col items-center relative flex-1">
                {/* Connecting Line */}
                {index < totalSteps - 1 && <div className={cn("absolute top-4 left-[50%] right-[-50%] h-0.5 -translate-y-1/2 transition-colors duration-500", isCompleted ? "bg-primary" : "bg-muted")} />}
                
                {/* Step Circle */}
                <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-300 leading-none", isCompleted && "bg-secondary border-secondary text-primary scale-100", isCurrent && "border-primary bg-secondary text-primary scale-110 shadow-[0_0_15px_hsl(180_100%_75%/0.4)]", !isCompleted && !isCurrent && "border-muted bg-secondary text-primary")}>
                  {isCompleted ? <CheckCircle className="w-4 h-4 animate-in" /> : <span className={cn("flex items-center justify-center w-full h-full", isCurrent && "animate-pulse")}>{stepNumber}</span>}
                </div>
                
                {/* Step Label */}
                <span className={cn("text-xs mt-2 text-center px-2 py-1 rounded-md transition-colors duration-300 text-primary-foreground bg-primary-glow", isCurrent && "font-semibold", isCompleted && "font-medium")}>
                  {step}
                </span>
              </div>;
        })}
        </div>
      </div>
    </div>;
};
export default BookingProgress;