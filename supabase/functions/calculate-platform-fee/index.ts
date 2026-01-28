import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PlatformFeeRequest {
  source_pincode: string;
  destination_pincode: string;
  weight_kg?: number;
  shipment_value?: number;
}

interface PlatformFeeResponse {
  platform_fee: number;
  distance_km: number;
  distance_tier: string;
  breakdown: {
    base_fee: number;
    distance_fee: number;
    weight_surcharge: number;
  };
  explanation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source_pincode, destination_pincode, weight_kg = 1, shipment_value = 0 }: PlatformFeeRequest = await req.json();

    if (!source_pincode || !destination_pincode) {
      return new Response(
        JSON.stringify({ error: 'source_pincode and destination_pincode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      // Fallback to rule-based calculation if AI is unavailable
      return new Response(
        JSON.stringify(calculateFallbackFee(source_pincode, destination_pincode, weight_kg)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to analyze the distance and calculate dynamic platform fee
    const systemPrompt = `You are a logistics pricing analyst for ViaSetu, an Indian courier aggregator platform.

Your task is to analyze the distance between two Indian pincodes and calculate a dynamic platform fee (ViaSetu commission).

PRICING RULES:
- Base platform fee: ₹30 (minimum)
- Distance tiers:
  - Local (same city/district, <50 km): ₹30-40
  - Regional (same state, 50-300 km): ₹40-60
  - Zonal (adjacent states, 300-800 km): ₹60-80
  - National (across country, 800-1500 km): ₹80-100
  - Remote (>1500 km or hard-to-reach areas): ₹100-150

- Weight surcharge: Add ₹5 for every kg above 5kg
- High-value shipment bonus: If shipment value > ₹10,000, add ₹10

Indian Pincode Geography Reference:
- 1xxxxx: Delhi, Haryana, Punjab, HP, J&K
- 2xxxxx: UP, Uttarakhand  
- 3xxxxx: Rajasthan, Gujarat
- 4xxxxx: Maharashtra, Goa, MP, Chhattisgarh
- 5xxxxx: Andhra Pradesh, Telangana, Karnataka
- 6xxxxx: Tamil Nadu, Kerala
- 7xxxxx: West Bengal, Odisha, NE States
- 8xxxxx: Bihar, Jharkhand
- 9xxxxx: Army/Field Post

Estimate distance based on pincode prefixes and calculate appropriate fee.

IMPORTANT: Return ONLY a valid JSON object, no other text.`;

    const userPrompt = `Calculate platform fee for shipment:
- From Pincode: ${source_pincode}
- To Pincode: ${destination_pincode}
- Weight: ${weight_kg} kg
- Shipment Value: ₹${shipment_value}

Return JSON with this exact structure:
{
  "platform_fee": <total fee as number>,
  "distance_km": <estimated distance as number>,
  "distance_tier": "<Local|Regional|Zonal|National|Remote>",
  "breakdown": {
    "base_fee": <base fee number>,
    "distance_fee": <distance component number>,
    "weight_surcharge": <weight surcharge number>
  },
  "explanation": "<brief 1-line explanation>"
}`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent pricing
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('AI rate limit hit, using fallback calculation');
        return new Response(
          JSON.stringify(calculateFallbackFee(source_pincode, destination_pincode, weight_kg)),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.warn('AI payment required, using fallback calculation');
        return new Response(
          JSON.stringify(calculateFallbackFee(source_pincode, destination_pincode, weight_kg)),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify(calculateFallbackFee(source_pincode, destination_pincode, weight_kg)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('Empty AI response, using fallback');
      return new Response(
        JSON.stringify(calculateFallbackFee(source_pincode, destination_pincode, weight_kg)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the AI response - extract JSON from potential markdown code blocks
    let feeData: PlatformFeeResponse;
    try {
      // Try to extract JSON from markdown code block if present
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      feeData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify(calculateFallbackFee(source_pincode, destination_pincode, weight_kg)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the response
    if (!feeData.platform_fee || typeof feeData.platform_fee !== 'number') {
      return new Response(
        JSON.stringify(calculateFallbackFee(source_pincode, destination_pincode, weight_kg)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure fee is within reasonable bounds (₹30 - ₹200)
    feeData.platform_fee = Math.min(200, Math.max(30, Math.round(feeData.platform_fee)));

    console.log('AI calculated platform fee:', feeData);

    return new Response(
      JSON.stringify(feeData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-platform-fee:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback rule-based calculation when AI is unavailable
function calculateFallbackFee(source: string, destination: string, weightKg: number): PlatformFeeResponse {
  const sourcePrefix = source.substring(0, 1);
  const destPrefix = destination.substring(0, 1);
  
  let distanceKm: number;
  let tier: string;
  let baseFee: number;
  let distanceFee: number;

  // Same first digit = likely same zone
  if (sourcePrefix === destPrefix) {
    // Check if same city (first 3 digits)
    if (source.substring(0, 3) === destination.substring(0, 3)) {
      distanceKm = 25;
      tier = 'Local';
      baseFee = 30;
      distanceFee = 5;
    } else {
      distanceKm = 150;
      tier = 'Regional';
      baseFee = 30;
      distanceFee = 20;
    }
  } else {
    // Different zones - calculate based on digit difference
    const diff = Math.abs(parseInt(sourcePrefix) - parseInt(destPrefix));
    if (diff <= 1) {
      distanceKm = 500;
      tier = 'Zonal';
      baseFee = 30;
      distanceFee = 40;
    } else if (diff <= 3) {
      distanceKm = 1000;
      tier = 'National';
      baseFee = 30;
      distanceFee = 60;
    } else {
      distanceKm = 1800;
      tier = 'Remote';
      baseFee = 30;
      distanceFee = 90;
    }
  }

  // Weight surcharge: ₹5 per kg above 5kg
  const weightSurcharge = weightKg > 5 ? Math.round((weightKg - 5) * 5) : 0;

  const platformFee = baseFee + distanceFee + weightSurcharge;

  return {
    platform_fee: Math.min(200, Math.max(30, platformFee)),
    distance_km: distanceKm,
    distance_tier: tier,
    breakdown: {
      base_fee: baseFee,
      distance_fee: distanceFee,
      weight_surcharge: weightSurcharge,
    },
    explanation: `${tier} delivery (~${distanceKm}km): Base ₹${baseFee} + Distance ₹${distanceFee}${weightSurcharge > 0 ? ` + Weight ₹${weightSurcharge}` : ''}`,
  };
}
