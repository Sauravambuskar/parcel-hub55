import { Button } from "@/components/ui/button";
import PartnerCard from "@/components/PartnerCard";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import React from "react";

interface Partner {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  logo_url?: string;
  rating: number;
  is_serviceable: boolean;
  services: Array<{
    service_code: string;
    service_name: string;
    tat_days: number;
    is_cod: boolean;
    pickup: boolean;
    delivery: boolean;
    insurance: boolean;
    rate: {
      rate_id: string;
      price: {
        currency: string;
        amount: number;
        type: string;
      };
      description: string;
    };
    delivery_modes?: {
      express: boolean;
      standard: boolean;
    };
  }>;
  capabilities?: any;
  error?: string;
}

interface ShipmentSummary {
  pickupPincode: string;
  deliveryPincode: string;
  weight: string;
  goodsType: string;
  dimensions?: { length: string; width: string; height: string };
  shipmentValue?: number;
}

interface BookingStep5Props {
  partners: Partner[];
  selectedServiceId: string | null;
  onServiceSelect: (partnerId: string, serviceCode: string, rateId: string) => void;
  onNext: () => void;
  onBack: () => void;
  shipmentSummary?: ShipmentSummary;
}

const BookingStep5 = ({ 
  partners, 
  selectedServiceId, 
  onServiceSelect, 
  onNext, 
  onBack,
  shipmentSummary
}: BookingStep5Props) => {
  const isValid = selectedServiceId !== null;
  const [showNonServiceable, setShowNonServiceable] = React.useState(false);

  // Separate serviceable and non-serviceable partners
  const serviceablePartners = partners.filter(p => p.is_serviceable && p.services?.length > 0);
  const nonServiceablePartners = partners.filter(p => !p.is_serviceable || !p.services?.length);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose Your Courier</h2>
        <p className="text-muted-foreground">Select from our trusted delivery partners</p>
      </div>

      {/* Shipment Summary */}
      {shipmentSummary && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Shipment Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">From</span>
              <span className="font-medium">{shipmentSummary.pickupPincode}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">To</span>
              <span className="font-medium">{shipmentSummary.deliveryPincode}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Weight</span>
              <span className="font-medium">{shipmentSummary.weight} kg</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Type</span>
              <span className="font-medium capitalize">{shipmentSummary.goodsType}</span>
            </div>
            {shipmentSummary.dimensions && (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Dimensions</span>
                <span className="font-medium">
                  {shipmentSummary.dimensions.length}×{shipmentSummary.dimensions.width}×{shipmentSummary.dimensions.height} cm
                </span>
              </div>
            )}
            {shipmentSummary.shipmentValue && shipmentSummary.shipmentValue > 0 && (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Value</span>
                <span className="font-medium">₹{shipmentSummary.shipmentValue}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Serviceable Partners - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceablePartners.length > 0 ? (
          serviceablePartners.map((partner) => (
            <PartnerCard
              key={partner.partner_id}
              partner={partner}
              selectedServiceId={selectedServiceId}
              onServiceSelect={onServiceSelect}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No courier partners available for this route.
          </div>
        )}
      </div>

      {/* Toggle for Non-Serviceable Partners */}
      {nonServiceablePartners.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowNonServiceable(!showNonServiceable)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            {showNonServiceable ? '▼' : '▶'} Show {nonServiceablePartners.length} unavailable partner{nonServiceablePartners.length > 1 ? 's' : ''}
          </button>
          
          {showNonServiceable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
              {nonServiceablePartners.map((partner) => (
                <PartnerCard
                  key={partner.partner_id}
                  partner={partner}
                  selectedServiceId={null}
                  onServiceSelect={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="flex-1 h-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BookingStep5;