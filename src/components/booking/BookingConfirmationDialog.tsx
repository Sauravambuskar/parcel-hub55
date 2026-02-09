import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Package, Printer } from "lucide-react";

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  awbNumber: string;
  labelUrl?: string | null;
  courierName?: string;
}

const BookingConfirmationDialog = ({
  isOpen,
  onClose,
  awbNumber,
  labelUrl,
  courierName,
}: BookingConfirmationDialogProps) => {
  const handleDownloadLabel = () => {
    if (labelUrl) {
      window.open(labelUrl, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Booking Confirmed!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Your shipment has been successfully booked
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AWB Number */}
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">AWB Number</p>
            <p className="text-lg font-bold font-mono">{awbNumber}</p>
            {courierName && (
              <p className="text-xs text-muted-foreground mt-1">via {courierName}</p>
            )}
          </div>

          {/* Important Instructions */}
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-warning" />
              <h4 className="font-semibold text-sm">Important: Next Steps</h4>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>
                <span className="font-medium text-foreground">Download</span> the shipping label using the button below
              </li>
              <li>
                <span className="font-medium text-foreground">Print</span> the label on an A4 or A6 paper
              </li>
              <li>
                <span className="font-medium text-foreground">Attach</span> the printed label securely on your shipment box
              </li>
            </ol>
          </div>

          {/* Notice */}
          <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-3">
            <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> The courier will only pick up your shipment if the shipping label is clearly visible and attached to the package.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {labelUrl && (
            <Button onClick={handleDownloadLabel} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Shipping Label
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-full">
            Go to Order History
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingConfirmationDialog;
