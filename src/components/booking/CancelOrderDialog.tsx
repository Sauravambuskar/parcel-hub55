import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { CANCEL_REASONS, type CancelReason } from "@/hooks/useCancelOrder";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: CancelReason) => void;
  cancelling: boolean;
}

const CancelOrderDialog = ({ open, onOpenChange, onConfirm, cancelling }: CancelOrderDialogProps) => {
  const [reason, setReason] = useState<CancelReason>("Cancelled By Customer");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this order? This action cannot be undone. A refund will be initiated if payment was collected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cancellation Reason</label>
          <Select value={reason} onValueChange={(v) => setReason(v as CancelReason)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANCEL_REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelling}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelOrderDialog;
