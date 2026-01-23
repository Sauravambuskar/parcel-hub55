import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeResult {
  pincode: string;
  city: string;
  state: string;
  country: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pincodes } = await req.json();

    if (!pincodes || !Array.isArray(pincodes) || pincodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'pincodes array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: GeocodeResult[] = [];

    // Fetch city names for all pincodes in parallel
    const geocodePromises = pincodes.map(async (pincode: string) => {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}+India&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components || [];

          let city = '';
          let state = '';
          let country = '';

          for (const component of addressComponents) {
            const types = component.types || [];
            
            // City can be locality, administrative_area_level_2, or sublocality_level_1
            if (types.includes('locality')) {
              city = component.long_name;
            } else if (!city && types.includes('administrative_area_level_2')) {
              city = component.long_name;
            } else if (!city && types.includes('sublocality_level_1')) {
              city = component.long_name;
            }
            
            if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            
            if (types.includes('country')) {
              country = component.long_name;
            }
          }

          return {
            pincode,
            city: city || 'Unknown',
            state: state || 'Unknown',
            country: country || 'India'
          };
        } else {
          console.warn(`No geocode results for pincode: ${pincode}`, data.status);
          return {
            pincode,
            city: 'Unknown',
            state: 'Unknown',
            country: 'India'
          };
        }
      } catch (error) {
        console.error(`Error geocoding pincode ${pincode}:`, error);
        return {
          pincode,
          city: 'Unknown',
          state: 'Unknown',
          country: 'India'
        };
      }
    });

    const geocodeResults = await Promise.all(geocodePromises);
    results.push(...geocodeResults);

    console.log('Geocode results:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to geocode pincodes' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
