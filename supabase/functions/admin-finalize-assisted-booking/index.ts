// Admin-triggered: refresh the Razorpay payment status of an assisted
// (PENDING_PAYMENT) booking, and — if paid — automatically fire the correct
// direct-partner booking function so the row lands at CREATED with an AWB.
//
// Input:  { booking_id: string, manual_payment_id?: string }
// Output: { paid, booked, awb_number?, tracking_id?, label_url?, error?, link_status? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnvironmentFromRequest, getRazorpayConfig } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

const ALLOWED_ROLES = new Set(["super_admin", "operations", "support"]);

// Map partner_id / courier_name → partner booking edge function name
function pickPartnerFn(row: any): string | null {
  const pid = String(row.partner_id || "").toLowerCase();
  if (pid === "shadowfax_direct") return "shadowfax-booking";
  if (pid === "delhivery_direct") return "delhivery-booking";
  if (pid === "urbanebolt_direct") return "urbanebolt-booking";
  if (pid === "xpressbees_direct") return "xpressbees-booking";
  if (pid === "shree_maruti_direct") return "shree-maruti-booking";

  const name = String(row.courier_name || "").toLowerCase();
  if (name.includes("shadowfax")) return "shadowfax-booking";
  if (name.includes("delhivery")) return "delhivery-booking";
  if (name.includes("urbanebolt") || name.includes("urbane bolt")) return "urbanebolt-booking";
  if (name.includes("xpressbees")) return "xpressbees-booking";
  if (name.includes("shree maruti") || name.includes("shree_maruti") || name.includes("maruti")) {
    return "shree-maruti-booking";
  }
  return null;
}

function genOrderId(): string {
  const now = new Date();
  const ts = [
    now.getFullYear().toString().slice(-2),
    (now.getMonth() + 1).toString().padStart(2, "0"),
    now.getDate().toString().padStart(2, "0"),
    now.getHours().toString().padStart(2, "0"),
    now.getMinutes().toString().padStart(2, "0"),
    now.getSeconds().toString().padStart(2, "0"),
  ].join("");
  const cs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = Array.from({ length: 6 }, () => cs[Math.floor(Math.random() * cs.length)]).join("");
  return ts + rand;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Admin auth ────────────────────────────────────────────────
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: adminRow } = await admin
      .from("admin_users")
      .select("role,is_active")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!adminRow?.is_active || !ALLOWED_ROLES.has(adminRow.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Body ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const bookingId = String(body?.booking_id || "");
    const manualPaymentId = body?.manual_payment_id
      ? String(body.manual_payment_id).trim()
      : null;
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "booking_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row, error: rowErr } = await admin
      .from("bookings").select("*").eq("id", bookingId).maybeSingle();
    if (rowErr || !row) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: already booked
    if (row.status && row.status !== "PENDING_PAYMENT" && row.awb_number) {
      return new Response(JSON.stringify({
        paid: true, booked: true,
        awb_number: row.awb_number, tracking_id: row.tracking_id, label_url: row.label_url,
        already: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Razorpay lookup ───────────────────────────────────────────
    const env = getEnvironmentFromRequest(req);
    const rz = getRazorpayConfig(env);
    if (!rz.keyId || !rz.keySecret) {
      return new Response(JSON.stringify({ error: `Razorpay not configured for ${env}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const basic = btoa(`${rz.keyId}:${rz.keySecret}`);
    const rzHeaders = { Authorization: `Basic ${basic}` };

    let paymentId: string | null = null;
    let linkStatus: string | null = null;
    let paidAmountPaise: number | null = null;

    if (manualPaymentId) {
      // Manual override — fetch payment directly.
      const pRes = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(manualPaymentId)}`,
        { headers: rzHeaders },
      );
      const pText = await pRes.text();
      if (!pRes.ok) {
        return new Response(JSON.stringify({
          paid: false, error: "Razorpay payment lookup failed", details: pText,
        }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const pJson = JSON.parse(pText);
      if (pJson?.status !== "captured") {
        return new Response(JSON.stringify({
          paid: false, error: `Payment status is '${pJson?.status}', not captured`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      paymentId = pJson.id;
      paidAmountPaise = Number(pJson.amount) || null;
      linkStatus = "paid_manual";
    } else if (row.payment_link_id) {
      const lRes = await fetch(
        `https://api.razorpay.com/v1/payment_links/${encodeURIComponent(row.payment_link_id)}`,
        { headers: rzHeaders },
      );
      const lText = await lRes.text();
      if (!lRes.ok) {
        return new Response(JSON.stringify({
          paid: false, error: "Razorpay payment link lookup failed", details: lText,
        }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const lJson = JSON.parse(lText);
      linkStatus = lJson?.status || null;
      if (lJson?.status === "paid") {
        // Find captured payment in payments array.
        const payments = Array.isArray(lJson?.payments) ? lJson.payments : [];
        const captured = payments.find((p: any) =>
          p?.status === "captured" || p?.status === "paid"
        );
        if (captured?.payment_id) {
          paymentId = captured.payment_id;
          paidAmountPaise = Number(captured.amount) || null;
        }
      }
      if (!paymentId) {
        // Not paid (or paid but payment_id missing from list) → surface status.
        await admin.from("bookings")
          .update({ payment_link_status: linkStatus || row.payment_link_status })
          .eq("id", bookingId);
        return new Response(JSON.stringify({
          paid: false, link_status: linkStatus,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      return new Response(JSON.stringify({
        error: "Booking has no payment_link_id and no manual_payment_id was provided",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Sanity: amount should match the booking total (within 1 rupee).
    if (paidAmountPaise && row.courier_price) {
      const expected = Math.round(Number(row.courier_price) * 100);
      if (Math.abs(paidAmountPaise - expected) > 100) {
        console.warn(
          "[admin-finalize] amount mismatch",
          { paidAmountPaise, expected, booking_id: bookingId },
        );
      }
    }

    // ── Mark PAYMENT_RECEIVED ─────────────────────────────────────
    await admin.from("bookings").update({
      payment_id: paymentId,
      payment_status: "paid",
      status: "PAYMENT_RECEIVED",
      payment_link_status: "paid",
    }).eq("id", bookingId);

    // ── Fire partner booking ──────────────────────────────────────
    const partnerFn = pickPartnerFn(row);
    if (!partnerFn) {
      return new Response(JSON.stringify({
        paid: true, booked: false,
        error: `Cannot determine partner for courier '${row.courier_name}'. Manual booking required.`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orderId = genOrderId();
    const partnerPayload = {
      order_id: orderId,
      sender_name: row.sender_name,
      sender_phone: row.sender_phone,
      sender_address: row.sender_address,
      sender_pincode: row.sender_pincode,
      sender_city: row.sender_city,
      sender_state: row.sender_state,
      receiver_name: row.receiver_name,
      receiver_phone: row.receiver_phone,
      receiver_address: row.receiver_address,
      receiver_pincode: row.receiver_pincode,
      receiver_city: row.receiver_city,
      receiver_state: row.receiver_state,
      package_weight: parseFloat(String(row.package_weight || "1")) || 1,
      goods_type: row.goods_type || "Package",
      shipment_value: row.shipment_value ? Number(row.shipment_value) : 0,
      length: row.length ? parseFloat(String(row.length)) : 10,
      width: row.width ? parseFloat(String(row.width)) : 10,
      height: row.height ? parseFloat(String(row.height)) : 10,
      service_code: row.service_code || undefined,
    };

    const fnUrl = `${supabaseUrl}/functions/v1/${partnerFn}`;
    const partnerRes = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        "x-environment": env,
      },
      body: JSON.stringify(partnerPayload),
    });
    const partnerText = await partnerRes.text();
    let partnerJson: any;
    try { partnerJson = JSON.parse(partnerText); } catch { partnerJson = { raw: partnerText }; }

    if (!partnerRes.ok || !partnerJson?.success) {
      // Auto-refund on partner failure.
      const errDetail = partnerJson?.error || partnerJson?.message || partnerText.slice(0, 500);
      let refundId: string | null = null;
      try {
        const refRes = await fetch(
          `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId!)}/refund`,
          { method: "POST", headers: { ...rzHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ speed: "normal" }) },
        );
        const refText = await refRes.text();
        if (refRes.ok) {
          try { refundId = JSON.parse(refText)?.id || null; } catch { /* ignore */ }
        } else {
          console.error("[admin-finalize] refund failed:", refText);
        }
      } catch (e) {
        console.error("[admin-finalize] refund threw:", e);
      }

      await admin.from("bookings").update({
        status: "FAILED",
        payment_status: refundId ? "refunded" : "paid",
        failure_reason: `Partner booking failed: ${errDetail}`.slice(0, 500),
        refund_id: refundId,
        refund_status: refundId ? "processed" : "failed",
      }).eq("id", bookingId);

      return new Response(JSON.stringify({
        paid: true, booked: false,
        error: `Partner booking failed: ${errDetail}`,
        refund_id: refundId,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const awb = partnerJson.awbNumber || null;
    const labelUrl = partnerJson.label_url || partnerJson.labelUrl || null;
    const trackingId = awb || partnerJson.orderId || orderId;

    const { data: updated } = await admin.from("bookings").update({
      status: "CREATED",
      awb_number: awb,
      tracking_id: trackingId,
      label_url: labelUrl,
      order_id: orderId,
      booking_source: "admin_assisted",
    }).eq("id", bookingId).select().single();

    // Trigger admin notification email (best-effort).
    try {
      fetch(`${supabaseUrl}/functions/v1/send-order-admin-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      }).catch(() => { /* fire-and-forget */ });
    } catch { /* ignore */ }

    return new Response(JSON.stringify({
      paid: true, booked: true,
      awb_number: awb, tracking_id: trackingId, label_url: labelUrl,
      booking: updated,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[admin-finalize-assisted-booking] error:", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
