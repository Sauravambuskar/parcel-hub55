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
  }: {
    orderId: string;
    bookingSource: string;
    bookingId?: string;
    reason: CancelReason;
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
      } else {
        // Prayog cancellation
        const prayogAuth = localStorage.getItem("prayog_auth");
        const authData = prayogAuth ? JSON.parse(prayogAuth) : null;

        if (!authData?.id_token) {
          throw new Error("Authentication required");
        }

        const { data, error } = await supabase.functions.invoke("prayog-cancel-order", {
          body: {
            order_id: orderId,
            auth_token: authData.id_token,
            booking_id: bookingId,
          },
          headers: { "x-environment": CURRENT_ENV },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Failed to cancel order");
        }
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
