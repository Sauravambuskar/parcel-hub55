const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const HOLIDAYS = new Set([
  "2025-08-15", "2025-10-02", "2025-10-20", "2025-10-21",
  "2025-10-22", "2025-11-05", "2025-12-25", "2026-01-26",
  "2026-03-30", "2026-04-10", "2026-04-14", "2026-05-01",
  "2026-08-15", "2026-10-02",
]);

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDisplay(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { courier_id, base_days, origin_pincode, destination_pincode, weight_kg, booking_date } = await req.json();

    if (!courier_id || base_days == null || !origin_pincode || !booking_date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let adjusted_days = base_days;
    let base_confidence = 85;
    const risk_factors: string[] = [];

    // ADJUSTMENT 1 — Day of week
    const bookingDayOfWeek = new Date(booking_date + "T00:00:00Z").getUTCDay();
    if (bookingDayOfWeek === 6) { // Saturday
      adjusted_days += 1;
      base_confidence -= 10;
      risk_factors.push("Weekend booking (+1 day)");
    } else if (bookingDayOfWeek === 0) { // Sunday
      adjusted_days += 1;
      base_confidence -= 15;
      risk_factors.push("Sunday booking (+1 day)");
    }

    // ADJUSTMENT 2 — Indian public holidays
    if (HOLIDAYS.has(booking_date)) {
      adjusted_days += 1;
      base_confidence -= 10;
      risk_factors.push("Public holiday — next-day pickup");
    }

    // ADJUSTMENT 3 — Weather at origin
    try {
      const weatherKey = Deno.env.get("OPENWEATHER_API_KEY");
      if (weatherKey) {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${origin_pincode},IN&appid=${weatherKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const wRes = await fetch(weatherUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (wRes.ok) {
          const wData = await wRes.json();
          const main = (wData.weather?.[0]?.main || "").toLowerCase();
          const desc = (wData.weather?.[0]?.description || "").toLowerCase();

          if (main === "thunderstorm" || desc.includes("heavy rain")) {
            adjusted_days += 2;
            base_confidence -= 20;
            risk_factors.push("Severe weather at pickup location");
          } else if (["rain", "drizzle", "fog", "mist"].some(w => main.includes(w) || desc.includes(w))) {
            adjusted_days += 1;
            base_confidence -= 10;
            risk_factors.push("Adverse weather at pickup location");
          } else if (main === "clear" || desc.includes("sunny")) {
            base_confidence += 5;
          }
        }
      }
    } catch {
      // Skip weather silently
    }

    // ADJUSTMENT 4 — Courier reliability
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data: score } = await sb
        .from("courier_scores")
        .select("reliability_score, avg_delay_days")
        .eq("courier_id", courier_id)
        .maybeSingle();

      if (score) {
        if (score.reliability_score >= 90) {
          base_confidence += 5;
        } else if (score.reliability_score < 70) {
          adjusted_days += Math.round(score.avg_delay_days);
          base_confidence -= 10;
          risk_factors.push("Courier has below-average reliability");
        }
      }
    } catch {
      // Skip reliability silently
    }

    // ADJUSTMENT 5 — Weight penalty
    if (weight_kg > 10 && base_days > 2) {
      adjusted_days += 1;
      base_confidence -= 5;
      risk_factors.push("Overweight shipment — handling time added");
    }

    // FINAL CALCULATION
    adjusted_days = Math.max(1, Math.min(adjusted_days, 14));
    const final_confidence = Math.max(45, Math.min(base_confidence, 95));

    const delivery_date_earliest = addDays(booking_date, adjusted_days - 1);
    const delivery_date_latest = addDays(booking_date, adjusted_days + 1);

    // Delivery label
    let delivery_label: string;
    if (adjusted_days === 1) delivery_label = "Same Day";
    else if (adjusted_days === 2) delivery_label = "Next Day";
    else if (adjusted_days <= 4) delivery_label = "Express";
    else if (adjusted_days <= 7) delivery_label = "Standard";
    else delivery_label = "Economy";

    // Confidence label + color
    let confidence_label: string;
    let confidence_color: string;
    if (final_confidence >= 90) {
      confidence_label = "Very High";
      confidence_color = "#1A7A4A";
    } else if (final_confidence >= 75) {
      confidence_label = "Good";
      confidence_color = "#00C8C8";
    } else if (final_confidence >= 60) {
      confidence_label = "Moderate";
      confidence_color = "#D4840A";
    } else {
      confidence_label = "Low";
      confidence_color = "#C0392B";
    }

    const eta_display = `Arrives by ${formatDisplay(delivery_date_earliest)}`;
    const eta_range = `${formatDisplay(delivery_date_latest)} at the latest`;

    return new Response(
      JSON.stringify({
        courier_id,
        adjusted_days,
        delivery_date_earliest: formatDate(delivery_date_earliest),
        delivery_date_latest: formatDate(delivery_date_latest),
        delivery_label,
        confidence_score: final_confidence,
        confidence_label,
        confidence_color,
        risk_factors,
        eta_display,
        eta_range,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("predict-eta error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
