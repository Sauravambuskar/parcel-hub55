import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CURRENT_ENV } from "@/config/environment";
import {
  RefreshCw, Copy, ExternalLink, Loader2, KeyRound, CheckCircle2, Clock,
} from "lucide-react";

interface PendingRow {
  id: string;
  created_at: string;
  sender_name: string | null;
  receiver_name: string | null;
  courier_name: string | null;
  courier_price: number | null;
  payment_link_id: string | null;
  payment_link_url: string | null;
  payment_link_status: string | null;
  status: string;
  created_by_admin_email: string | null;
  sender_city: string | null;
  receiver_city: string | null;
}

const AssistedPendingBookings = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [manualDialog, setManualDialog] = useState<{ booking: PendingRow } | null>(null);
  const [manualPaymentId, setManualPaymentId] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, created_at, sender_name, receiver_name, courier_name, courier_price, payment_link_id, payment_link_url, payment_link_status, status, created_by_admin_email, sender_city, receiver_city",
      )
      .eq("is_admin_assisted", true)
      .eq("status", "PENDING_PAYMENT")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setRows((data || []) as PendingRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    const t = setInterval(fetchRows, 30_000);
    return () => clearInterval(t);
  }, []);

  const doFinalize = async (bookingId: string, manualPaymentId?: string) => {
    const { data, error } = await supabase.functions.invoke(
      "admin-finalize-assisted-booking",
      {
        body: { booking_id: bookingId, ...(manualPaymentId ? { manual_payment_id: manualPaymentId } : {}) },
        headers: { "x-environment": CURRENT_ENV },
      },
    );
    if (error) {
      toast({ title: "Refresh failed", description: error.message, variant: "destructive" });
      return null;
    }
    if (data?.paid && data?.booked) {
      toast({
        title: "Booking confirmed",
        description: data.awb_number
          ? `AWB ${data.awb_number}${data.already ? " (already booked)" : ""}`
          : "Courier booking created",
      });
    } else if (data?.paid && !data?.booked) {
      toast({
        title: "Payment received, but partner booking failed",
        description: data?.refund_id
          ? `Auto-refunded (${data.refund_id}). ${data?.error || ""}`
          : data?.error || "Please investigate.",
        variant: "destructive",
      });
    } else if (data?.paid === false) {
      toast({
        title: "Payment not received yet",
        description: `Link status: ${data.link_status || "unknown"}`,
      });
    } else if (data?.error) {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
    return data;
  };

  const handleRefresh = async (row: PendingRow) => {
    setRefreshingId(row.id);
    try {
      await doFinalize(row.id);
      await fetchRows();
    } finally {
      setRefreshingId(null);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualDialog) return;
    const pid = manualPaymentId.trim();
    if (!pid.startsWith("pay_")) {
      toast({ title: "Invalid payment ID", description: "Must start with 'pay_'", variant: "destructive" });
      return;
    }
    setSubmittingManual(true);
    try {
      await doFinalize(manualDialog.booking.id, pid);
      await fetchRows();
      setManualDialog(null);
      setManualPaymentId("");
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Pending Assisted Bookings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Admin-assisted bookings awaiting customer payment. Click <strong>Refresh</strong> to
            check Razorpay; the courier order is placed automatically once payment is received.
          </p>
        </div>
        <Button variant="outline" onClick={fetchRows} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-600" />
            No pending assisted bookings.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-base">
                      {row.sender_name || "—"} → {row.receiver_name || "—"}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {row.sender_city || "?"} → {row.receiver_city || "?"} ·{" "}
                      {row.courier_name || "—"} · ₹{Number(row.courier_price || 0).toFixed(0)}
                      {" · "}
                      created {new Date(row.created_at).toLocaleString()}
                      {row.created_by_admin_email ? ` by ${row.created_by_admin_email}` : ""}
                    </CardDescription>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Link: {row.payment_link_status || "created"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRefresh(row)}
                    disabled={refreshingId === row.id}
                  >
                    {refreshingId === row.id ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking…</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" /> Refresh payment</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setManualDialog({ booking: row }); setManualPaymentId(""); }}
                  >
                    <KeyRound className="h-4 w-4 mr-2" /> Enter payment ID
                  </Button>
                  {row.payment_link_url && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(row.payment_link_url!);
                          toast({ title: "Link copied" });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy link
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={row.payment_link_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" /> Open link
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!manualDialog} onOpenChange={(o) => { if (!o) { setManualDialog(null); setManualPaymentId(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Razorpay payment ID</DialogTitle>
            <DialogDescription>
              Use this when the customer paid but the payment link didn't get flipped to <code>paid</code>.
              We'll fetch the payment from Razorpay and, if captured, place the courier order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pay-id">Payment ID</Label>
            <Input
              id="pay-id"
              placeholder="pay_XXXXXXXXXXXXXX"
              value={manualPaymentId}
              onChange={(e) => setManualPaymentId(e.target.value)}
              disabled={submittingManual}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialog(null)} disabled={submittingManual}>
              Cancel
            </Button>
            <Button onClick={handleManualSubmit} disabled={submittingManual || !manualPaymentId.trim()}>
              {submittingManual ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
              ) : (
                <>Confirm & book</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssistedPendingBookings;
