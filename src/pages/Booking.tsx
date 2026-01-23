import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG, CURRENT_ENV } from "@/config/environment";
import { getPartnerLogo } from "@/config/partnerLogos";
import { supabase } from "@/integrations/supabase/client";
import PaymentModal from "@/components/PaymentModal";
import BookingProgress from "@/components/booking/BookingProgress";
import BookingStep1 from "@/components/booking/BookingStep1";
import BookingStep2 from "@/components/booking/BookingStep2";
import AddressStep from "@/components/booking/AddressStep";
import BookingStep5 from "@/components/booking/BookingStep5";

import DisclaimerStep from "@/components/booking/DisclaimerStep";
import BookingReviewStep from "@/components/booking/BookingReviewStep";

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [urgency, setUrgency] = useState("");
  const [packageWeight, setPackageWeight] = useState("");
  const [customWeight, setCustomWeight] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pickupPincode, setPickupPincode] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [goodsType, setGoodsType] = useState("");
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  const [shipmentValue, setShipmentValue] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedPartnerData, setSelectedPartnerData] = useState<{ partnerId: string; serviceCode: string; rateId: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);
  const [serviceabilityData, setServiceabilityData] = useState<any>(null);

  const [senderData, setSenderData] = useState({
    name: "",
    phone: "",
    flatNo: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [receiverData, setReceiverData] = useState({
    name: "",
    phone: "",
    flatNo: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 6;

  useEffect(() => {
    // Check for Prayog auth first
    const prayogAuth = localStorage.getItem("prayog_auth");
    if (prayogAuth) {
      const authData = JSON.parse(prayogAuth);
      if (authData.user_id) {
        setUserId(authData.user_id);
        return;
      }
    }
    
    // Generate a guest user ID for non-authenticated users
    let guestId = localStorage.getItem("guest_user_id");
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("guest_user_id", guestId);
    }
    setUserId(guestId);
  }, []);

  // Auto-populate pincodes from serviceability check - always sync from step 2 values
  useEffect(() => {
    if (pickupPincode) {
      setSenderData((prev) => ({ ...prev, pincode: pickupPincode }));
    }
    if (deliveryPincode) {
      setReceiverData((prev) => ({ ...prev, pincode: deliveryPincode }));
    }
  }, [pickupPincode, deliveryPincode]);

  const handleLocationData = (pickupCity: string, pickupState: string, deliveryCity: string, deliveryState: string) => {
    if (pickupCity && pickupState) {
      setSenderData((prev) => ({
        ...prev,
        city: pickupCity,
        state: pickupState,
      }));
    }
    if (deliveryCity && deliveryState) {
      setReceiverData((prev) => ({
        ...prev,
        city: deliveryCity,
        state: deliveryState,
      }));
    }
  };

  // Calculate convenience fee based on weight and urgency
  const calculateConvenienceFee = () => {
    if (!packageWeight || !urgency) return 0;

    const baseSuperUrgent = 50;
    const baseUrgent = 25;
    const baseNoRush = 10;
    const weightMultipliers = {
      light: 1,
      medium: 1.5,
      heavy: 2,
    };

    let base = baseNoRush;
    if (urgency === "super-urgent") base = baseSuperUrgent;
    else if (urgency === "urgent") base = baseUrgent;

    const multiplier = weightMultipliers[packageWeight as keyof typeof weightMultipliers] || 1;
    return Math.round(base * multiplier);
  };

  const getCouriers = () => {
    // If we have real serviceability data, use it
    if (serviceabilityData?.partners) {
      const couriers: any[] = [];
      let courierId = 1;

      serviceabilityData.partners.forEach((partner: any) => {
        // Check if partner is serviceable
        if (partner.is_serviceable && partner.services) {
          partner.services.forEach((service: any) => {
            // Extract price from rate object and add platform fee
            const apiPrice = Math.round(service.rate?.price?.amount || 0);
            const platformFee = 50;
            const totalPrice = apiPrice + platformFee;
            const basePrice = totalPrice;
            const convenienceFee = 0;

            // Format partner name properly
            const partnerName = partner.partner_code
              .split("_")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            const serviceName = service.service_name
              .split("_")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            couriers.push({
              id: courierId++,
              name: `${partnerName} - ${serviceName}`,
              rating: partner.rating || 4.0,
              deliveryTime: `${service.tat_days || 2}-${(service.tat_days || 2) + 1} days`,
              basePrice,
              convenienceFee,
              vehicleType: service.delivery_modes?.express ? "Express" : "Standard",
              image: getPartnerLogo(partner.partner_code, partnerName),
              features: [
                service.delivery_modes?.express ? "Express delivery" : "Standard delivery",
                service.is_cod ? "COD available" : "Prepaid only",
                service.insurance ? "Insurance available" : "Basic coverage",
                `Price: ₹${totalPrice}`,
              ],
              prayogData: {
                partnerId: partner.partner_id,
                partnerCode: partner.partner_code,
                serviceCode: service.service_code,
                serviceName: service.service_name,
                rateId: service.rate?.rate_id,
              },
            });
          });
        }
      });

      return couriers.length > 0 ? couriers : getMockCouriers();
    }

    // Fallback to mock data if no real data available
    return getMockCouriers();
  };

  const getMockCouriers = () => {
    let basePrice = 100;
    let urgencyMultiplier = 1;
    let deliveryTime = "1-2 days";

    if (urgency === "super-urgent") {
      urgencyMultiplier = 2;
      deliveryTime = "2-4 hours";
    } else if (urgency === "urgent") {
      urgencyMultiplier = 1.5;
      deliveryTime = "6-12 hours";
    } else if (urgency === "no-rush") {
      urgencyMultiplier = 0.8;
      deliveryTime = "2-5 days";
    }

    const weightMultiplier = packageWeight === "heavy" ? 1.5 : packageWeight === "medium" ? 1.2 : 1;
    const convenienceFee = calculateConvenienceFee();

    return [
      {
        id: 1,
        name: "BlueDart Express",
        rating: 4.6,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * weightMultiplier),
        convenienceFee,
        vehicleType: packageWeight === "heavy" ? "Van" : "Bike",
        image: getPartnerLogo("bluedart"),
        features: ["Real-time tracking", "Insurance included", "SMS updates"],
      },
      {
        id: 2,
        name: "DTDC Courier",
        rating: 4.3,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * weightMultiplier * 0.9),
        convenienceFee,
        vehicleType: packageWeight === "heavy" ? "Van" : "Bike",
        image: getPartnerLogo("dtdc"),
        features: ["Affordable rates", "Wide network", "COD available"],
      },
      {
        id: 3,
        name: "Delhivery Express",
        rating: 4.4,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * weightMultiplier * 0.95),
        convenienceFee,
        vehicleType: packageWeight === "heavy" ? "Van" : "Bike",
        image: getPartnerLogo("delhivery"),
        features: ["Fast delivery", "Live tracking", "Safe handling"],
      },
      {
        id: 4,
        name: "SpeedPost",
        rating: 4.2,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * weightMultiplier * 0.8),
        convenienceFee,
        vehicleType: packageWeight === "heavy" ? "Van" : "Bike",
        image: getPartnerLogo("india_post"),
        features: ["Government backed", "Nationwide reach", "Budget friendly"],
      },
      {
        id: 5,
        name: "Ecom Express",
        rating: 4.5,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * weightMultiplier * 1.1),
        convenienceFee,
        vehicleType: packageWeight === "heavy" ? "Van" : "Bike",
        image: getPartnerLogo("ecom_express"),
        features: ["E-commerce focus", "Quick pickup", "Flexible delivery"],
      },
    ];
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case "pickupAddress":
        setPickupAddress(value);
        break;
      case "deliveryAddress":
        setDeliveryAddress(value);
        break;
      case "urgency":
        setUrgency(value);
        break;
      case "packageWeight":
        setPackageWeight(value);
        break;
      case "phoneNumber":
        setPhoneNumber(value);
        break;
      case "pickupPincode":
        setPickupPincode(value);
        break;
      case "deliveryPincode":
        setDeliveryPincode(value);
        break;
      case "goodsType":
        setGoodsType(value);
        break;
      case "shipmentValue":
        setShipmentValue(value);
        break;
      case "packageDescription":
        setPackageDescription(value);
        break;
      case "customWeight":
        setCustomWeight(value);
        break;
    }
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    setDimensions((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleServiceSelect = (partnerId: string, serviceCode: string, rateId: string) => {
    const serviceId = `${partnerId}_${serviceCode}`;
    setSelectedServiceId(serviceId);
    setSelectedPartnerData({ partnerId, serviceCode, rateId });
  };

  // Get partners from serviceability data
  const getPartners = () => {
    if (serviceabilityData?.partners) {
      return serviceabilityData.partners;
    }
    return [];
  };

  // Get selected service details for review step
  const getSelectedServiceDetails = () => {
    if (!selectedPartnerData || !serviceabilityData?.partners) return null;
    
    for (const partner of serviceabilityData.partners) {
      if (partner.partner_id === selectedPartnerData.partnerId) {
        const service = partner.services?.find(
          (s: any) => s.service_code === selectedPartnerData.serviceCode
        );
        if (service) {
          const apiPrice = Math.round(service.rate?.price?.amount || 0);
          const platformFee = 50;
          return {
            name: `${partner.partner_name} - ${service.service_name}`,
            basePrice: apiPrice + platformFee,
            convenienceFee: calculateConvenienceFee(),
            deliveryTime: `${service.tat_days || 2}-${(service.tat_days || 2) + 1} days`,
            partnerId: partner.partner_id,
            partnerCode: partner.partner_code,
            serviceCode: service.service_code,
            serviceName: service.service_name,
            rateId: service.rate?.rate_id,
          };
        }
      }
    }
    return null;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Reset dependent data when navigating back to a step
  const resetDataFromStep = (stepNumber: number) => {
    // When going back to step 2 (pincodes/package details), reset all downstream data
    if (stepNumber <= 2) {
      setServiceabilityData(null);
      setCalculatedPricing(null);
      setSelectedServiceId(null);
      setSelectedPartnerData(null);
      setSelectedDate(undefined);
    }
    // When going back to step 3 (goods details), reset courier selection and beyond
    if (stepNumber <= 3) {
      // Serviceability might still be valid, but courier selection should be reconsidered
    }
    // When going back to step 4 (courier selection), reset date selection
    if (stepNumber <= 4) {
      setSelectedServiceId(null);
      setSelectedPartnerData(null);
      setSelectedDate(undefined);
    }
    // When going back to step 5 (date selection), reset date
    if (stepNumber <= 5) {
      setSelectedDate(undefined);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      resetDataFromStep(prevStep);
      setCurrentStep(prevStep);
    }
  };

  // Handle going to a specific step (e.g., from pincode mismatch)
  const handleGoToStep = (stepNumber: number) => {
    resetDataFromStep(stepNumber);
    setCurrentStep(stepNumber);
  };

  const handleProceedToPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentMethod: string, paymentDetails?: { razorpay_payment_id: string; razorpay_order_id: string }) => {
    if (!userId) return;

    const selectedCourierData = getSelectedServiceDetails();

    try {
      // Find the selected service from serviceability data
      let selectedService = null;
      if (serviceabilityData?.partners && selectedPartnerData) {
        for (const partner of serviceabilityData.partners) {
          if (partner.partner_id === selectedPartnerData.partnerId) {
            const service = partner.services?.find(
              (s: any) => s.service_code === selectedPartnerData.serviceCode,
            );
            if (service) {
              selectedService = {
                ...service,
                partner_id: partner.partner_id,
                partner_code: partner.partner_code,
              };
              break;
            }
          }
        }
      }

      // Generate orderId
      const now = new Date();
      const timestamp = [
        now.getFullYear().toString().slice(-2),
        (now.getMonth() + 1).toString().padStart(2, "0"),
        now.getDate().toString().padStart(2, "0"),
        now.getHours().toString().padStart(2, "0"),
        now.getMinutes().toString().padStart(2, "0"),
        now.getSeconds().toString().padStart(2, "0"),
      ].join("");

      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const randomPart = Array.from({ length: 6 }, () => charset[Math.floor(Math.random() * charset.length)]).join("");

      const orderId = timestamp + randomPart;

      // Calculate volumetric weight
      const length = parseFloat(dimensions?.length) || 10;
      const width = parseFloat(dimensions?.width) || 10;
      const height = parseFloat(dimensions?.height) || 10;
      const volumetricWeight = (length * width * height) / 5000;
      const physicalWeight = parseFloat(packageWeight) || 1;

      const baseAmount = selectedService?.rate?.price?.amount || 0;

      // Prepare Prayog API payload
      const prayogPayload = {
        referenceId: orderId,
        orderDate: new Date().toISOString(),
        orderType: "FORWARD",
        orderStatus: "CREATED",
        parcelCategory: "ECOMM",
        vendorCode: "AWSA",
        autoManifest: true,
        carrierName: selectedService?.partner_code || "",
        carrierId: selectedService?.partner_id || "",
        eWaybills: [],
        deliveryPromise: selectedService?.service_name || "standard",
        metadata: { 
          source: "WEB_APP",
          ...(paymentDetails && {
            razorpay_payment_id: paymentDetails.razorpay_payment_id,
            razorpay_order_id: paymentDetails.razorpay_order_id,
          }),
        },
        documents: [],
        addresses: [
          {
            type: "PICKUP",
            zip: senderData.pincode,
            name: senderData.name,
            phone: senderData.phone,
            street: senderData.address,
            landmark: null,
            city: senderData.city,
            state: senderData.state,
            country: "India",
            latitude: 0,
            longitude: 0,
            addressName: senderData.address,
          },
          {
            type: "DELIVERY",
            zip: receiverData.pincode,
            name: receiverData.name,
            phone: receiverData.phone,
            street: receiverData.address,
            landmark: null,
            city: receiverData.city,
            state: receiverData.state,
            country: "India",
            latitude: 0,
            longitude: 0,
            addressName: receiverData.address,
          },
          {
            type: "BILLING",
            zip: receiverData.pincode,
            name: receiverData.name,
            phone: receiverData.phone,
            street: receiverData.address,
            landmark: null,
            city: receiverData.city,
            state: receiverData.state,
            country: "India",
            latitude: 0,
            longitude: 0,
            addressName: receiverData.address,
          },
          {
            type: "RETURN",
            zip: senderData.pincode,
            name: senderData.name,
            phone: senderData.phone,
            street: senderData.address,
            landmark: null,
            city: senderData.city,
            state: senderData.state,
            country: "India",
            latitude: 0,
            longitude: 0,
            addressName: senderData.address,
          },
        ],
        shipments: [
          {
            dimensions: {
              length: length,
              width: width,
              height: height,
            },
            shipmentStatus: "CONFIRMED",
            awbNumber: "",
            physicalWeight: physicalWeight,
            volumetricWeight: volumetricWeight,
            note: packageDescription || "",
            items: [
              {
                name: goodsType || "Package",
                description: packageDescription || "Package",
              },
            ],
          },
        ],
        payment: {
          finalAmount: baseAmount,
          type: "PREPAID",
          breakdown: {
            otherCharges: [{ name: "Base Rate", chargedAmount: baseAmount }],
          },
        },
        vendorcode: "VIAS",
      };

      // Get auth token from localStorage
      const prayogAuth = localStorage.getItem("prayog_auth");
      const authData = prayogAuth ? JSON.parse(prayogAuth) : null;
      const idToken = authData?.id_token || "";

      // Call Prayog API directly
      const prayogResponse = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/gateway/booking-service/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          tenantId: PRAYOG_CONFIG.TENANT_ID,
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(prayogPayload),
      });

      const prayogResult = await prayogResponse.json();

      if (!prayogResponse.ok) {
        throw new Error(`Prayog API error: ${prayogResponse.status} - ${JSON.stringify(prayogResult)}`);
      }

      const trackingId = prayogResult.shipments?.[0]?.awbNumber || prayogResult.orderId || orderId;
      const awbNumber = prayogResult.shipments?.[0]?.awbNumber || null;

      // Save booking to Supabase for admin dashboard and order history
      const bookingData = {
        user_id: userId,
        sender_name: senderData.name,
        sender_phone: senderData.phone,
        sender_address: senderData.address,
        sender_city: senderData.city,
        sender_state: senderData.state,
        sender_pincode: senderData.pincode,
        receiver_name: receiverData.name,
        receiver_phone: receiverData.phone,
        receiver_address: receiverData.address,
        receiver_city: receiverData.city,
        receiver_state: receiverData.state,
        receiver_pincode: receiverData.pincode,
        goods_type: goodsType || "Package",
        package_weight: packageWeight || "1",
        length: dimensions?.length || null,
        width: dimensions?.width || null,
        height: dimensions?.height || null,
        shipment_value: shipmentValue ? parseFloat(shipmentValue) : null,
        urgency: urgency || "standard",
        packaging_required: false,
        insurance_required: false,
        courier_name: selectedService?.partner_code || selectedCourierData?.name || "",
        courier_price: totalAmount,
        delivery_time: selectedCourierData?.deliveryTime || "3-5 days",
        tracking_id: trackingId,
        prayog_order_id: prayogResult.orderId || orderId,
        prayog_awb: awbNumber,
        status: "CREATED",
        payment_id: paymentDetails?.razorpay_payment_id || null,
        payment_status: "paid",
        base_fare: baseAmount,
        platform_fee: selectedCourierData?.convenienceFee || 0,
        gst: Math.round(baseAmount * 0.18),
        prayog_commission: Math.round(baseAmount * 0.05),
      };

      const { error: dbError } = await supabase
        .from("bookings")
        .insert(bookingData);

      if (dbError) {
        console.error("Failed to save booking to database:", dbError);
        // Don't block the flow, just log the error
      }

      toast({
        title: "Booking Confirmed!",
        description: `Your shipment has been booked. AWB: ${awbNumber || trackingId}`,
      });

      navigate("/tracking", {
        state: {
          orderId: trackingId,
          awbNumber: awbNumber,
          courier: selectedCourierData?.name,
          pickupAddress: `${senderData.address}, ${senderData.city}`,
          deliveryAddress: `${receiverData.address}, ${receiverData.city}`,
          paymentMethod,
          pickupDate: selectedDate?.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedCourierData = getSelectedServiceDetails();
  const totalAmount = selectedCourierData ? selectedCourierData.basePrice + selectedCourierData.convenienceFee : 0;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BookingStep1 onNext={handleNextStep} />;
      case 2:
        return (
          <BookingStep2
            pickupPincode={pickupPincode}
            deliveryPincode={deliveryPincode}
            pickupCity={senderData.city}
            deliveryCity={receiverData.city}
            goodsType={goodsType}
            packageWeight={packageWeight}
            dimensions={dimensions}
            shipmentValue={shipmentValue}
            urgency={urgency}
            onInputChange={handleInputChange}
            onDimensionChange={handleDimensionChange}
            onPricingCalculated={setCalculatedPricing}
            onServiceabilityData={setServiceabilityData}
            onLocationData={handleLocationData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 3:
        return (
          <BookingStep5
            partners={getPartners()}
            selectedServiceId={selectedServiceId}
            onServiceSelect={handleServiceSelect}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            shipmentSummary={{
              pickupPincode,
              deliveryPincode,
              pickupCity: senderData.city || serviceabilityData?.partners?.find((p: any) => p.is_serviceable)?.metadata?.source_pincode_data?.city || "",
              deliveryCity: receiverData.city || serviceabilityData?.partners?.find((p: any) => p.is_serviceable)?.metadata?.dest_pincode_data?.city || "",
              weight: packageWeight,
              goodsType,
              dimensions,
              shipmentValue: Number(shipmentValue) || 0,
            }}
          />
        );
      case 4:
        return (
        <AddressStep
            senderData={senderData}
            receiverData={receiverData}
            pickupPincode={pickupPincode}
            deliveryPincode={deliveryPincode}
            shipmentValue={shipmentValue}
            packageDescription={packageDescription}
            onSenderChange={(field, value) => setSenderData((prev) => ({ ...prev, [field]: value }))}
            onReceiverChange={(field, value) => setReceiverData((prev) => ({ ...prev, [field]: value }))}
            onPackageChange={handleInputChange}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            onGoToStep={handleGoToStep}
          />
        );
      case 5:
        return <DisclaimerStep onNext={handleNextStep} onBack={handlePrevStep} />;
      case 6:
        return (
          <BookingReviewStep
            senderData={senderData}
            receiverData={receiverData}
            packageDetails={{
              goodsType,
              weight: packageWeight,
              dimensions,
              shipmentValue,
              urgency,
            }}
            courierDetails={{
              name: selectedCourierData?.name || "",
              basePrice: selectedCourierData?.basePrice || 0,
              convenienceFee: selectedCourierData?.convenienceFee || 0,
              deliveryTime: selectedCourierData?.deliveryTime || "",
            }}
            selectedDate={selectedDate}
            onConfirm={handleProceedToPayment}
            onBack={handlePrevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => (currentStep === 1 ? navigate("/") : handlePrevStep())}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Book Delivery</h1>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        <BookingProgress currentStep={currentStep} totalSteps={totalSteps} />
        {renderCurrentStep()}
      </div>

      {/* Payment Modal */}
      {selectedCourierData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderDetails={{
            courierId: selectedPartnerData?.partnerId ?? '',
            courierName: selectedCourierData.name ?? '',
            basePrice: selectedCourierData.basePrice,
            convenienceFee: selectedCourierData.convenienceFee,
            pickupDate: selectedDate?.toISOString(),
          }}
          onPaymentSuccess={handlePaymentSuccess}
          customerDetails={{
            name: senderData.name,
            phone: senderData.phone,
            email: undefined, // Email not collected in current flow
          }}
        />
      )}
    </div>
  );
};

export default Booking;
