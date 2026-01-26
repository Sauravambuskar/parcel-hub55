import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerRatingRequest {
  partners: Array<{
    partner_code: string;
    partner_name: string;
  }>;
}

interface RatingResult {
  partner_code: string;
  rating: number;
  review_count: number;
  summary: string;
  pros: string[];
  cons: string[];
  badges: string[];
  rating_source: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partners } = await req.json() as PartnerRatingRequest;

    if (!partners || !Array.isArray(partners) || partners.length === 0) {
      return new Response(
        JSON.stringify({ error: "Partners array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for caching
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check cache first - ratings less than 24 hours old
    const partnerCodes = partners.map(p => p.partner_code);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: cachedRatings, error: cacheError } = await supabase
      .from("partner_ratings")
      .select("*")
      .in("partner_code", partnerCodes)
      .gte("last_fetched_at", twentyFourHoursAgo);

    if (cacheError) {
      console.error("Cache lookup error:", cacheError);
    }

    const cachedMap = new Map(
      (cachedRatings || []).map(r => [r.partner_code, r])
    );

    // Find partners that need fresh ratings
    const partnersToFetch = partners.filter(p => !cachedMap.has(p.partner_code));

    const results: RatingResult[] = [];

    // Add cached results
    for (const [code, cached] of cachedMap) {
      results.push({
        partner_code: code,
        rating: cached.rating,
        review_count: cached.review_count,
        summary: cached.summary,
        pros: cached.pros || [],
        cons: cached.cons || [],
        badges: cached.badges || [],
        rating_source: cached.rating_source,
      });
    }

    // Fetch fresh ratings for uncached partners
    if (partnersToFetch.length > 0) {
      const partnerList = partnersToFetch
        .map(p => `- ${p.partner_name} (code: ${p.partner_code})`)
        .join("\n");

      const systemPrompt = `You are a courier service rating analyst for the Indian logistics market. 
Your task is to provide accurate, up-to-date ratings and reviews for courier companies based on publicly available information.

For each courier company, analyze:
1. Customer satisfaction scores from review platforms (Google, Trustpilot, MouthShut, etc.)
2. Industry reputation and reliability
3. Common praise points (pros)
4. Common complaints (cons)
5. Notable badges/awards they deserve

Return structured data using the provided tool.`;

      const userPrompt = `Analyze and provide ratings for these Indian courier companies:
${partnerList}

For each, provide:
- A rating from 1.0 to 5.0 (one decimal place)
- Estimated review count (from major platforms combined)
- A brief 1-2 sentence summary
- 2-3 key pros
- 2-3 key cons
- Relevant badges like "Top Rated", "Best Value", "Fastest Delivery", "Best for Electronics", "Reliable", "Budget Friendly"`;

      try {
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
            tools: [
              {
                type: "function",
                function: {
                  name: "submit_ratings",
                  description: "Submit courier partner ratings analysis",
                  parameters: {
                    type: "object",
                    properties: {
                      ratings: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            partner_code: { type: "string" },
                            partner_name: { type: "string" },
                            rating: { type: "number", minimum: 1, maximum: 5 },
                            review_count: { type: "integer" },
                            summary: { type: "string" },
                            pros: { type: "array", items: { type: "string" } },
                            cons: { type: "array", items: { type: "string" } },
                            badges: { type: "array", items: { type: "string" } },
                          },
                          required: ["partner_code", "partner_name", "rating", "review_count", "summary", "pros", "cons", "badges"],
                        },
                      },
                    },
                    required: ["ratings"],
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "submit_ratings" } },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI Gateway error:", response.status, errorText);
          
          // Return fallback ratings for uncached partners
          for (const partner of partnersToFetch) {
            results.push({
              partner_code: partner.partner_code,
              rating: 4.0,
              review_count: 0,
              summary: "Rating data temporarily unavailable",
              pros: ["Established courier service"],
              cons: [],
              badges: [],
              rating_source: "fallback",
            });
          }
        } else {
          const data = await response.json();
          
          // Extract tool call result
          const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            const aiRatings = parsed.ratings || [];

            // Cache and add to results
            for (const rating of aiRatings) {
              // Upsert to cache
              const { error: upsertError } = await supabase
                .from("partner_ratings")
                .upsert({
                  partner_code: rating.partner_code,
                  partner_name: rating.partner_name,
                  rating: rating.rating,
                  review_count: rating.review_count,
                  summary: rating.summary,
                  pros: rating.pros,
                  cons: rating.cons,
                  badges: rating.badges,
                  rating_source: "ai_aggregated",
                  last_fetched_at: new Date().toISOString(),
                }, { onConflict: "partner_code" });

              if (upsertError) {
                console.error("Cache upsert error:", upsertError);
              }

              results.push({
                partner_code: rating.partner_code,
                rating: rating.rating,
                review_count: rating.review_count,
                summary: rating.summary,
                pros: rating.pros,
                cons: rating.cons,
                badges: rating.badges,
                rating_source: "ai_aggregated",
              });
            }
          }
        }
      } catch (aiError) {
        console.error("AI fetch error:", aiError);
        // Return fallback for failed partners
        for (const partner of partnersToFetch) {
          results.push({
            partner_code: partner.partner_code,
            rating: 4.0,
            review_count: 0,
            summary: "Rating data temporarily unavailable",
            pros: ["Established courier service"],
            cons: [],
            badges: [],
            rating_source: "fallback",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ ratings: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-partner-ratings:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
