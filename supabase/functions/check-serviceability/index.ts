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
    const { 
      source_postal_code, 
      destination_postal_code,
      source_country = 'IN',
      destination_country = 'IN',
      parcel_category = 'ecomm',
      packages = [{
        weight: { value: 2, unit: 'kg' },
        dimensions: { length: 10, width: 10, height: 10, unit: 'cm' }
      }]
    } = await req.json();
    
    if (!source_postal_code || !destination_postal_code) {
      return new Response(
        JSON.stringify({ error: 'Both source and destination postal codes are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if this is an international shipment
    const isInternational = source_country !== destination_country;

    const TENANT_ID = Deno.env.get('PRAYOG_TENANT_ID');
    
    if (!TENANT_ID) {
      console.error('PRAYOG_TENANT_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking serviceability:', { 
      source_postal_code, 
      destination_postal_code, 
      source_country,
      destination_country,
      isInternational,
      parcel_category
    });

    // Build request payload
    const payload: any = {
      source_postal_code,
      destination_postal_code,
      parcel_category,
      packages,
    };

    // Add country codes for international shipments
    if (isInternational) {
      payload.source_country_code = source_country;
      payload.destination_country_code = destination_country;
      payload.shipment_type = 'INTERNATIONAL';
    } else {
      payload.shipment_type = 'DOMESTIC';
    }

    const response = await fetch('https://sandbox-apis.prayog.io/serviceability/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TENANT-ID': TENANT_ID,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Prayog API error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to check serviceability' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Serviceability check result:', data);

    // Enhance response with shipment type information
    const enhancedData = {
      ...data,
      shipment_type: isInternational ? 'INTERNATIONAL' : 'DOMESTIC',
      is_international: isInternational,
      source_country,
      destination_country
    };

    return new Response(
      JSON.stringify(enhancedData),
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
