
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ShipmentContext {
  pickupPincode: string;
  deliveryPincode: string;
  weight: string;
  goodsType: string;
  dimensions?: { length: string; width: string; height: string };
  shipmentValue?: number;
}

interface PartnerContext {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  rating?: number;
  review_count?: number;
  summary?: string;
  pros?: string[];
  cons?: string[];
  badges?: string[];
  services: Array<{
    service_name: string;
    tat_days: number;
    price: number;
    is_cod: boolean;
    insurance: boolean;
  }>;
}

interface AssistantRequest {
  messages: Message[];
  shipmentContext: ShipmentContext;
  partners: PartnerContext[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, shipmentContext, partners } = await req.json() as AssistantRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context about available partners
    const partnersInfo = partners.map(p => {
      const bestService = p.services[0];
      return `
**${p.partner_name}** (${p.partner_code})
- Rating: ${p.rating || 'N/A'}/5 (${p.review_count || 0} reviews)
- Summary: ${p.summary || 'No summary available'}
- Pros: ${(p.pros || []).join(', ') || 'N/A'}
- Cons: ${(p.cons || []).join(', ') || 'N/A'}
- Badges: ${(p.badges || []).join(', ') || 'None'}
- Best Price: ₹${bestService?.price || 'N/A'}
- Delivery: ${bestService?.tat_days || 'N/A'} days
- COD: ${bestService?.is_cod ? 'Yes' : 'No'}
- Insurance: ${bestService?.insurance ? 'Yes' : 'No'}`;
    }).join('\n');

    const systemPrompt = `You are a helpful courier selection assistant for ViaSetu, an Indian shipping aggregator platform. Your role is to help users choose the best courier partner for their shipment.

**Current Shipment Details:**
- From: ${shipmentContext.pickupPincode}
- To: ${shipmentContext.deliveryPincode}
- Weight: ${shipmentContext.weight} kg
- Package Type: ${shipmentContext.goodsType}
${shipmentContext.dimensions ? `- Dimensions: ${shipmentContext.dimensions.length}×${shipmentContext.dimensions.width}×${shipmentContext.dimensions.height} cm` : ''}
${shipmentContext.shipmentValue ? `- Value: ₹${shipmentContext.shipmentValue}` : ''}

**Available Courier Partners:**
${partnersInfo}

**Guidelines:**
1. Be concise but helpful - users are in the middle of booking
2. Recommend specific partners with clear reasons
3. Consider: price, delivery time, ratings, reliability, package type compatibility
4. For fragile items, recommend partners with good handling reviews
5. For electronics, recommend partners with insurance and careful handling
6. For documents, recommend fastest options
7. For heavy items, consider who handles weight best
8. If user asks about a specific partner, give honest pros/cons
9. You can suggest 1-3 partners, ranked by suitability
10. Use emojis sparingly for a friendly tone
11. Keep responses under 150 words unless user asks for details`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in courier-recommendation-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
