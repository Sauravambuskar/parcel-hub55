import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Truck, Clock, Check, Zap, Star, Info } from "lucide-react";
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
  rank?: number;
  rating?: number | null;
}

/** Column header row rendered once above the list */
export const ETACardHeader = () => (
  <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
    {/* spacer for radio + logo */}
    <div className="w-5 shrink-0" />
    <div className="w-9 shrink-0" />
    {/* Partner */}
    <div className="flex-1 min-w-0">Partner</div>
    {/* Rating */}
    <div className="w-[52px] text-center shrink-0">Rating</div>
    {/* ETA */}
    <div className="w-[56px] text-center shrink-0">ETA</div>
    {/* Confidence */}
    <div className="w-[62px] text-center shrink-0 flex items-center justify-center gap-0.5">
      <span>Reliability</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-2.5 w-2.5 text-muted-foreground/60 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">
            AI-predicted on-time delivery probability based on route history, weather &amp; courier performance.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    {/* Price */}
    <div className="w-[68px] text-right shrink-0">Price</div>
  </div>
);

export const ETACardSkeleton = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card animate-pulse">
    <Skeleton className="h-5 w-5 rounded-full shrink-0" />
    <Skeleton className="h-9 w-9 rounded-md shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="h-4 w-10" />
    <Skeleton className="h-4 w-14" />
    <Skeleton className="h-4 w-14" />
    <Skeleton className="h-6 w-16 rounded" />
  </div>
);

const ETACard = ({ courierData, etaData, isSelected, onSelect, platformFee = 0, rank, rating }: ETACardProps) => {
  const [imageError, setImageError] = useState(false);
  const logo = courierData.logo_url || getPartnerLogo(courierData.partner_code, courierData.partner_name);
  const hasValidLogo = logo && logo !== "/placeholder.svg" && !imageError;
  const totalPrice = Math.round(courierData.price + platformFee);

  const days = etaData?.adjusted_days ?? courierData.tat_days;
  const confidenceScore = etaData?.confidence_score;

  return (
    <div
      onClick={onSelect}
      className={`relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/10 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
      }`}
    >
      {/* Rank badge */}
      {rank === 1 && (
        <div className="absolute -top-2 -left-1 z-10">
          <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 border-0 shadow-sm">
            Best
          </Badge>
        </div>
      )}

      {/* Selection circle */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
        }`}
      >
        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>

      {/* Logo */}
      <div className="w-9 h-9 bg-white rounded-md flex items-center justify-center overflow-hidden border border-border shrink-0">
        {hasValidLogo ? (
          <img
            src={logo}
            alt={courierData.partner_name}
            className="w-7 h-7 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <Truck className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Partner info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm truncate">{courierData.partner_name}</p>
          {courierData.delivery_modes?.express && (
            <Zap className="h-3 w-3 text-warning shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize truncate">
          {courierData.service_name.replace(/_/g, " ")}
        </p>
      </div>

      {/* Rating */}
      <div className="w-[52px] text-center shrink-0">
        {rating != null ? (
          <div className="flex items-center justify-center gap-0.5">
            <Star className="h-3 w-3 text-warning fill-warning" />
            <span className="text-xs font-medium">{rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        )}
      </div>

      {/* ETA */}
      <div className="w-[56px] text-center shrink-0">
        <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>{days}d</span>
        </div>
      </div>

      {/* Confidence / Reliability */}
      <div className="w-[62px] text-center shrink-0">
        {confidenceScore !== null && confidenceScore !== undefined ? (
          <div>
            <div className="w-10 h-1.5 rounded-full bg-muted mx-auto overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${confidenceScore}%`,
                  backgroundColor: etaData?.confidence_color || "hsl(var(--primary))",
                }}
              />
            </div>
            <p className="text-[10px] font-medium mt-0.5">{confidenceScore}%</p>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        )}
      </div>

      {/* Price */}
      <div className="w-[68px] shrink-0 text-right">
        <span className="text-sm font-bold bg-foreground text-background px-2 py-0.5 rounded">
          ₹{totalPrice}
        </span>
        <p className="text-[9px] text-muted-foreground mt-0.5">excl. GST</p>
      </div>
    </div>
  );
};

export default ETACard;
