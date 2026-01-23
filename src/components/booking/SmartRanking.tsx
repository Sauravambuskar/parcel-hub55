import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, Zap, Shield, ThumbsUp } from "lucide-react";

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
}

interface RankedPartner {
  partner: Partner;
  rating: PartnerRating | undefined;
  score: number;
  reason: string;
}

const SmartRanking = ({ partners, ratings, onSelectPartner }: SmartRankingProps) => {
  // Calculate smart scores for each partner
  const rankedPartners: RankedPartner[] = partners
    .filter(p => p.is_serviceable && p.services?.length > 0)
    .map(partner => {
      const rating = ratings.get(partner.partner_code);
      const bestService = partner.services[0];
      const price = (bestService?.rate?.price?.amount || 0) + 50;
      const deliveryDays = bestService?.tat_days || 7;
      
      // Score calculation (higher is better)
      // Rating: 0-5 (weight 40%)
      // Price: inverse, normalized (weight 30%)
      // Speed: inverse, normalized (weight 30%)
      const ratingScore = (rating?.rating || 3.5) * 8; // 0-40
      const priceScore = Math.max(0, 30 - (price / 50)); // Lower price = higher score
      const speedScore = Math.max(0, 30 - (deliveryDays * 4)); // Faster = higher score
      
      const totalScore = ratingScore + priceScore + speedScore;

      // Generate reason based on top attribute
      let reason = "";
      if (ratingScore >= priceScore && ratingScore >= speedScore) {
        reason = `Top rated with ${rating?.rating || 3.5}/5 stars`;
      } else if (priceScore >= ratingScore && priceScore >= speedScore) {
        reason = `Best value at ₹${price}`;
      } else {
        reason = `Fast delivery in ${deliveryDays} day${deliveryDays > 1 ? 's' : ''}`;
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
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Recommends</h3>
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
              className="text-left p-3 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {index === 0 && <TrendingUp className="h-4 w-4 text-warning" />}
                  {index === 1 && <ThumbsUp className="h-4 w-4 text-primary" />}
                  {index === 2 && <Zap className="h-4 w-4 text-green-500" />}
                  <span className="font-medium text-sm truncate">
                    {ranked.partner.partner_name}
                  </span>
                </div>
                {ranked.rating && (
                  <span className="text-xs font-semibold text-warning">
                    ★ {ranked.rating.rating.toFixed(1)}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {ranked.reason}
              </p>

              <div className="flex flex-wrap gap-1">
                {ranked.rating?.badges?.slice(0, 2).map((badge, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] py-0">
                    {badge}
                  </Badge>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  ₹{((ranked.partner.services[0]?.rate?.price?.amount || 0) + 50)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ranked.partner.services[0]?.tat_days || '?'} days
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
