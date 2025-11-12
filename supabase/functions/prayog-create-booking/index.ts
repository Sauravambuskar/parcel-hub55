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
    const tenantId = Deno.env.get('PRAYOG_TENANT_ID');
    if (!tenantId) {
      throw new Error('PRAYOG_TENANT_ID not configured');
    }

    const bookingData = await req.json();
    console.log('Creating Prayog booking with data:', JSON.stringify(bookingData, null, 2));

    // Generate orderId in Prayog format: YYMMDDHHMMSS + 6 random alphanumeric
    const now = new Date();
    const timestamp = [
      now.getFullYear().toString().slice(-2),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0'),
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0'),
      now.getSeconds().toString().padStart(2, '0'),
    ].join('');
    
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomPart = Array.from({ length: 6 }, () => 
      charset[Math.floor(Math.random() * charset.length)]
    ).join('');
    
    const orderId = timestamp + randomPart;

    // Extract selected service details from serviceabilityData
    const selectedService = bookingData.selectedService;
    
    // Calculate volumetric weight (L x W x H / 5000)
    const length = parseFloat(bookingData.dimensions?.length) || 10;
    const width = parseFloat(bookingData.dimensions?.width) || 10;
    const height = parseFloat(bookingData.dimensions?.height) || 10;
    const volumetricWeight = (length * width * height) / 5000;
    const physicalWeight = parseFloat(bookingData.packageWeight) || 1;
    
    // Get base amount from selected service
    const baseAmount = selectedService?.rate?.price?.amount || 0;
    
    // Prepare Prayog API payload
    const prayogPayload = {
      referenceId: orderId,
      orderDate: new Date().toISOString(),
      orderType: "FORWARD",
      orderStatus: "READY_FOR_DISPATCH",
      parcelCategory: "ECOMM",
      vendorCode: "AWSA",
      autoManifest: true,
      eWaybills: [],
      deliveryPromise: selectedService?.service_name || "standard",
      metadata: { source: "WEB_APP" },
      documents: [],
      addresses: [
        {
          type: "PICKUP",
          zip: bookingData.sender.pincode,
          name: bookingData.sender.name,
          phone: bookingData.sender.phone,
          street: bookingData.sender.address,
          landmark: null,
          city: bookingData.sender.city,
          state: bookingData.sender.state,
          country: "India",
          latitude: 0,
          longitude: 0,
          addressName: bookingData.sender.address
        },
        {
          type: "DELIVERY",
          zip: bookingData.receiver.pincode,
          name: bookingData.receiver.name,
          phone: bookingData.receiver.phone,
          street: bookingData.receiver.address,
          landmark: null,
          city: bookingData.receiver.city,
          state: bookingData.receiver.state,
          country: "India",
          latitude: 0,
          longitude: 0,
          addressName: bookingData.receiver.address
        },
        {
          type: "BILLING",
          zip: bookingData.receiver.pincode,
          name: bookingData.receiver.name,
          phone: bookingData.receiver.phone,
          street: bookingData.receiver.address,
          landmark: null,
          city: bookingData.receiver.city,
          state: bookingData.receiver.state,
          country: "India",
          latitude: 0,
          longitude: 0,
          addressName: bookingData.receiver.address
        },
        {
          type: "RETURN",
          zip: bookingData.sender.pincode,
          name: bookingData.sender.name,
          phone: bookingData.sender.phone,
          street: bookingData.sender.address,
          landmark: null,
          city: bookingData.sender.city,
          state: bookingData.sender.state,
          country: "India",
          latitude: 0,
          longitude: 0,
          addressName: bookingData.sender.address
        }
      ],
      shipments: [
        {
          dimensions: { 
            length: length, 
            width: width, 
            height: height 
          },
          shipmentStatus: "CONFIRMED",
          awbNumber: "",
          physicalWeight: physicalWeight,
          volumetricWeight: volumetricWeight,
          note: bookingData.note || "",
          items: [
            {
              name: bookingData.goodsType || "Package",
              description: bookingData.packageDescription || "Package"
            }
          ]
        }
      ],
      payment: {
        finalAmount: baseAmount,
        type: "PREPAID",
        breakdown: {
          otherCharges: [
            { name: "Base Rate", chargedAmount: baseAmount }
          ]
        }
      }
    };

    console.log('Sending to Prayog API:', JSON.stringify(prayogPayload, null, 2));

    // Call Prayog Booking API
    const prayogResponse = await fetch(
      'https://sandbox-apis.prayog.io/gateway/booking-service/orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': tenantId,
        },
        body: JSON.stringify(prayogPayload),
      }
    );

    const responseText = await prayogResponse.text();
    console.log('Prayog API response status:', prayogResponse.status);
    console.log('Prayog API response:', responseText);

    if (!prayogResponse.ok) {
      throw new Error(`Prayog API error: ${prayogResponse.status} - ${responseText}`);
    }

    const prayogResult = JSON.parse(responseText);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: prayogResult.orderId || orderId,
        awbNumber: prayogResult.shipments?.[0]?.awbNumber || null,
        trackingId: prayogResult.shipments?.[0]?.awbNumber || orderId,
        status: prayogResult.orderStatus || 'CONFIRMED',
        message: 'Booking created successfully',
        prayogResponse: prayogResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating Prayog booking:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
