import { Button } from "@/components/ui/button";
import SmartRanking from "./SmartRanking";
import CourierAssistant from "./CourierAssistant";
import PartnerComparisonTable from "./PartnerComparisonTable";
import { usePartnerRatings } from "@/hooks/usePartnerRatings";
import { Loader2, MapPin, Package, Scale, ArrowRight, Truck } from "lucide-react";
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
  pickupCity?: string;
  deliveryCity?: string;
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

  // Fetch AI ratings for all partners
  const { ratings, isLoading: ratingsLoading } = usePartnerRatings(partners);

  // Separate serviceable and non-serviceable partners
  const serviceablePartners = partners.filter(p => p.is_serviceable && p.services?.length > 0);
  const nonServiceablePartners = partners.filter(p => !p.is_serviceable || !p.services?.length);

  // Prepare partner context for AI assistant
  const partnerContextForAI = serviceablePartners.map(p => {
    const rating = ratings.get(p.partner_code);
    return {
      partner_id: p.partner_id,
      partner_code: p.partner_code,
      partner_name: p.partner_name,
      rating: rating?.rating,
      review_count: rating?.review_count,
      summary: rating?.summary,
      pros: rating?.pros,
      cons: rating?.cons,
      badges: rating?.badges,
      services: p.services.map(s => ({
        service_name: s.service_name,
        tat_days: s.tat_days,
        price: (s.rate?.price?.amount || 0) + 50,
        is_cod: s.is_cod,
        insurance: s.insurance,
      })),
    };
  });

  // Calculate volumetric weight
  const calculateVolumetricWeight = () => {
    if (!shipmentSummary?.dimensions) return null;
    const { length, width, height } = shipmentSummary.dimensions;
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    if (l > 0 && w > 0 && h > 0) {
      return ((l * w * h) / 5000).toFixed(2);
    }
    return null;
  };

  const volumetricWeight = calculateVolumetricWeight();
  const actualWeight = parseFloat(shipmentSummary?.weight || "0");
  const chargeableWeight = volumetricWeight ? Math.max(actualWeight, parseFloat(volumetricWeight)) : actualWeight;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose Your Courier</h2>
        <p className="text-muted-foreground">Compare partners and select the best option for your shipment</p>
      </div>

      {/* Enhanced Shipment Summary */}
      {shipmentSummary && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Route */}
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-semibold">{shipmentSummary.pickupCity || shipmentSummary.pickupPincode}</p>
                  {shipmentSummary.pickupCity && (
                    <p className="text-xs text-muted-foreground">{shipmentSummary.pickupPincode}</p>
                  )}
                </div>
              </div>
              
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-semibold">{shipmentSummary.deliveryCity || shipmentSummary.deliveryPincode}</p>
                  {shipmentSummary.deliveryCity && (
                    <p className="text-xs text-muted-foreground">{shipmentSummary.deliveryPincode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-12 bg-border" />

            {/* Package Details */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="font-medium capitalize">{shipmentSummary.goodsType}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-medium">{shipmentSummary.weight} kg</p>
                </div>
              </div>

              {volumetricWeight && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vol. Weight</p>
                    <p className="font-medium">{volumetricWeight} kg</p>
                  </div>
                </div>
              )}

              {shipmentSummary.shipmentValue && shipmentSummary.shipmentValue > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="font-medium">₹{shipmentSummary.shipmentValue.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chargeable Weight Note */}
          {volumetricWeight && parseFloat(volumetricWeight) > actualWeight && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/10">
              💡 Chargeable weight: <span className="font-medium">{chargeableWeight} kg</span> (volumetric weight is higher than actual weight)
            </p>
          )}
        </div>
      )}

      {/* AI-Powered Smart Ranking */}
      {serviceablePartners.length > 0 && (
        <SmartRanking
          partners={serviceablePartners}
          ratings={ratings}
          onSelectPartner={onServiceSelect}
        />
      )}

      {/* Rating Loading Indicator */}
      {ratingsLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Fetching latest reviews...</span>
        </div>
      )}

      {/* Partner Comparison - Clean List Layout */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {serviceablePartners.length} partner{serviceablePartners.length !== 1 ? 's' : ''} available
        </h3>
        {serviceablePartners.length > 0 ? (
          <PartnerComparisonTable
            partners={serviceablePartners}
            selectedServiceId={selectedServiceId}
            onServiceSelect={onServiceSelect}
            ratings={ratings}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
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
            <div className="space-y-2 opacity-60">
              {nonServiceablePartners.map((partner) => (
                <div
                  key={partner.partner_id}
                  className="p-3 rounded-lg border border-border bg-muted/30 flex items-center gap-3"
                >
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{partner.partner_name}</p>
                    <p className="text-xs text-destructive">{partner.error || "Not serviceable for this route"}</p>
                  </div>
                </div>
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

      {/* AI Courier Assistant - Floating Chat Button */}
      {shipmentSummary && serviceablePartners.length > 0 && (
        <CourierAssistant
          shipmentContext={shipmentSummary}
          partners={partnerContextForAI}
        />
      )}
    </div>
  );
};

export default BookingStep5;
