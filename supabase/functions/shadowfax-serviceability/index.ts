import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pickup_pincode, delivery_pincode } = await req.json();

    if (!pickup_pincode || !delivery_pincode) {
      return new Response(
        JSON.stringify({ error: "pickup_pincode and delivery_pincode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if both pincodes exist in shadowfax_pincodes table
    const { data: pincodes, error } = await supabase
      .from("shadowfax_pincodes")
      .select("pincode, city, state, region, hub")
      .in("pincode", [pickup_pincode, delivery_pincode])
      .eq("is_active", true);

    if (error) {
      console.error("DB query error:", error);
      return new Response(
        JSON.stringify({ is_serviceable: false, error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pickupFound = pincodes?.find((p) => p.pincode === pickup_pincode);
    const deliveryFound = pincodes?.find((p) => p.pincode === delivery_pincode);
    const isServiceable = !!pickupFound && !!deliveryFound;

    if (!isServiceable) {
      return new Response(
        JSON.stringify({
          is_serviceable: false,
          pickup_serviceable: !!pickupFound,
          delivery_serviceable: !!deliveryFound,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return normalized partner object matching Prayog's shape
    const partner = {
      partner_id: "shadowfax_direct",
      partner_code: "shadowfax",
      partner_name: "Shadowfax",
      is_serviceable: true,
      rating: 4.2,
      services: [
        {
          service_code: "sfx_reverse_pickup",
          service_name: "Shadowfax Delivery",
          tat_days: 3,
          delivery_modes: { express: false, standard: true },
          is_cod: true,
          insurance: false,
          rate: {
            rate_id: "sfx_rate_direct",
            price: { amount: 0, currency: "INR" },
          },
        },
      ],
      metadata: {
        pickup_hub: pickupFound.hub,
        delivery_hub: deliveryFound.hub,
        pickup_city: pickupFound.city,
        delivery_city: deliveryFound.city,
      },
    };

    return new Response(
      JSON.stringify({ is_serviceable: true, partner }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Serviceability error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
