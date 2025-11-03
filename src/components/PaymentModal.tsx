import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Banknote,
  Lock,
  CheckCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: {
    courierId: number;
    courierName: string;
    basePrice: number;
    convenienceFee: number;
    pickupDate?: string;
  };
  onPaymentSuccess: (paymentMethod: string) => void;
}

const PaymentModal = ({ isOpen, onClose, orderDetails, onPaymentSuccess }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const totalAmount = orderDetails.basePrice + orderDetails.convenienceFee;

  const paymentOptions = [
    {
      id: 'upi',
      label: 'UPI Payment',
      icon: Smartphone,
      description: 'Pay using UPI apps like GPay, PhonePe, Paytm'
    },
    {
      id: 'wallet',
      label: 'Digital Wallet',
      icon: Wallet,
      description: 'Paytm, Amazon Pay, Mobikwik'
    },
    {
      id: 'card',
      label: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay'
    },
    {
      id: 'cash',
      label: 'Cash on Pickup',
      icon: Banknote,
      description: 'Pay cash when courier arrives'
    }
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(paymentMethod);
      onClose();
      
      toast({
        title: "Payment Successful!",
        description: `Order confirmed with ${orderDetails.courierName}`,
        action: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
        ),
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Courier Partner</span>
                <span className="font-medium">{orderDetails.courierName}</span>
              </div>
              {orderDetails.pickupDate && (
                <div className="flex justify-between text-sm">
                  <span>Pickup Date</span>
                  <span className="font-medium">
                    {new Date(orderDetails.pickupDate).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Base Delivery Charge</span>
                <span>₹{orderDetails.basePrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Convenience Fee</span>
                <span>₹{orderDetails.convenienceFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {paymentOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.id} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={option.id} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
            <Lock className="h-3 w-3" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : `Pay ₹${totalAmount}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;