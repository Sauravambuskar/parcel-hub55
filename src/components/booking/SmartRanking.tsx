import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, Zap, Shield, ThumbsUp } from "lucide-react";
import { normalizeTatDays } from "@/lib/tat-utils";
import { computeBaseFare } from "@/lib/pricing";

interface Partner {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  rating: number;
  is_serviceable: boolean;
  services: Array<{
    service_code: string;
    service_name: string;
    tat_days: number;
    rate: { price: { amount: number } };
  }>;
}

interface PartnerRating {
  partner_code: string;
  rating: number;
  review_count: number;
  summary: string;
  pros: string[];
  cons: string[];
  badges: string[];
}

interface SmartRankingProps {
  partners: Partner[];
  ratings: Map<string, PartnerRating>;
  onSelectPartner: (partnerId: string, serviceCode: string, rateId: string) => void;
  platformFee?: number;
  isAssisted?: boolean;
}

interface RankedPartner {
  partner: Partner;
  rating: PartnerRating | undefined;
  score: number;
  reason: string;
}

const SmartRanking = ({ partners, ratings, onSelectPartner, platformFee = 50, isAssisted = false }: SmartRankingProps) => {
  // Get all services with prices for proper comparison
  const allServices = partners
    .filter(p => p.is_serviceable && p.services?.length > 0)
    .flatMap(partner => 
      partner.services.map(service => ({
        partner,
        service,
        price: computeBaseFare(service.rate?.price?.amount || 0),
        deliveryDays: normalizeTatDays(service.tat_days, service.service_name),
        rating: ratings.get(partner.partner_code),
      }))
    );

  if (allServices.length === 0) return null;

  // Find the actual lowest price and fastest delivery
  const prices = allServices.map(s => s.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const deliveryTimes = allServices.map(s => s.deliveryDays);
  const minDelivery = Math.min(...deliveryTimes);

  // Calculate smart scores for each partner (using their best service)
  const rankedPartners: RankedPartner[] = partners
    .filter(p => p.is_serviceable && p.services?.length > 0)
    .map(partner => {
      const rating = ratings.get(partner.partner_code);
      const bestService = partner.services.reduce((best, current) => {
        const bestPrice = best?.rate?.price?.amount != null ? computeBaseFare(best.rate.price.amount) : Infinity;
        const currentPrice = current?.rate?.price?.amount != null ? computeBaseFare(current.rate.price.amount) : Infinity;
        return currentPrice < bestPrice ? current : best;
      }, partner.services[0]);
      
      const price = computeBaseFare(bestService?.rate?.price?.amount || 0);
      const deliveryDays = bestService?.tat_days || 7;
      
      // Normalized scoring (0-100 scale for each)
      const ratingScore = ((rating?.rating || 3) / 5) * 40; // 0-40 points
      
      // Price score: lower price = higher score (normalized)
      const priceRange = maxPrice - minPrice || 1;
      const priceScore = ((maxPrice - price) / priceRange) * 35; // 0-35 points
      
      // Speed score: faster = higher score
      const speedRange = Math.max(...deliveryTimes) - minDelivery || 1;
      const speedScore = ((Math.max(...deliveryTimes) - deliveryDays) / speedRange) * 25; // 0-25 points
      
      const totalScore = ratingScore + priceScore + speedScore;

      // Generate reason based on actual attributes
      let reason = "";
      const isLowestPrice = price === minPrice;
      const isFastest = deliveryDays === minDelivery;
      const isTopRated = (rating?.rating || 0) >= 4.0;
      
      if (isLowestPrice && isFastest) {
        reason = `Best deal: ₹${Math.round(price)}, ${deliveryDays} day${deliveryDays > 1 ? 's' : ''}`;
      } else if (isLowestPrice) {
        reason = `Lowest price at ₹${Math.round(price)}`;
      } else if (isFastest) {
        reason = `Fastest: ${deliveryDays} day${deliveryDays > 1 ? 's' : ''} delivery`;
      } else if (isTopRated) {
        reason = `Highly rated: ${rating?.rating?.toFixed(1)}/5 stars`;
      } else {
        reason = `Good balance of price & speed`;
      }

      return { partner, rating, score: totalScore, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (rankedPartners.length === 0) return null;

  const handleSelect = (ranked: RankedPartner) => {
    const service = ranked.partner.services[0];
    if (service) {
      onSelectPartner(
        ranked.partner.partner_id,
        service.service_code,
        (service as any).rate?.rate_id
      );
    }
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg leading-none">AI Recommends</h3>
          <Badge variant="secondary" className="text-xs">
            Based on {ratings.size > 0 ? "real reviews" : "analysis"}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Top picks for your shipment based on ratings, price & delivery speed
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rankedPartners.map((ranked, index) => (
            <button
              key={ranked.partner.partner_id}
              onClick={() => handleSelect(ranked)}
              className="text-left p-4 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-all group flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {index === 0 && <TrendingUp className="h-4 w-4 text-warning shrink-0" />}
                  {index === 1 && <ThumbsUp className="h-4 w-4 text-primary shrink-0" />}
                  {index === 2 && <Zap className="h-4 w-4 text-green-500 shrink-0" />}
                  <span className="font-medium text-sm truncate">
                    {ranked.partner.partner_name}
                  </span>
                </div>
                {ranked.rating && (
                  <span className="text-xs font-semibold text-warning shrink-0">
                    ★ {ranked.rating.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-snug">
                {ranked.reason}
              </p>

              {(() => {
                const service = ranked.partner.services[0];
                const price = computeBaseFare(service?.rate?.price?.amount || 0);
                const deliveryDays = normalizeTatDays(service?.tat_days, service?.service_name);
                const computedBadges: string[] = [];

                if (price === minPrice) computedBadges.push("Budget Friendly");
                if (deliveryDays === minDelivery) computedBadges.push("Fastest");
                if ((ranked.rating?.rating || 0) >= 4.0) computedBadges.push("Top Rated");

                const priceBadges = ["Budget Friendly", "Best Value", "Cheapest", "Affordable"];
                const speedBadges = ["Fastest", "Quick Delivery", "Fastest Delivery"];
                const ratingBadges = ["Top Rated", "Highly Rated"];
                const excludeBadges = [...priceBadges, ...speedBadges, ...ratingBadges];

                const otherBadges = (ranked.rating?.badges || [])
                  .filter(b => !excludeBadges.some(ex => b.toLowerCase().includes(ex.toLowerCase())));

                const finalBadges = [...computedBadges, ...otherBadges].slice(0, 2);
                if (finalBadges.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {finalBadges.map((badge, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] leading-none py-1 px-1.5">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-semibold bg-foreground text-background px-2 py-0.5 rounded">
                    ₹{computeBaseFare(ranked.partner.services[0]?.rate?.price?.amount || 0)}
                  </span>
                  {isAssisted && (
                    <span className="text-[10px] font-medium text-amber-700" title="Actual price quoted by courier partner">
                      Partner ₹{Math.round(ranked.partner.services[0]?.rate?.price?.amount || 0)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {normalizeTatDays(ranked.partner.services[0]?.tat_days, ranked.partner.services[0]?.service_name)} days
                </span>
              </div>

            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartRanking;
