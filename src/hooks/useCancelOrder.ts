import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_ENV } from "@/config/environment";
import { useToast } from "@/hooks/use-toast";

const CANCELLABLE_STATUSES = [
  "pending", "booked", "created", "confirmed", "new", "assigned",
  "order_confirmed", "order received",
];

export const isCancellable = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return CANCELLABLE_STATUSES.includes(status.toLowerCase());
};

export const CANCEL_REASONS = [
  "Cancelled By Customer",
  "Incorrect/ Incomplete contact info",
  "Payment Issue",
] as const;

export type CancelReason = typeof CANCEL_REASONS[number];

interface UseCancelOrderOptions {
  onSuccess?: () => void;
}

export const useCancelOrder = (options?: UseCancelOrderOptions) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const cancelOrder = async ({
    orderId,
    bookingSource,
    bookingId,
    reason,
    awb,
  }: {
    orderId: string;
    bookingSource: string;
    bookingId?: string;
    reason: CancelReason;
    awb?: string | null;
  }) => {
    setCancelling(true);
    try {
      if (bookingSource === "shadowfax_direct") {
        const { data, error } = await supabase.functions.invoke("shadowfax-cancel-order", {
          body: {
            client_order_id: orderId,
            cancel_remarks: reason,
            booking_id: bookingId,
          },
          headers: { "x-environment": CURRENT_ENV },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Failed to cancel order");
        }
      } else if (bookingSource === "delhivery_direct") {
        if (!awb) {
          throw new Error("AWB number required to cancel a Delhivery shipment");
        }
        const { data, error } = await supabase.functions.invoke("delhivery-cancel-order", {
          body: {
            waybill: awb,
            cancel_remarks: reason,
            booking_id: bookingId,
          },
          headers: { "x-environment": CURRENT_ENV },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Failed to cancel order");
        }
      } else if (bookingSource === "urbanebolt_direct") {
        if (!awb) {
          throw new Error("AWB number required to cancel an Urbanebolt shipment");
        }
        const { data, error } = await supabase.functions.invoke("urbanebolt-cancel-order", {
          body: {
            waybill: awb,
            cancel_remarks: reason,
            booking_id: bookingId,
          },
          headers: { "x-environment": CURRENT_ENV },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Failed to cancel order");
        }
      } else if (bookingSource === "xpressbees_direct") {
        if (!awb) {
          throw new Error("AWB number required to cancel an XpressBees shipment");
        }
        const { data, error } = await supabase.functions.invoke("xpressbees-cancel-order", {
          body: {
            waybill: awb,
            cancel_remarks: reason,
            booking_id: bookingId,
          },
          headers: { "x-environment": CURRENT_ENV },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Failed to cancel order");
        }
      } else {
        throw new Error(
          "This order was placed with a partner that is no longer supported. Please contact support."
        );
      }

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled. Refund will be processed if applicable.",
      });
      options?.onSuccess?.();
      return true;
    } catch (err: any) {
      console.error("Cancel order error:", err);
      toast({
        title: "Cancellation Failed",
        description: err.message || "Could not cancel the order. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setCancelling(false);
    }
  };

  return { cancelOrder, cancelling };
};
