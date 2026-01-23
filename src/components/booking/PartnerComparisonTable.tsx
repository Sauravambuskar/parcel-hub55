import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Shield, Truck, Check, Zap } from "lucide-react";
import { getPartnerLogo } from "@/config/partnerLogos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Flatten partners with their services for table rows
  const tableRows = partners.flatMap((partner) =>
    partner.services.map((service) => ({
      partner,
      service,
      serviceId: `${partner.partner_id}_${service.service_code}`,
      price: (service.rate?.price?.amount || 0) + 50,
      aiRating: ratings.get(partner.partner_code),
    }))
  );

  // Sort by price (lowest first)
  const sortedRows = [...tableRows].sort((a, b) => a.price - b.price);

  // Find lowest price and fastest for badges
  const lowestPrice = Math.min(...sortedRows.map((r) => r.price));
  const fastestDays = Math.min(...sortedRows.map((r) => r.service.tat_days));

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
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>Partner</TableHead>
            <TableHead>Service</TableHead>
            <TableHead className="text-center">Rating</TableHead>
            <TableHead className="text-center">Delivery</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map(({ partner, service, serviceId, price, aiRating }) => {
            const isSelected = selectedServiceId === serviceId;
            const logo = getPartnerImage(partner);
            const displayRating = aiRating?.rating || partner.rating;
            const isLowestPrice = price === lowestPrice;
            const isFastest = service.tat_days === fastestDays;

            return (
              <TableRow
                key={serviceId}
                onClick={() => onServiceSelect(partner.partner_id, service.service_code, service.rate?.rate_id)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                {/* Selection */}
                <TableCell className="pr-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </TableCell>

                {/* Partner */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center overflow-hidden border border-border shrink-0">
                      {logo ? (
                        <img
                          src={logo}
                          alt={partner.partner_name}
                          className="w-6 h-6 object-contain"
                          onError={() => handleImageError(partner.partner_id)}
                        />
                      ) : (
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{partner.partner_name}</p>
                      {(isLowestPrice || isFastest) && (
                        <div className="flex gap-1 mt-0.5">
                          {isLowestPrice && (
                            <Badge className="bg-success/20 text-success border-0 text-[10px] px-1 py-0">
                              Best Price
                            </Badge>
                          )}
                          {isFastest && !isLowestPrice && (
                            <Badge className="bg-warning/20 text-warning border-0 text-[10px] px-1 py-0">
                              Fastest
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Service */}
                <TableCell>
                  <p className="text-sm">{service.service_name}</p>
                </TableCell>

                {/* Rating */}
                <TableCell className="text-center">
                  {displayRating > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <span className="text-sm font-medium">{displayRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Delivery Time */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {service.tat_days} {service.tat_days === 1 ? "day" : "days"}
                    </span>
                  </div>
                </TableCell>

                {/* Price */}
                <TableCell className="text-right">
                  <span className="text-sm font-semibold bg-foreground text-background px-2 py-0.5 rounded">₹{price}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PartnerComparisonTable;
