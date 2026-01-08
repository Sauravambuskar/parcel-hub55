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

interface BookingStep5Props {
  partners: Partner[];
  selectedServiceId: string | null;
  onServiceSelect: (partnerId: string, serviceCode: string, rateId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BookingStep5 = ({ 
  partners, 
  selectedServiceId, 
  onServiceSelect, 
  onNext, 
  onBack 
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

      {/* Serviceable Partners */}
      <div className="space-y-4">
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
          <div className="text-center py-8 text-muted-foreground">
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
            <div className="space-y-4 opacity-60">
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