import { createHmac } from "node:crypto";
import { getEnvironmentFromRequest, getRazorpayConfig } from "../_shared/environment.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-environment',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing required payment verification fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields for payment verification' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment-specific Razorpay config
    const env = getEnvironmentFromRequest(req);
    const razorpayConfig = getRazorpayConfig(env);
    
    console.log(`Using ${env} environment for Razorpay verification`);

    if (!razorpayConfig.keySecret) {
      console.error(`Razorpay secret not configured for ${env} environment`);
      return new Response(
        JSON.stringify({ error: `Payment service not configured for ${env} environment` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Create signature for verification
    // Signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const hmac = createHmac('sha256', razorpayConfig.keySecret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.error('Payment signature verification failed');
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Payment signature verification failed' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment verified successfully:', razorpay_payment_id);

    return new Response(
      JSON.stringify({
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in razorpay-verify-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
