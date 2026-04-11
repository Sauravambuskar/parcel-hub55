import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Clock, Check, Zap, Shield, Package as PackageIcon, MapPin, AlertTriangle, CloudRain, Calendar } from "lucide-react";
import { getPartnerLogo } from "@/config/partnerLogos";
import { useState } from "react";

interface CourierData {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  logo_url?: string;
  service_code: string;
  service_name: string;
  price: number;
  tat_days: number;
  is_cod: boolean;
  insurance: boolean;
  delivery_modes?: { express: boolean; standard: boolean };
  rate_id: string;
}

interface ETAData {
  adjusted_days: number;
  delivery_date_earliest: string;
  delivery_date_latest: string;
  delivery_label: string;
  confidence_score: number | null;
  confidence_label: string;
  confidence_color: string;
  risk_factors: string[];
  eta_display: string;
  eta_range: string;
}

interface ETACardProps {
  courierData: CourierData;
  etaData: ETAData | null;
  isSelected: boolean;
  onSelect: () => void;
  platformFee?: number;
}

const riskIcon = (factor: string) => {
  if (factor.toLowerCase().includes("weather") || factor.toLowerCase().includes("rain"))
    return <CloudRain className="h-3 w-3" />;
  if (factor.toLowerCase().includes("weekend") || factor.toLowerCase().includes("holiday") || factor.toLowerCase().includes("sunday"))
    return <Calendar className="h-3 w-3" />;
  if (factor.toLowerCase().includes("overweight"))
    return <PackageIcon className="h-3 w-3" />;
  return <AlertTriangle className="h-3 w-3" />;
};

export const ETACardSkeleton = () => (
  <div className="p-4 rounded-xl border border-border bg-card animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-7 w-16 rounded" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-5 w-36" />
    </div>
    <Skeleton className="h-1.5 w-full rounded-full" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

const ETACard = ({ courierData, etaData, isSelected, onSelect, platformFee = 0 }: ETACardProps) => {
  const [imageError, setImageError] = useState(false);
  const logo = courierData.logo_url || getPartnerLogo(courierData.partner_code, courierData.partner_name);
  const hasValidLogo = logo && logo !== "/placeholder.svg" && !imageError;
  const totalPrice = courierData.price + platformFee;

  const visibleRisks = etaData?.risk_factors?.slice(0, 2) || [];
  const extraRisks = (etaData?.risk_factors?.length || 0) - 2;

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/50 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
      }`}
    >
      {/* Header: Logo + Name + Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Selection indicator */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
            }`}
          >
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-border">
            {hasValidLogo ? (
              <img
                src={logo}
                alt={courierData.partner_name}
                className="w-8 h-8 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <Truck className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{courierData.partner_name}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {courierData.service_name.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        {etaData && (
          <Badge
            variant="secondary"
            className="text-[10px] uppercase font-bold bg-primary/15 text-primary border-0"
          >
            {etaData.delivery_label}
          </Badge>
        )}
      </div>

      {/* Price + ETA Row */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-xl font-bold text-foreground">₹{totalPrice}</span>
          <span className="text-[10px] text-muted-foreground ml-1">excl. GST</span>
        </div>
        <div className="text-right">
          {etaData ? (
            <>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1 justify-end">
                <PackageIcon className="h-3.5 w-3.5 text-primary" />
                {etaData.eta_display}
              </p>
              <p className="text-[11px] text-muted-foreground">{etaData.eta_range}</p>
            </>
          ) : (
            <div className="text-right">
              <p className="text-sm text-foreground flex items-center gap-1 justify-end">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {courierData.tat_days} {courierData.tat_days === 1 ? "day" : "days"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confidence Bar */}
      {etaData && etaData.confidence_score !== null ? (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">Confidence</span>
            <span className="text-[11px] font-medium" style={{ color: etaData.confidence_color }}>
              {etaData.confidence_score}% — {etaData.confidence_label}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${etaData.confidence_score}%`,
                backgroundColor: etaData.confidence_color,
              }}
            />
          </div>
        </div>
      ) : etaData === null ? null : (
        <p className="text-[11px] text-muted-foreground mb-3">ETA confidence unavailable</p>
      )}

      {/* Risk Factor Pills */}
      {visibleRisks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleRisks.map((factor, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] bg-muted border-border text-muted-foreground rounded-full px-2 py-0.5 flex items-center gap-1"
            >
              {riskIcon(factor)}
              {factor.replace(/\(.*\)/, "").trim()}
            </Badge>
          ))}
          {extraRisks > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] bg-muted border-border text-muted-foreground rounded-full px-2 py-0.5"
            >
              +{extraRisks} more
            </Badge>
          )}
        </div>
      )}

      {/* Service feature tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {courierData.delivery_modes?.express && (
          <Badge variant="secondary" className="text-[10px]">
            <Zap className="h-3 w-3 mr-0.5 text-warning" /> Express
          </Badge>
        )}
        {courierData.insurance && (
          <Badge variant="secondary" className="text-[10px]">
            <Shield className="h-3 w-3 mr-0.5" /> Insurance
          </Badge>
        )}
        {courierData.is_cod && (
          <Badge variant="secondary" className="text-[10px]">COD</Badge>
        )}
      </div>

      {/* Book Now Button */}
      <Button
        className="w-full h-10 font-bold text-sm"
        variant={isSelected ? "default" : "outline"}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {isSelected ? "✓ SELECTED" : "SELECT"}
      </Button>
    </div>
  );
};

export default ETACard;
