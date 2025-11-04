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
    
    // Prepare Prayog API payload
    const prayogPayload = {
      referenceId: orderId,
      bookingType: "Shipment",
      parcelCategory: "COURIER",
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: bookingData.expectedDeliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      orderType: "FORWARD",
      autoManifest: false,
      returnable: false,
      deliveryMode: selectedService?.serviceMode || "SURFACE",
      deliveryPromise: selectedService?.companyServiceName || "STANDARD",
      orderStatus: "READY_FOR_DISPATCH",
      carrierName: selectedService?.companyName || "",
      carrierId: selectedService?.companyId?.toString() || "",
      subCarrierName: selectedService?.serviceName || "",
      subCarrierID: selectedService?.serviceId?.toString() || "",
      vendorCode: selectedService?.vendorCode || "",
      addresses: [
        {
          type: "PICKUP",
          name: bookingData.sender.name,
          phone: bookingData.sender.phone,
          email: bookingData.sender.email || "",
          street: bookingData.sender.address,
          city: bookingData.sender.city,
          state: bookingData.sender.state,
          country: "India",
          countryCode: "IN",
          zip: bookingData.sender.pincode,
          addressName: "Pickup Location"
        },
        {
          type: "DELIVERY",
          name: bookingData.receiver.name,
          phone: bookingData.receiver.phone,
          email: bookingData.receiver.email || "",
          street: bookingData.receiver.address,
          city: bookingData.receiver.city,
          state: bookingData.receiver.state,
          country: "India",
          countryCode: "IN",
          zip: bookingData.receiver.pincode,
          addressName: "Delivery Location"
        }
      ],
      shipments: [
        {
          isParent: true,
          isChild: false,
          shipmentStatus: "PENDING",
          physicalWeight: parseFloat(bookingData.packageWeight) || 1,
          volumetricWeight: bookingData.dimensions?.length && bookingData.dimensions?.width && bookingData.dimensions?.height
            ? (parseFloat(bookingData.dimensions.length) * parseFloat(bookingData.dimensions.width) * parseFloat(bookingData.dimensions.height)) / 5000
            : parseFloat(bookingData.packageWeight) || 1,
          dimensions: {
            length: parseFloat(bookingData.dimensions?.length) || 10,
            width: parseFloat(bookingData.dimensions?.width) || 10,
            height: parseFloat(bookingData.dimensions?.height) || 10,
            unit: "cm"
          },
          note: bookingData.note || "",
          items: [
            {
              name: bookingData.goodsType || "Package",
              quantity: 1,
              weight: parseFloat(bookingData.packageWeight) || 1,
              unitPrice: parseFloat(bookingData.shipmentValue) || 0,
              description: bookingData.goodsType || "Package"
            }
          ]
        }
      ],
      payments: {
        finalAmount: selectedService?.base || 0,
        type: "Prepaid",
        status: "PAID",
        currency: "INR",
        paymentMethod: bookingData.paymentMethod || "Online",
        transactionId: `TXN${Date.now()}`,
        breakdown: {
          subtotal: selectedService?.base || 0
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
