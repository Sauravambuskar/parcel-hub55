import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/PaymentModal";
import BookingProgress from "@/components/booking/BookingProgress";
import BookingStep1 from "@/components/booking/BookingStep1";
import BookingStep2 from "@/components/booking/BookingStep2";
import AddressStep from "@/components/booking/AddressStep";
import BookingStep3 from "@/components/booking/BookingStep3";
import BookingStep4 from "@/components/booking/BookingStep4";
import BookingStep5 from "@/components/booking/BookingStep5";
import BookingStep6 from "@/components/booking/BookingStep6";

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [urgency, setUrgency] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [goodsType, setGoodsType] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [shipmentValue, setShipmentValue] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);
  const [serviceabilityData, setServiceabilityData] = useState<any>(null);
  
  const [senderData, setSenderData] = useState({
    name: '', phone: '', address: '', city: '', state: '', pincode: ''
  });
  const [receiverData, setReceiverData] = useState({
    name: '', phone: '', address: '', city: '', state: '', pincode: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const totalSteps = 7;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for Prayog authentication
    const prayogAuth = localStorage.getItem('prayog_auth');
    if (!prayogAuth) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a courier",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    const authData = JSON.parse(prayogAuth);
    setUserId(authData.user_id);
  };

  // Calculate convenience fee based on weight and urgency
  const calculateConvenienceFee = () => {
    if (!packageWeight || !urgency) return 0;
    
    const baseSuperUrgent = 50;
    const baseUrgent = 25;
    const baseNoRush = 10;
    const weightMultipliers = {
      "light": 1,
      "medium": 1.5,
      "heavy": 2
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
        if (partner.capabilities?.is_serviceable && partner.services) {
          partner.services.forEach((service: any) => {
            const basePrice = Math.round(service.base || 0);
            const totalPrice = Math.round(service.total || 0);
            const convenienceFee = totalPrice - basePrice;

            couriers.push({
              id: courierId++,
              name: `${service.partnerName || partner.partner_code} - ${service.companyServiceName}`,
              rating: partner.rating || 4.5,
              deliveryTime: `${service.EDT || 2}-${(service.EDT || 2) + 1} days`,
              basePrice,
              convenienceFee: Math.max(convenienceFee, 0),
              vehicleType: service.serviceMode === 'AIR' ? 'Air' : 'Surface',
              image: "/placeholder.svg",
              features: [
                service.serviceMode === 'AIR' ? 'Air delivery' : 'Surface delivery',
                partner.capabilities?.cod_available ? 'COD available' : 'Prepaid only',
                partner.capabilities?.insurance_available ? 'Insurance available' : 'Basic coverage',
                `Zone: ${service.zoneName || 'Standard'}`
              ],
              prayogData: {
                partnerId: partner.partner_id,
                partnerCode: partner.partner_code,
                serviceId: service.partnerServiceId,
                serviceName: service.partnerServiceName
              }
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
    let deliveryTime = '1-2 days';
    
    if (urgency === 'super-urgent') {
      urgencyMultiplier = 2;
      deliveryTime = '2-4 hours';
    } else if (urgency === 'urgent') {
      urgencyMultiplier = 1.5;
      deliveryTime = '6-12 hours';
    } else if (urgency === 'no-rush') {
      urgencyMultiplier = 0.8;
      deliveryTime = '2-5 days';
    }
    
    const weightMultiplier = packageWeight === 'heavy' ? 1.5 : packageWeight === 'medium' ? 1.2 : 1;
    const convenienceFee = calculateConvenienceFee();
    
    return [
      {
        id: 1,
        name: "BlueDart Express",
        rating: 4.6,
        deliveryTime,
        basePrice: Math.round(basePrice * urgencyMultiplier * weightMultiplier),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Real-time tracking', 'Insurance included', 'SMS updates']
      },
      {
        id: 2,
        name: "DTDC Courier",
        rating: 4.3,
        deliveryTime,
        basePrice: Math.round((basePrice * urgencyMultiplier * weightMultiplier) * 0.9),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Affordable rates', 'Wide network', 'COD available']
      },
      {
        id: 3,
        name: "Delhivery Express",
        rating: 4.4,
        deliveryTime,
        basePrice: Math.round((basePrice * urgencyMultiplier * weightMultiplier) * 0.95),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Fast delivery', 'Live tracking', 'Safe handling']
      },
      {
        id: 4,
        name: "SpeedPost",
        rating: 4.2,
        deliveryTime,
        basePrice: Math.round((basePrice * urgencyMultiplier * weightMultiplier) * 0.8),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['Government backed', 'Nationwide reach', 'Budget friendly']
      },
      {
        id: 5,
        name: "Ecom Express",
        rating: 4.5,
        deliveryTime,
        basePrice: Math.round((basePrice * urgencyMultiplier * weightMultiplier) * 1.1),
        convenienceFee,
        vehicleType: packageWeight === 'heavy' ? 'Van' : 'Bike',
        image: "/placeholder.svg",
        features: ['E-commerce focus', 'Quick pickup', 'Flexible delivery']
      }
    ];
  };

  const handleInputChange = (field: string, value: string) => {
    switch(field) {
      case 'pickupAddress':
        setPickupAddress(value);
        break;
      case 'deliveryAddress':
        setDeliveryAddress(value);
        break;
      case 'urgency':
        setUrgency(value);
        break;
      case 'packageWeight':
        setPackageWeight(value);
        break;
      case 'phoneNumber':
        setPhoneNumber(value);
        break;
      case 'pickupPincode':
        setPickupPincode(value);
        break;
      case 'deliveryPincode':
        setDeliveryPincode(value);
        break;
      case 'goodsType':
        setGoodsType(value);
        break;
      case 'shipmentValue':
        setShipmentValue(value);
        break;
    }
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    setDimensions(prev => ({
      ...prev,
      [dimension]: value
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

  const handleProceedToPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentMethod: string) => {
    if (!userId) return;
    
    const selectedCourierData = getCouriers().find(c => c.id === selectedCourier);
    
    try {
      // Find the selected service from serviceability data
      let selectedService = null;
      if (serviceabilityData?.partners) {
        for (const partner of serviceabilityData.partners) {
          if (partner.services) {
            const service = partner.services.find((s: any) => {
              const serviceName = `${partner.company_name} - ${s.company_service_name}`;
              return serviceName === selectedCourierData?.name;
            });
            if (service) {
              selectedService = {
                ...service,
                companyName: partner.company_name,
                companyId: partner.company_id,
                vendorCode: partner.vendor_code
              };
              break;
            }
          }
        }
      }

      // Create booking via Prayog API
      const { data: prayogBooking, error: prayogError } = await supabase.functions.invoke(
        'prayog-create-booking',
        {
          body: {
            sender: senderData,
            receiver: receiverData,
            goodsType,
            packageWeight,
            dimensions,
            shipmentValue,
            urgency,
            paymentMethod,
            expectedDeliveryDate: selectedDate?.toISOString(),
            selectedService,
            note: packageDescription
          }
        }
      );

      if (prayogError) {
        console.error('Prayog booking error:', prayogError);
        throw new Error('Failed to create booking with courier partner');
      }

      if (!prayogBooking?.success) {
        throw new Error(prayogBooking?.error || 'Failed to create booking');
      }

      // Save booking to our database
      const { error: dbError } = await supabase.from('bookings').insert({
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
        goods_type: goodsType,
        package_weight: packageWeight,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        shipment_value: parseFloat(shipmentValue) || 0,
        urgency,
        courier_name: selectedCourierData?.name || '',
        courier_price: selectedCourierData?.basePrice || 0,
        delivery_time: selectedCourierData?.deliveryTime || '',
        tracking_id: prayogBooking.awbNumber || prayogBooking.trackingId,
        status: 'confirmed'
      });

      if (dbError) throw dbError;

      toast({
        title: "Booking Confirmed!",
        description: `Your shipment has been booked. AWB: ${prayogBooking.awbNumber || prayogBooking.trackingId}`,
      });

      navigate('/tracking', { 
        state: { 
          orderId: prayogBooking.trackingId,
          awbNumber: prayogBooking.awbNumber,
          courier: selectedCourierData?.name,
          pickupAddress: `${senderData.address}, ${senderData.city}`,
          deliveryAddress: `${receiverData.address}, ${receiverData.city}`,
          paymentMethod,
          pickupDate: selectedDate?.toISOString()
        } 
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedCourierData = selectedCourier ? getCouriers().find(c => c.id === selectedCourier) : null;
  const totalAmount = selectedCourierData 
    ? selectedCourierData.basePrice + selectedCourierData.convenienceFee
    : 0;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BookingStep1 onNext={handleNextStep} />;
      case 2:
        return (
          <BookingStep2
            pickupPincode={pickupPincode}
            deliveryPincode={deliveryPincode}
            goodsType={goodsType}
            packageWeight={packageWeight}
            dimensions={dimensions}
            shipmentValue={shipmentValue}
            urgency={urgency}
            onInputChange={handleInputChange}
            onDimensionChange={handleDimensionChange}
            onPricingCalculated={setCalculatedPricing}
            onServiceabilityData={setServiceabilityData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 3:
        return (
          <BookingStep3
            packageWeight={packageWeight}
            packageDescription={packageDescription}
            onInputChange={handleInputChange}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 4:
        return (
          <BookingStep4
            urgency={urgency}
            onInputChange={handleInputChange}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 5:
        return (
          <BookingStep5
            couriers={getCouriers()}
            selectedCourier={selectedCourier}
            onCourierSelect={handleCourierSelect}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 6:
        return (
          <BookingStep6
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            totalAmount={totalAmount}
          />
        );
      case 7:
        return (
          <AddressStep
            senderData={senderData}
            receiverData={receiverData}
            onSenderChange={(field, value) => setSenderData(prev => ({ ...prev, [field]: value }))}
            onReceiverChange={(field, value) => setReceiverData(prev => ({ ...prev, [field]: value }))}
            onNext={handleProceedToPayment}
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
          <Button variant="ghost" size="icon" onClick={() => currentStep === 1 ? navigate('/') : handlePrevStep()}>
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
            courierId: selectedCourier!,
            courierName: selectedCourierData.name,
            basePrice: selectedCourierData.basePrice,
            convenienceFee: selectedCourierData.convenienceFee,
            pickupDate: selectedDate?.toISOString()
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Booking;