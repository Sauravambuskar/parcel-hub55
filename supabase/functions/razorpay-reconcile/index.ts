// Admin-only reconciliation: list every captured Razorpay payment in a date
// range and join against the `bookings` table by `payment_id`. Surfaces:
//   • orphans  — captured payments with NO bookings row (lost money)
//   • mismatches — bookings row exists but status indicates failure
//   • matched  — fully reconciled
//
// Auth: requires the caller to be an active admin in admin_users.
// Razorpay creds: re-uses RAZORPAY_PROD_KEY_ID / SECRET (live env only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnvironmentFromRequest, getRazorpayConfig } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

interface RzpPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string | null;
  method: string;
  email: string | null;
  contact: string | null;
  created_at: number;
  fee: number;
  tax: number;
  amount_refunded: number;
  refund_status: string | null;
  notes: Record<string, string> | unknown[] | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: standard Supabase session (admin uses email/password login).
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the JWT and resolve the user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Service-role client for everything else
    const supabase = createClient(supabaseUrl, serviceKey);

    // Confirm admin
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id, role, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { from, to, action, payment_id, amount } = (await req.json().catch(() => ({}))) as {
      from?: string; // ISO date or unix seconds
      to?: string;
      action?: "list" | "refund" | "create_audit_row";
      payment_id?: string;
      amount?: number;
    };

    const env = getEnvironmentFromRequest(req);
    const razorpayConfig = getRazorpayConfig(env);
    if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
      return new Response(
        JSON.stringify({ error: `Razorpay not configured for ${env}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const rzpAuth = btoa(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`);

    // ── Refund action ─────────────────────────────────────────────
    if (action === "refund") {
      if (!payment_id) {
        return new Response(JSON.stringify({ error: "payment_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refundPayload: Record<string, unknown> = {};
      if (amount && amount > 0) refundPayload.amount = Math.round(amount * 100);
      refundPayload.notes = { reason: "admin_reconciliation_refund", admin_user_id: userId };

      const resp = await fetch(
        `https://api.razorpay.com/v1/payments/${payment_id}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${rzpAuth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(refundPayload),
        },
      );
      const data = await resp.json();
      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: data?.error?.description || "Refund failed", razorpay: data }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Update existing booking row if any
      await supabase
        .from("bookings")
        .update({
          payment_status: "refunded",
          refund_id: data.id,
          refund_reason: "admin_reconciliation_refund",
          status: "FAILED",
        })
        .eq("payment_id", payment_id);

      return new Response(
        JSON.stringify({
          refunded: true,
          refund_id: data.id,
          amount: data.amount / 100,
          status: data.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Create audit row for an orphan ────────────────────────────
    if (action === "create_audit_row") {
      if (!payment_id) {
        return new Response(JSON.stringify({ error: "payment_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Pull the payment from Razorpay for context
      const pResp = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}`, {
        headers: { Authorization: `Basic ${rzpAuth}` },
      });
      const pData = await pResp.json();
      if (!pResp.ok) {
        return new Response(
          JSON.stringify({ error: pData?.error?.description || "Payment not found" }),
          { status: pResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const row = {
        user_id: userId, // admin row — not a real customer row
        payment_id,
        payment_status: pData.amount_refunded >= pData.amount ? "refunded" : "paid",
        status: "ORPHAN_AUDIT",
        sender_name: "(admin audit)",
        sender_phone: pData.contact || "",
        sender_address: "Created from reconciliation",
        sender_city: "",
        sender_state: "",
        sender_pincode: "",
        receiver_name: "(unknown)",
        receiver_phone: "",
        receiver_address: "",
        receiver_city: "",
        receiver_state: "",
        receiver_pincode: "",
        goods_type: "unknown",
        package_weight: "0",
        urgency: "standard",
        courier_name: "(none)",
        courier_price: pData.amount / 100,
        delivery_time: "n/a",
        base_fare: 0,
        platform_fee: 0,
        gst: 0,
        booking_source: "admin_audit",
        refund_reason: "admin_audit_marked_resolved",
      };
      const { data: inserted, error: insertErr } = await supabase
        .from("bookings")
        .insert(row)
        .select()
        .single();
      if (insertErr) {
        return new Response(
          JSON.stringify({ error: insertErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ booking: inserted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Default: list ─────────────────────────────────────────────
    // Default range: last 14 days
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = from ? Math.floor(new Date(from).getTime() / 1000) : nowSec - 14 * 86400;
    const toSec = to ? Math.floor(new Date(to).getTime() / 1000) : nowSec;

    // Page through Razorpay /payments
    const allPayments: RzpPayment[] = [];
    let skip = 0;
    const count = 100;
    let safety = 0;
    while (safety++ < 50) {
      const url = `https://api.razorpay.com/v1/payments?from=${fromSec}&to=${toSec}&count=${count}&skip=${skip}`;
      const resp = await fetch(url, { headers: { Authorization: `Basic ${rzpAuth}` } });
      const data = await resp.json();
      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: data?.error?.description || "Razorpay list failed", razorpay: data }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const items: RzpPayment[] = data.items || [];
      allPayments.push(...items);
      if (items.length < count) break;
      skip += count;
    }

    // Only count captured (i.e. money actually moved)
    const captured = allPayments.filter((p) => p.status === "captured");

    // Pull matching bookings rows in one query
    const ids = captured.map((p) => p.id);
    const { data: bookingsRows } = await supabase
      .from("bookings")
      .select(
        "id, payment_id, payment_status, status, courier_name, courier_price, sender_name, receiver_name, created_at, refund_id, refund_reason, user_id, booking_source",
      )
      .in("payment_id", ids.length ? ids : ["__none__"]);

    const bookingByPayment = new Map<string, any>();
    (bookingsRows || []).forEach((b) => {
      if (b.payment_id) bookingByPayment.set(b.payment_id, b);
    });

    const items = captured.map((p) => {
      const booking = bookingByPayment.get(p.id) || null;
      const amountRupees = p.amount / 100;
      const refundedRupees = (p.amount_refunded || 0) / 100;
      const fullyRefunded = p.amount_refunded >= p.amount && p.amount > 0;

      let category: "matched" | "orphan" | "failed" | "refunded";
      if (fullyRefunded) {
        category = "refunded";
      } else if (!booking) {
        category = "orphan";
      } else if (
        booking.status === "FAILED" ||
        booking.status === "PAYMENT_RECEIVED" ||
        booking.payment_status === "refund_failed"
      ) {
        category = "failed";
      } else {
        category = "matched";
      }

      return {
        payment_id: p.id,
        order_id: p.order_id,
        amount: amountRupees,
        amount_refunded: refundedRupees,
        currency: p.currency,
        method: p.method,
        contact: p.contact,
        email: p.email,
        captured_at: new Date(p.created_at * 1000).toISOString(),
        category,
        booking,
      };
    });

    const summary = {
      range: {
        from: new Date(fromSec * 1000).toISOString(),
        to: new Date(toSec * 1000).toISOString(),
      },
      total_payments: captured.length,
      total_amount: items.reduce((s, i) => s + i.amount, 0),
      orphan_count: items.filter((i) => i.category === "orphan").length,
      orphan_amount: items.filter((i) => i.category === "orphan").reduce((s, i) => s + i.amount, 0),
      failed_count: items.filter((i) => i.category === "failed").length,
      failed_amount: items.filter((i) => i.category === "failed").reduce((s, i) => s + i.amount, 0),
      matched_count: items.filter((i) => i.category === "matched").length,
      refunded_count: items.filter((i) => i.category === "refunded").length,
      refunded_amount: items.reduce((s, i) => s + i.amount_refunded, 0),
    };

    return new Response(JSON.stringify({ summary, items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[razorpay-reconcile] error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
