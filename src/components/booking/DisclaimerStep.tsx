import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
interface DisclaimerStepProps {
  onNext: () => void;
  onBack: () => void;
}
const DisclaimerStep = ({
  onNext,
  onBack
}: DisclaimerStepProps) => {
  const [accepted, setAccepted] = useState(false);
  const handleContinue = () => {
    if (accepted) {
      onNext();
    }
  };
  return <Card className="mt-4 md:mt-6">
      <CardHeader className="text-center p-4 md:p-6 pb-2 md:pb-4">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-warning" />
          <CardTitle className="text-lg md:text-xl font-bold">Important Declaration</CardTitle>
        </div>
        <CardDescription className="text-xs md:text-sm">
          Please read and accept the terms before proceeding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 md:space-y-6 p-4 md:p-6 pt-0">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            By proceeding with this shipment, you confirm and declare the following:
          </AlertDescription>
        </Alert>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <p className="font-bold">I hereby declare that:</p>
            <ul className="space-y-2 list-disc list-inside text-foreground font-medium">
              <li>The shipment does not contain any prohibited, illegal, or unauthorized items</li>
              <li>The contents comply with all applicable laws and courier service regulations</li>
              <li>I have accurately declared the contents and value of the shipment</li>
              <li>The items are properly packaged to prevent damage during transit</li>
              <li>I am authorized to ship the items contained in this package</li>
              <li>I will be responsible for any customs duties or additional charges if applicable</li>
            </ul>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-bold text-primary mb-2 bg-primary-foreground text-center">Important Notice</p>
            <p className="text-sm text-foreground font-medium">
              Vaisetu is a facilitator platform that connects you with courier partners. In case of any 
              damage or stolen parcels, the courier partner will be responsible as per their policies. 
              <span className="font-medium text-foreground"> Please opt in for insurance if your package is valuable.</span>
            </p>
          </div>

          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm font-bold text-destructive mb-2">Prohibited Items Include:</p>
            <p className="text-xs text-destructive font-medium">
              Explosives, flammable materials, hazardous chemicals, illegal drugs, weapons, 
              perishable items without proper packaging, counterfeit goods, and any items 
              restricted by local or international law.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
          <Checkbox id="disclaimer-accept" checked={accepted} onCheckedChange={checked => setAccepted(checked === true)} />
          <label htmlFor="disclaimer-accept" className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
            I have read and accept the above declaration. I confirm that my shipment 
            complies with all applicable laws and regulations.
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 h-12">
            Back
          </Button>
          <Button onClick={handleContinue} disabled={!accepted} className="flex-1 h-12">
            Accept & Continue
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default DisclaimerStep;