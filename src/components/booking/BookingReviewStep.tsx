import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, IndianRupee, Truck, CreditCard, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { computeChargeableKg } from "@/lib/pricing";

interface BookingReviewStepProps {
  senderData: {
    name: string;
    phone: string;
    flatNo?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  receiverData: {
    name: string;
    phone: string;
    flatNo?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  packageDetails: {
    goodsType: string;
    weight: string;
    dimensions: { length: string; width: string; height: string };
    shipmentValue: string;
    urgency: string;
  };
  courierDetails: {
    name: string;
    baseFare: number; // Courier price + platform fee (hidden from user)
    deliveryTime: string;
  };
  selectedDate?: Date;
  onConfirm: () => void;
  onBack: () => void;
}

const BookingReviewStep = ({
  senderData,
  receiverData,
  packageDetails,
  courierDetails,
  selectedDate,
  onConfirm,
  onBack,
}: BookingReviewStepProps) => {
  const [submitting] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Calculate GST at 18% on the base fare (which includes hidden platform fee)
  const baseFareRounded = Math.round(courierDetails.baseFare);
  const gstAmount = Math.round(baseFareRounded * 0.18);
  const totalAmount = baseFareRounded + gstAmount;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Review Your Booking</CardTitle>
        <CardDescription>
          Please review all details before confirming your order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sender Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Pickup Details</h3>
          </div>
          <div className="ml-7 space-y-1 text-sm">
            <p className="font-medium">{senderData.name}</p>
            <p className="text-muted-foreground">{senderData.phone}</p>
            <p className="text-muted-foreground">
              {[senderData.flatNo, senderData.address].filter(Boolean).join(', ')}, {senderData.city}, {senderData.state} - {senderData.pincode}
            </p>
          </div>
        </div>

        <Separator />

        {/* Receiver Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-secondary" />
            <h3 className="font-semibold">Delivery Details</h3>
          </div>
          <div className="ml-7 space-y-1 text-sm">
            <p className="font-medium">{receiverData.name}</p>
            <p className="text-muted-foreground">{receiverData.phone}</p>
            <p className="text-muted-foreground">
              {[receiverData.flatNo, receiverData.address].filter(Boolean).join(', ')}, {receiverData.city}, {receiverData.state} - {receiverData.pincode}
            </p>
          </div>
        </div>

        <Separator />

        {/* Package Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Package Information</h3>
          </div>
          <div className="ml-7 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{packageDetails.goodsType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Weight (entered)</p>
              <p className="font-medium">{packageDetails.weight} g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dimensions (L×W×H)</p>
              <p className="font-medium">
                {packageDetails.dimensions.length} × {packageDetails.dimensions.width} × {packageDetails.dimensions.height} cm
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Declared Value</p>
              <p className="font-medium">₹{packageDetails.shipmentValue}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority</p>
              <Badge variant="outline" className="capitalize">{packageDetails.urgency}</Badge>
            </div>
          </div>

          {/* Chargeable weight — single source of truth for billing.
              Dead/volumetric breakdown intentionally hidden from the user. */}
          {(() => {
            const isDocuments = packageDetails.goodsType === 'documents';
            const deadKg = (parseFloat(packageDetails.weight) || 0) / 1000;
            const { chargeableKg } = computeChargeableKg(
              deadKg,
              packageDetails.dimensions.length,
              packageDetails.dimensions.width,
              packageDetails.dimensions.height,
              { isDocument: isDocuments },
            );
            if (deadKg <= 0) return null;
            const fmt = (kg: number) => `${Math.round(kg * 1000).toLocaleString()} g`;
            return (
              <div className="ml-7 mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 flex justify-between items-center text-xs">
                <span className="font-semibold">Chargeable weight (billed)</span>
                <span className="font-bold text-primary">{fmt(chargeableKg)}</span>
              </div>
            );
          })()}
        </div>


        <Separator />

        {/* Courier & Delivery */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Courier & Schedule</h3>
          </div>
          <div className="ml-7 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Courier Service</span>
              <span className="font-medium">{courierDetails.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated Delivery</span>
              <span className="font-medium">{courierDetails.deliveryTime}</span>
            </div>
            {selectedDate && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pickup Date</span>
                <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Pricing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Payment Summary</h3>
          </div>
          <div className="ml-7 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Fare</span>
              <span>₹{Math.round(courierDetails.baseFare)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>₹{gstAmount}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total Amount</span>
              <span className="text-primary">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground">
            By confirming this booking, you agree to our terms of service and shipping policies. 
            Your package will be picked up on the selected date.
          </p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
          <p className="text-xs text-foreground">
            <strong>Pickup ETA:</strong> Once your order is placed, it will be picked up within
            the next 24–48 hours. Sit back and relax — we'll keep you posted.
          </p>
        </div>

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs text-amber-900">
            <strong>Cancellation policy:</strong> Once an order is placed and accepted by the
            courier it usually cannot be cancelled. You can still request a cancellation — if the
            courier has already picked up the shipment, our team will reach out to help resolve it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={onConfirm}
            className="w-full"
            disabled={submitting}
          >
            <CreditCard className="h-4 w-4" />
            Pay Now (₹{totalAmount})
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full" disabled={submitting}>
            Back to Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingReviewStep;
