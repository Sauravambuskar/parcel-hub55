import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Shield, Truck, Check, ChevronDown, ChevronUp, Zap, Info } from "lucide-react";
import { getPartnerLogo } from "@/config/partnerLogos";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Service {
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
}

interface Partner {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  logo_url?: string;
  rating: number;
  is_serviceable: boolean;
  services: Service[];
  capabilities?: any;
  error?: string;
}

interface AIRating {
  rating: number;
  review_count: number;
  summary: string;
  pros: string[];
  cons: string[];
  badges: string[];
}

interface PartnerComparisonTableProps {
  partners: Partner[];
  selectedServiceId: string | null;
  onServiceSelect: (partnerId: string, serviceCode: string, rateId: string) => void;
  ratings: Map<string, AIRating>;
}

const PartnerComparisonTable = ({
  partners,
  selectedServiceId,
  onServiceSelect,
  ratings,
}: PartnerComparisonTableProps) => {
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Flatten partners with their best service for comparison
  const partnerServices = partners.flatMap((partner) =>
    partner.services.map((service) => ({
      partner,
      service,
      serviceId: `${partner.partner_id}_${service.service_code}`,
      price: (service.rate?.price?.amount || 0) + 50, // Include platform fee
      aiRating: ratings.get(partner.partner_code),
    }))
  );

  // Sort by price (lowest first) by default
  const sortedServices = [...partnerServices].sort((a, b) => a.price - b.price);

  const handleImageError = (partnerId: string) => {
    setImageErrors((prev) => new Set(prev).add(partnerId));
  };

  const getPartnerImage = (partner: Partner) => {
    const logo = partner.logo_url || getPartnerLogo(partner.partner_code, partner.partner_name);
    if (!logo || logo === "/placeholder.svg" || imageErrors.has(partner.partner_id)) {
      return null;
    }
    return logo;
  };

  return (
    <div className="space-y-3">
      {sortedServices.map(({ partner, service, serviceId, price, aiRating }, index) => {
        const isSelected = selectedServiceId === serviceId;
        const isExpanded = expandedPartner === serviceId;
        const logo = getPartnerImage(partner);
        const displayRating = aiRating?.rating || partner.rating;
        const isLowestPrice = index === 0;
        const isFastest = service.tat_days === Math.min(...partnerServices.map((p) => p.service.tat_days));

        return (
          <div
            key={serviceId}
            className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${
              isSelected
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-border hover:border-primary/40 hover:shadow-md bg-card"
            }`}
          >
            {/* Main Row - Clickable */}
            <div
              onClick={() => onServiceSelect(partner.partner_id, service.service_code, service.rate?.rate_id)}
              className="p-4 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Selection Indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                </div>

                {/* Partner Logo */}
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-border shrink-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt={partner.partner_name}
                      className="w-10 h-10 object-contain"
                      onError={() => handleImageError(partner.partner_id)}
                    />
                  ) : (
                    <Truck className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Partner Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{partner.partner_name}</h3>
                    {isLowestPrice && (
                      <Badge className="bg-success/20 text-success border-success/30 text-xs">
                        Best Price
                      </Badge>
                    )}
                    {isFastest && !isLowestPrice && (
                      <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Fastest
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{service.service_name}</p>
                </div>

                {/* Rating */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  {displayRating > 0 && (
                    <>
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium text-sm">{displayRating.toFixed(1)}</span>
                      {aiRating?.review_count && (
                        <span className="text-xs text-muted-foreground">
                          ({aiRating.review_count > 1000 ? `${(aiRating.review_count / 1000).toFixed(1)}k` : aiRating.review_count})
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Delivery Time */}
                <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground shrink-0">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {service.tat_days} {service.tat_days === 1 ? "day" : "days"}
                  </span>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-primary">₹{price}</div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPartner(isExpanded ? null : serviceId);
                  }}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Mobile: Show rating and time */}
              <div className="flex sm:hidden items-center gap-4 mt-3 ml-10 text-sm">
                {displayRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="font-medium">{displayRating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{service.tat_days} days</span>
                </div>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3 ml-10">
                {service.insurance && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Insurance
                  </Badge>
                )}
                {service.is_cod && (
                  <Badge variant="secondary" className="text-xs">
                    COD
                  </Badge>
                )}
                {service.delivery_modes?.express && (
                  <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20">
                    <Zap className="h-3 w-3 mr-1" />
                    Express
                  </Badge>
                )}
                {aiRating?.badges?.slice(0, 2).map((badge, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && aiRating && (
              <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                <div className="ml-10 space-y-3">
                  <p className="text-sm text-muted-foreground">{aiRating.summary}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aiRating.pros.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-success mb-1">Pros</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {aiRating.pros.slice(0, 3).map((pro, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <Check className="h-3 w-3 text-success shrink-0 mt-0.5" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiRating.cons.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-destructive mb-1">Cons</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {aiRating.cons.slice(0, 3).map((con, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <Info className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PartnerComparisonTable;
