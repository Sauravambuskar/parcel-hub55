import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-prayog-token, x-prayog-user-id",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Prayog authentication from headers
    const prayogToken = req.headers.get("x-prayog-token");
    const prayogUserId = req.headers.get("x-prayog-user-id");

    // Validate that user is authenticated with Prayog
    if (!prayogToken || !prayogUserId) {
      console.error("Missing Prayog authentication");
      return new Response(
        JSON.stringify({ error: "Authentication required. Please log in to place an order." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format (basic check - Prayog tokens are JWTs)
    const tokenParts = prayogToken.split(".");
    if (tokenParts.length !== 3) {
      console.error("Invalid Prayog token format");
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the token is not expired by decoding the payload
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const expiry = payload.exp;
      if (expiry && Date.now() >= expiry * 1000) {
        console.error("Prayog token expired");
        return new Response(
          JSON.stringify({ error: "Session expired. Please log in again." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      console.error("Failed to decode token:", e);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse booking data
    const bookingData = await req.json();
    console.log("Saving booking for user:", prayogUserId);

    // Validate required fields
    const requiredFields = [
      "sender_name", "sender_phone", "sender_address", "sender_city", "sender_state", "sender_pincode",
      "receiver_name", "receiver_phone", "receiver_address", "receiver_city", "receiver_state", "receiver_pincode",
      "goods_type", "package_weight", "courier_name", "courier_price", "delivery_time", "urgency"
    ];

    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate that user_id in booking matches authenticated user
    if (bookingData.user_id !== prayogUserId) {
      console.error("User ID mismatch:", bookingData.user_id, "vs", prayogUserId);
      return new Response(
        JSON.stringify({ error: "User ID mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert booking into database
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: prayogUserId,
        sender_name: bookingData.sender_name,
        sender_phone: bookingData.sender_phone,
        sender_address: bookingData.sender_address,
        sender_city: bookingData.sender_city,
        sender_state: bookingData.sender_state,
        sender_pincode: bookingData.sender_pincode,
        receiver_name: bookingData.receiver_name,
        receiver_phone: bookingData.receiver_phone,
        receiver_address: bookingData.receiver_address,
        receiver_city: bookingData.receiver_city,
        receiver_state: bookingData.receiver_state,
        receiver_pincode: bookingData.receiver_pincode,
        goods_type: bookingData.goods_type,
        package_weight: bookingData.package_weight,
        length: bookingData.length || null,
        width: bookingData.width || null,
        height: bookingData.height || null,
        shipment_value: bookingData.shipment_value || null,
        urgency: bookingData.urgency,
        packaging_required: bookingData.packaging_required || false,
        insurance_required: bookingData.insurance_required || false,
        courier_name: bookingData.courier_name,
        courier_price: bookingData.courier_price,
        delivery_time: bookingData.delivery_time,
        tracking_id: bookingData.tracking_id || null,
        prayog_order_id: bookingData.prayog_order_id || null,
        prayog_awb: bookingData.prayog_awb || null,
        status: bookingData.status || "pending",
        payment_id: bookingData.payment_id || null,
        payment_status: bookingData.payment_status || "pending",
        base_fare: bookingData.base_fare || 0,
        platform_fee: bookingData.platform_fee || 0,
        gst: bookingData.gst || 0,
        prayog_commission: bookingData.prayog_commission || 0,
        insurance_amount: bookingData.insurance_amount || 0,
        packaging_amount: bookingData.packaging_amount || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save booking", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Booking saved successfully:", data.id);

    return new Response(
      JSON.stringify({ success: true, booking: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
