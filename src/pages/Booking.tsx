import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PaymentModal from "@/components/PaymentModal";
import BookingProgress from "@/components/booking/BookingProgress";
import BookingStep1 from "@/components/booking/BookingStep1";
import BookingStep2 from "@/components/booking/BookingStep2";
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
  const [selectedSlot, setSelectedSlot] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();
  
  const totalSteps = 6;

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
    let basePrice = 100;
    let urgencyMultiplier = 1;
    let deliveryTime = '1-2 days';
    
    // Adjust pricing and delivery time based on urgency
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
    setSelectedSlot(''); // Reset slot when changing courier
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
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

  const handlePaymentSuccess = (paymentMethod: string) => {
    const selectedCourierData = getCouriers().find(c => c.id === selectedCourier);
    navigate('/tracking', { 
      state: { 
        orderId: `STU${Date.now().toString().slice(-6)}`,
        courier: selectedCourierData?.name,
        pickupAddress,
        deliveryAddress,
        paymentMethod,
        pickupSlot: selectedSlot
      } 
    });
  };

  const selectedCourierData = selectedCourier ? getCouriers().find(c => c.id === selectedCourier) : null;
  const totalAmount = selectedCourierData ? selectedCourierData.basePrice + selectedCourierData.convenienceFee : 0;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BookingStep1 onNext={handleNextStep} />;
      case 2:
        return (
          <BookingStep2
            pickupAddress={pickupAddress}
            deliveryAddress={deliveryAddress}
            phoneNumber={phoneNumber}
            pickupPincode={pickupPincode}
            deliveryPincode={deliveryPincode}
            goodsType={goodsType}
            packageWeight={packageWeight}
            dimensions={dimensions}
            shipmentValue={shipmentValue}
            onInputChange={handleInputChange}
            onDimensionChange={handleDimensionChange}
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
            selectedSlot={selectedSlot}
            onSlotSelect={handleSlotSelect}
            onProceedToPayment={handleProceedToPayment}
            onBack={handlePrevStep}
            totalAmount={totalAmount}
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
          <Button variant="ghost" size="icon" onClick={() => currentStep === 1 ? navigate(-1) : handlePrevStep()}>
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
            pickupSlot: selectedSlot
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Booking;