import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { source_location, destination_location, packages } = requestBody;
    
    if (!source_location?.postal_code || !destination_location?.postal_code) {
      return new Response(
        JSON.stringify({ error: 'Both source and destination locations are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const API_KEY = Deno.env.get('PRAYOG_API_KEY') || 'prayog_live_zYRTOk3AEUTqFsfFTBb0lQ5p27RzCIBv_259a6dad';
    const userId = req.headers.get('x-user-id') || '';
    
    console.log('Checking serviceability v3:', { source_location, destination_location });

    // Build the request payload for Prayog API v3
    const prayogPayload = {
      source_location: {
        postal_code: source_location.postal_code,
        country_code: source_location.country_code || 'IN'
      },
      destination_location: {
        postal_code: destination_location.postal_code,
        country_code: destination_location.country_code || 'IN'
      },
      packages: packages || [{
        weight: { value: 1.0, unit: 'kg' },
        dimensions: { length: 10.0, width: 10.0, height: 10.0, unit: 'cm' }
      }]
    };

    console.log('Prayog API v3 payload:', JSON.stringify(prayogPayload));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    };
    
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch('https://sandbox-apis.prayog.io/serviceability/v3/check', {
      method: 'POST',
      headers,
      body: JSON.stringify(prayogPayload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Prayog API v3 error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to check serviceability', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Serviceability v3 check result:', JSON.stringify(data));

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-serviceability:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});