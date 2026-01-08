import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Truck, Check, Package, Zap, Shield, MapPin } from "lucide-react";
import { getPartnerLogo } from "@/config/partnerLogos";

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
  capabilities?: {
    city?: string;
    cod_available?: boolean;
    delivery_available?: boolean;
    pickup_available?: boolean;
    hub_name?: string;
    zone?: string;
    fm?: boolean;
    lm?: boolean;
  } | Array<{ category: string; is_supported: boolean; name: string }>;
  error?: string;
}

interface PartnerCardProps {
  partner: Partner;
  selectedServiceId: string | null;
  onServiceSelect: (partnerId: string, serviceCode: string, rateId: string) => void;
}

const PartnerCard = ({ partner, selectedServiceId, onServiceSelect }: PartnerCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Use logo_url from API if available, otherwise fallback to hardcoded logos
  const partnerLogo = partner.logo_url || getPartnerLogo(partner.partner_code, partner.partner_name);
  const hasValidImage = partnerLogo && partnerLogo !== '/placeholder.svg' && !imageError;

  // Extract capabilities as tags
  const getCapabilityTags = () => {
    const tags: string[] = [];
    
    if (Array.isArray(partner.capabilities)) {
      partner.capabilities.forEach((cap) => {
        if (cap.is_supported) {
          tags.push(cap.name);
        }
      });
    } else if (partner.capabilities) {
      const caps = partner.capabilities;
      if (caps.pickup_available) tags.push("Pickup Available");
      if (caps.delivery_available) tags.push("Delivery Available");
      if (caps.cod_available) tags.push("COD Available");
      if (caps.fm) tags.push("First Mile");
      if (caps.lm) tags.push("Last Mile");
      if (caps.city) tags.push(caps.city);
      if (caps.zone) tags.push(`Zone: ${caps.zone}`);
    }
    
    return tags;
  };

  const capabilityTags = getCapabilityTags();

  return (
    <Card className={`transition-all duration-200 ${!partner.is_serviceable ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        {/* Partner Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-border shadow-sm">
              {hasValidImage ? (
                <img 
                  src={partnerLogo} 
                  alt={`${partner.partner_name} logo`} 
                  className="w-12 h-12 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Truck className="h-7 w-7 text-primary" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">{partner.partner_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {partner.rating > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span>{partner.rating.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                <span className="capitalize">{partner.partner_code.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          {!partner.is_serviceable && (
            <Badge variant="destructive" className="text-xs">
              Not Serviceable
            </Badge>
          )}
        </div>

        {/* Capability Tags */}
        {capabilityTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {capabilityTags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Error message for non-serviceable */}
        {partner.error && (
          <div className="mb-4 p-2 bg-destructive/10 rounded-md text-destructive text-sm">
            {partner.error}
          </div>
        )}

        {/* Services List */}
        {partner.services && partner.services.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">Available Services</div>
            {partner.services.map((service) => {
              const serviceId = `${partner.partner_id}_${service.service_code}`;
              const isSelected = selectedServiceId === serviceId;
              const apiPrice = Math.round(service.rate?.price?.amount || 0);
              const price = apiPrice + 50; // Platform fee included

              return (
                <div
                  key={service.service_code}
                  onClick={() => partner.is_serviceable && onServiceSelect(partner.partner_id, service.service_code, service.rate?.rate_id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : partner.is_serviceable 
                        ? 'border-border hover:border-primary/50 hover:bg-muted/50' 
                        : 'border-border cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <div className="font-medium">{service.service_name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{service.tat_days} {service.tat_days === 1 ? 'day' : 'days'}</span>
                          {service.delivery_modes?.express && (
                            <>
                              <span>•</span>
                              <Zap className="h-3 w-3 text-warning" />
                              <span>Express</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">₹{price}</div>
                      <div className="text-xs text-muted-foreground">{service.rate?.price?.type || 'standard'}</div>
                    </div>
                  </div>

                  {/* Service Features */}
                  <div className="flex flex-wrap gap-1 mt-2 ml-8">
                    {service.pickup && (
                      <Badge variant="secondary" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        Pickup
                      </Badge>
                    )}
                    {service.delivery && (
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        Delivery
                      </Badge>
                    )}
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
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No services available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerCard;
