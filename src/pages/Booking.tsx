import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG } from "@/config/prayog";
import { getPartnerLogo } from "@/config/partnerLogos";
import PaymentModal from "@/components/PaymentModal";
import BookingProgress from "@/components/booking/BookingProgress";
import BookingStep1 from "@/components/booking/BookingStep1";
import AddressInputStep from "@/components/booking/AddressInputStep";
import ShipmentDetailsStep from "@/components/booking/ShipmentDetailsStep";
import BookingStep4 from "@/components/booking/BookingStep4";
import BookingStep5 from "@/components/booking/BookingStep5";
import BookingStep6 from "@/components/booking/BookingStep6";
import DisclaimerStep from "@/components/booking/DisclaimerStep";
import BookingReviewStep from "@/components/booking/BookingReviewStep";

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [urgency, setUrgency] = useState("");
  const [packageWeight, setPackageWeight] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [goodsType, setGoodsType] = useState("");
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  const [shipmentValue, setShipmentValue] = useState("");
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);
  const [serviceabilityData, setServiceabilityData] = useState<any>(null);
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);

  const [senderData, setSenderData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [receiverData, setReceiverData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 7;

  useEffect(() => {
    let guestId = localStorage.getItem("guest_user_id");
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("guest_user_id", guestId);
    }
    setUserId(guestId);
  }, []);

  const calculateConvenienceFee = () => {
    if (!packageWeight || !urgency) return 0;
    const baseSuperUrgent = 50;
    const baseUrgent = 25;
    const baseNoRush = 10;
    let base = baseNoRush;
    if (urgency === "super-urgent") base = baseSuperUrgent;
    else if (urgency === "urgent") base = baseUrgent;
    return Math.round(base);
  };

  const checkServiceability = async () => {
    if (!senderData.pincode || !receiverData.pincode) {
      toast({
        title: "Missing Pincodes",
        description: "Please ensure both pickup and delivery addresses have pincodes",
        variant: "destructive",
      });
      return false;
    }

    setIsCheckingServiceability(true);

    try {
      const prayogAuth = localStorage.getItem("prayog_auth");
      const authData = prayogAuth ? JSON.parse(prayogAuth) : null;
      const userIdFromAuth = authData?.user_id || "";

      const weightInKg = parseFloat(packageWeight) / 1000 || 1.0;

      const response = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/serviceability/v3/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": PRAYOG_CONFIG.TENANT_ID,
          ...(userIdFromAuth && { "x-user-id": userIdFromAuth }),
        },
        body: JSON.stringify({
          source_location: {
            postal_code: senderData.pincode,
            country_code: "IN",
          },
          destination_location: {
            postal_code: receiverData.pincode,
            country_code: "IN",
          },
          packages: [
            {
              weight: { value: weightInKg, unit: "kg" },
              dimensions: {
                length: parseFloat(dimensions.length) || 10.0,
                width: parseFloat(dimensions.width) || 10.0,
                height: parseFloat(dimensions.height) || 10.0,
                unit: "cm",
              },
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to check serviceability",
          variant: "destructive",
        });
        return false;
      }

      if (data.success === false || data.metadata?.serviceable_count === 0) {
        toast({
          title: "Service Unavailable",
          description: "Delivery is not available for this route. Please try different addresses.",
          variant: "destructive",
        });
        return false;
      }

      if (data.success === true && data.metadata?.serviceable_count > 0) {
        setServiceabilityData(data);
        toast({
          title: "Service Available ✓",
          description: "Delivery is available for this route!",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Serviceability check error:", error);
      toast({
        title: "Error",
        description: "Failed to check serviceability. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCheckingServiceability(false);
    }
  };

  const getCouriers = () => {
    if (serviceabilityData?.partners) {
      const couriers: any[] = [];
      let courierId = 1;

      serviceabilityData.partners.forEach((partner: any) => {
        if (partner.is_serviceable && partner.services) {
          partner.services.forEach((service: any) => {
            const totalPrice = Math.round(service.rate?.price?.amount || 0);
            const basePrice = totalPrice;
            const convenienceFee = 0;

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

    const convenienceFee = calculateConvenienceFee();

    return [
      {
        id: 1,
        name: "BlueDart Express",
        rating: 4.6,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier),
        convenienceFee,
        vehicleType: "Bike",
        image: getPartnerLogo("bluedart"),
        features: ["Real-time tracking", "Insurance included", "SMS updates"],
      },
      {
        id: 2,
        name: "DTDC Courier",
        rating: 4.3,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * 0.9),
        convenienceFee,
        vehicleType: "Bike",
        image: getPartnerLogo("dtdc"),
        features: ["Affordable rates", "Wide network", "COD available"],
      },
      {
        id: 3,
        name: "Delhivery Express",
        rating: 4.4,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * 0.95),
        convenienceFee,
        vehicleType: "Bike",
        image: getPartnerLogo("delhivery"),
        features: ["Fast delivery", "Live tracking", "Safe handling"],
      },
    ];
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case "urgency":
        setUrgency(value);
        break;
      case "packageWeight":
        setPackageWeight(value);
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
    }
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    setDimensions((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleCourierSelect = (courierId: number) => {
    setSelectedCourier(courierId);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleShipmentDetailsNext = async () => {
    const isServiceable = await checkServiceability();
    if (isServiceable) {
      handleNextStep();
    }
  };

  const handleProceedToPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentMethod: string) => {
    if (!userId) return;

    const selectedCourierData = getCouriers().find((c) => c.id === selectedCourier);

    try {
      let selectedService = null;
      if (serviceabilityData?.partners && selectedCourierData?.prayogData) {
        for (const partner of serviceabilityData.partners) {
          if (partner.partner_id === selectedCourierData.prayogData.partnerId) {
            const service = partner.services?.find(
              (s: any) => s.service_code === selectedCourierData.prayogData.serviceCode
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

      const length = parseFloat(dimensions?.length) || 10;
      const width = parseFloat(dimensions?.width) || 10;
      const height = parseFloat(dimensions?.height) || 10;
      const volumetricWeight = (length * width * height) / 5000;
      const physicalWeight = parseFloat(packageWeight) / 1000 || 1;

      const baseAmount = selectedService?.rate?.price?.amount || 0;

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
            dimensions: { length, width, height },
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

      const prayogAuth = localStorage.getItem("prayog_auth");
      const authData = prayogAuth ? JSON.parse(prayogAuth) : null;
      const idToken = authData?.id_token || "";

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
        console.error("Prayog booking failed:", prayogResult);
        toast({
          title: "Booking Failed",
          description: prayogResult.message || "Failed to create booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Prayog booking success:", prayogResult);

      toast({
        title: "Booking Confirmed! 🎉",
        description: `Order ID: ${prayogResult.data?.orderId || orderId}`,
      });

      setShowPaymentModal(false);
      navigate(`/tracking?orderId=${prayogResult.data?.orderId || orderId}`);
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  const selectedCourierData = getCouriers().find((c) => c.id === selectedCourier);
  const totalAmount = selectedCourierData ? selectedCourierData.basePrice + selectedCourierData.convenienceFee : 0;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BookingStep1 onNext={handleNextStep} />;
      case 2:
        return (
          <AddressInputStep
            pickupData={senderData}
            deliveryData={receiverData}
            onPickupChange={(field, value) => setSenderData((prev) => ({ ...prev, [field]: value }))}
            onDeliveryChange={(field, value) => setReceiverData((prev) => ({ ...prev, [field]: value }))}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 3:
        return (
          <ShipmentDetailsStep
            weight={packageWeight}
            dimensions={dimensions}
            goodsType={goodsType}
            description={packageDescription}
            onWeightChange={(value) => setPackageWeight(value)}
            onDimensionChange={handleDimensionChange}
            onGoodsTypeChange={(value) => setGoodsType(value)}
            onDescriptionChange={(value) => setPackageDescription(value)}
            onNext={handleShipmentDetailsNext}
            onBack={handlePrevStep}
          />
        );
      case 4:
        return (
          <BookingStep5
            couriers={getCouriers()}
            selectedCourier={selectedCourier}
            onCourierSelect={handleCourierSelect}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 5:
        return (
          <BookingStep6
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            totalAmount={totalAmount}
          />
        );
      case 6:
        return <DisclaimerStep onNext={handleNextStep} onBack={handlePrevStep} />;
      case 7:
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

      {selectedCourierData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderDetails={{
            courierId: selectedCourier!,
            courierName: selectedCourierData.name,
            basePrice: selectedCourierData.basePrice,
            convenienceFee: selectedCourierData.convenienceFee,
            pickupDate: selectedDate?.toISOString(),
          }}
          onPaymentSuccess={handlePaymentSuccess}
          customerDetails={{
            name: senderData.name,
            phone: senderData.phone,
            email: undefined,
          }}
        />
      )}
    </div>
  );
};

export default Booking;
