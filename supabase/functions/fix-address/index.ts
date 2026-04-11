import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { raw_address } = await req.json();

    if (!raw_address || typeof raw_address !== "string" || raw_address.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "raw_address is required (min 5 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Google Geocoding API restricted to India
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(raw_address)}&components=country:IN&key=${apiKey}`;
    const geoRes = await fetch(geocodeUrl);
    const geoData = await geoRes.json();

    if (geoData.status !== "OK" || !geoData.results?.length) {
      return new Response(
        JSON.stringify({
          corrected_address: null,
          pincode: null,
          city: null,
          state: null,
          lat: null,
          lng: null,
          confidence: 0,
          error: "Could not geocode the address",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = geoData.results[0];
    const components = result.address_components || [];

    // Extract structured fields
    const getComponent = (type: string): string | null => {
      const c = components.find((c: any) => c.types.includes(type));
      return c?.long_name || null;
    };

    const pincode = getComponent("postal_code");
    const state = getComponent("administrative_area_level_1");

    // City extraction with priority logic
    const city =
      getComponent("locality") ||
      getComponent("sublocality_level_1") ||
      getComponent("administrative_area_level_3") ||
      getComponent("sublocality_level_2") ||
      getComponent("neighborhood") ||
      state;

    const lat = result.geometry?.location?.lat || null;
    const lng = result.geometry?.location?.lng || null;
    const corrected_address = result.formatted_address || null;

    // Calculate confidence based on location_type and component completeness
    let confidence = 0;
    const locationType = result.geometry?.location_type;
    if (locationType === "ROOFTOP") confidence = 0.95;
    else if (locationType === "RANGE_INTERPOLATED") confidence = 0.85;
    else if (locationType === "GEOMETRIC_CENTER") confidence = 0.75;
    else if (locationType === "APPROXIMATE") confidence = 0.55;
    else confidence = 0.4;

    // Penalize missing key fields
    if (!pincode) confidence -= 0.15;
    if (!city) confidence -= 0.1;

    confidence = Math.max(0, Math.min(1, parseFloat(confidence.toFixed(2))));

    return new Response(
      JSON.stringify({
        corrected_address,
        pincode,
        city,
        state,
        lat,
        lng,
        confidence,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fix-address error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
