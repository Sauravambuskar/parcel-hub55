import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id, x-api-key",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tenantId = Deno.env.get("PRAYOG_TENANT_ID");
    const apiKey = req.headers.get("x-api-key");

    if (!tenantId) {
      throw new Error("PRAYOG_TENANT_ID not configured");
    }

    if (!apiKey) {
      throw new Error("API key is required");
    }

    // Check if orderId is provided in the request body for single order details
    let orderId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json();
      orderId = body.orderId || null;
    }

    // Build the URL - either for all orders or specific order
    const baseUrl = "https://sandbox-apis.prayog.io/gateway/booking-service/orders";
    const url = orderId ? `${baseUrl}/${orderId}` : baseUrl;

    console.log("Fetching orders from Prayog API:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        "x-api-key": apiKey,
      },
    });

    const result = await response.json();

    console.log("Prayog API response status:", response.status);
    console.log("Prayog API response:", JSON.stringify(result));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch orders from Prayog", 
          details: result 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
