import { Button } from "@/components/ui/button";
import SmartRanking from "./SmartRanking";
import CourierAssistant from "./CourierAssistant";
import ETACard, { ETACardSkeleton, ETACardHeader } from "./ETACard";
import ETASortBar from "./ETASortBar";
import { usePartnerRatings } from "@/hooks/usePartnerRatings";
import { Loader2, Truck } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeTatDays } from "@/lib/tat-utils";


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
      price: { currency: string; amount: number; type: string };
      description: string;
    };
    delivery_modes?: { express: boolean; standard: boolean };
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
  platformFee?: number;
  platformFeeData?: { distance_tier?: string; distance_km?: number; explanation?: string } | null;
}

interface ETAResult {
  courier_id: string;
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

const BookingStep5 = ({
  partners,
  selectedServiceId,
  onServiceSelect,
  onNext,
  onBack,
  shipmentSummary,
  platformFee = 50,
  platformFeeData,
}: BookingStep5Props) => {
  const isValid = selectedServiceId !== null;
  const [showNonServiceable, setShowNonServiceable] = React.useState(false);
  const [etaResults, setEtaResults] = useState<Map<string, ETAResult>>(new Map());
  const [etaLoading, setEtaLoading] = useState(false);
  const [sortMode, setSortMode] = useState("best");

  const { ratings, isLoading: ratingsLoading } = usePartnerRatings(partners);

  const serviceablePartners = partners.filter((p) => p.is_serviceable && p.services?.length > 0);
  const nonServiceablePartners = partners.filter((p) => !p.is_serviceable || !p.services?.length);

  // Flatten to service-level rows for ETACard display
  const serviceRows = useMemo(() => {
    return serviceablePartners.flatMap((partner) =>
      partner.services.map((service) => ({
        partner,
        service,
        serviceId: `${partner.partner_id}_${service.service_code}`,
        price: Math.round((service.rate?.price?.amount || 0) + platformFee),
        etaKey: `${partner.partner_code}_${service.service_code}`,
      }))
    );
  }, [serviceablePartners, platformFee]);

  // Fetch predict-eta for all services in parallel
  const fetchETAs = useCallback(async () => {
    if (!shipmentSummary || serviceRows.length === 0) return;
    setEtaLoading(true);
    const bookingDate = new Date().toISOString().split("T")[0];
    const weightKg = parseFloat(shipmentSummary.weight) || 1;

    const promises = serviceRows.map(async ({ partner, service, etaKey }) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const { data, error } = await supabase.functions.invoke("predict-eta", {
          body: {
            courier_id: partner.partner_code,
            base_days: normalizeTatDays(service.tat_days, service.service_name),
            origin_pincode: shipmentSummary.pickupPincode,
            destination_pincode: shipmentSummary.deliveryPincode,
            weight_kg: weightKg,
            booking_date: bookingDate,
          },
        });

        clearTimeout(timeoutId);
        if (error) throw error;
        return { key: etaKey, data: data as ETAResult };
      } catch {
        // Fallback: use courier's own days
        return {
          key: etaKey,
          data: {
            courier_id: partner.partner_code,
            adjusted_days: normalizeTatDays(service.tat_days, service.service_name),
            delivery_date_earliest: "",
            delivery_date_latest: "",
            delivery_label: "",
            confidence_score: null,
            confidence_label: "",
            confidence_color: "",
            risk_factors: [],
            eta_display: `${normalizeTatDays(service.tat_days, service.service_name)} days`,
            eta_range: "",
          } as ETAResult,
        };
      }
    });

    // Stream results in as they arrive
    for (const promise of promises) {
      promise.then(({ key, data }) => {
        setEtaResults((prev) => new Map(prev).set(key, data));
      });
    }

    await Promise.allSettled(promises);
    setEtaLoading(false);
  }, [serviceRows, shipmentSummary]);

  const etaFetchedRef = useRef(false);

  useEffect(() => {
    if (!etaFetchedRef.current && serviceRows.length > 0) {
      etaFetchedRef.current = true;
      fetchETAs();
    }
  }, [fetchETAs, serviceRows.length]);

  // Sort logic
  const sortedRows = useMemo(() => {
    const rows = [...serviceRows];
    const prices = rows.map((r) => r.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    return rows.sort((a, b) => {
      const etaA = etaResults.get(a.etaKey);
      const etaB = etaResults.get(b.etaKey);

      switch (sortMode) {
        case "fastest":
          return (etaA?.adjusted_days ?? a.service.tat_days) - (etaB?.adjusted_days ?? b.service.tat_days) || a.price - b.price;
        case "cheapest":
          return a.price - b.price;
        case "reliable":
          return (etaB?.confidence_score ?? 0) - (etaA?.confidence_score ?? 0);
        case "best":
        default: {
          const confA = etaA?.confidence_score ?? 50;
          const confB = etaB?.confidence_score ?? 50;
          const priceRankA = 100 - ((a.price - minPrice) / priceRange) * 100;
          const priceRankB = 100 - ((b.price - minPrice) / priceRange) * 100;
          const scoreA = confA * 0.35 + priceRankA * 0.65;
          const scoreB = confB * 0.35 + priceRankB * 0.65;
          return scoreB - scoreA;
        }
      }
    });
  }, [serviceRows, etaResults, sortMode]);

  // Prepare partner context for AI assistant
  const partnerContextForAI = serviceablePartners.map((p) => {
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
      services: p.services.map((s) => ({
        service_name: s.service_name,
        tat_days: s.tat_days,
        price: (s.rate?.price?.amount || 0) + platformFee,
        is_cod: s.is_cod,
        insurance: s.insurance,
      })),
    };
  });

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold">Courier Partners</h2>
        <p className="text-sm text-muted-foreground">
          {serviceablePartners.length} partner{serviceablePartners.length !== 1 ? "s" : ""} • {sortedRows.length} service{sortedRows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* AI-Powered Smart Ranking */}
      {serviceablePartners.length > 0 && (
        <SmartRanking partners={serviceablePartners} ratings={ratings} onSelectPartner={onServiceSelect} platformFee={platformFee} />
      )}

      {/* Sort Toggle Bar */}
      <ETASortBar activeSort={sortMode} onSortChange={setSortMode} isLoading={etaLoading} />

      {/* Stacked ETA Cards */}
      {sortedRows.length > 0 ? (
        <div className="space-y-2">
          {sortedRows.map(({ partner, service, serviceId, price, etaKey }, index) => {
            const eta = etaResults.get(etaKey);
            const isLoadingEta = etaLoading && !eta;

            if (isLoadingEta) {
              return <ETACardSkeleton key={serviceId} />;
            }

            return (
              <ETACard
                key={serviceId}
                courierData={{
                  partner_id: partner.partner_id,
                  partner_code: partner.partner_code,
                  partner_name: partner.partner_name,
                  logo_url: partner.logo_url,
                  service_code: service.service_code,
                  service_name: service.service_name,
                  price: service.rate?.price?.amount || 0,
                  tat_days: normalizeTatDays(service.tat_days, service.service_name),
                  is_cod: service.is_cod,
                  insurance: service.insurance,
                  delivery_modes: service.delivery_modes,
                  rate_id: service.rate?.rate_id,
                }}
                etaData={eta || null}
                isSelected={selectedServiceId === serviceId}
                onSelect={() => onServiceSelect(partner.partner_id, service.service_code, service.rate?.rate_id)}
                platformFee={platformFee}
                rank={index + 1}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
          No courier partners available for this route.
        </div>
      )}

      {/* Toggle for Non-Serviceable Partners */}
      {nonServiceablePartners.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowNonServiceable(!showNonServiceable)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            {showNonServiceable ? "▼" : "▶"} Show {nonServiceablePartners.length} unavailable partner
            {nonServiceablePartners.length > 1 ? "s" : ""}
          </button>
          {showNonServiceable && (
            <div className="space-y-2 opacity-60">
              {nonServiceablePartners.map((partner) => (
                <div key={partner.partner_id} className="p-3 rounded-lg border border-border bg-muted/30 flex items-center gap-3">
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
        <Button onClick={onNext} disabled={!isValid} className="flex-1 h-12">
          Continue
        </Button>
      </div>

      {/* AI Courier Assistant */}
      {shipmentSummary && serviceablePartners.length > 0 && (
        <CourierAssistant shipmentContext={shipmentSummary} partners={partnerContextForAI} />
      )}

      {/* Debug Panel */}
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "true" && (
        <details className="mt-6 p-4 rounded-xl border border-border bg-muted/30 text-xs">
          <summary className="cursor-pointer font-medium text-muted-foreground">🐛 Debug Panel</summary>
          <div className="mt-3 space-y-2 max-h-96 overflow-auto">
            {sortedRows.map(({ etaKey }) => {
              const eta = etaResults.get(etaKey);
              return (
                <div key={etaKey} className="p-2 bg-card rounded border border-border">
                  <p className="font-mono font-bold">{etaKey}</p>
                  <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(eta, null, 2)}</pre>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
};

export default BookingStep5;
