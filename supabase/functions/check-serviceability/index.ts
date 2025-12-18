import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { source_postal_code, destination_postal_code, parcel_category, packages } = requestBody;
    
    if (!source_postal_code || !destination_postal_code) {
      return new Response(
        JSON.stringify({ error: 'Both source and destination postal codes are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TENANT_ID = Deno.env.get('PRAYOG_TENANT_ID');
    
    if (!TENANT_ID) {
      console.error('PRAYOG_TENANT_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking serviceability:', { source_postal_code, destination_postal_code, parcel_category });

    // Build the request payload for Prayog API
    const prayogPayload: any = {
      source_postal_code,
      destination_postal_code,
      parcel_category: parcel_category || 'ecomm',
    };

    // Include packages if provided
    if (packages && Array.isArray(packages)) {
      prayogPayload.packages = packages;
    } else {
      // Default package for basic serviceability check
      prayogPayload.packages = [{
        weight: { value: 1, unit: 'kg' },
        dimensions: { length: 10, width: 10, height: 10, unit: 'cm' }
      }];
    }

    console.log('Prayog API payload:', JSON.stringify(prayogPayload));

    const response = await fetch('https://sandbox-apis.prayog.io/serviceability/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TENANT-ID': TENANT_ID,
      },
      body: JSON.stringify(prayogPayload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Prayog API error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to check serviceability', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Serviceability check result:', JSON.stringify(data));

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
