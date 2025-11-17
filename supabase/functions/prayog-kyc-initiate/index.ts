import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { docType, docNumber, userId, customerId, authToken } = await req.json();
    
    console.log('KYC Initiation Request:', { docType, userId, customerId });

    // Get tenant ID from environment
    const tenantId = Deno.env.get('PRAYOG_TENANT_ID');
    if (!tenantId) {
      throw new Error('PRAYOG_TENANT_ID not configured');
    }

    // Get current origin for redirect URL
    const origin = req.headers.get('origin') || 'https://e9e095f5-b76e-4f4a-9422-238e7ebb718c.lovableproject.com';
    const redirectUrl = `${origin}/booking?kycCallback=true`;

    // Prepare KYC payload
    const kycPayload = {
      KYC: {
        docType,
        docNumber,
        redirectUrl
      }
    };

    console.log('Calling Prayog KYC API with payload:', kycPayload);

    // Call Prayog KYC API
    const response = await fetch(
      `https://sandbox-apis.prayog.io/gateway/onboarding/api/v1/onboarding/${tenantId}/prospay/customer/${customerId}/kyc`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kycPayload)
      }
    );

    const responseData = await response.json();
    console.log('Prayog KYC API Response:', response.status, responseData);

    if (!response.ok) {
      throw new Error(`Prayog KYC API error: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        redirectUrl: responseData.redirectUrl || redirectUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('KYC Initiation Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
