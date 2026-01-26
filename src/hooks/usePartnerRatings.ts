import { useState, useEffect, useCallback } from "react";

interface Partner {
  partner_code: string;
  partner_name: string;
}

interface PartnerRating {
  partner_code: string;
  rating: number;
  review_count: number;
  summary: string;
  pros: string[];
  cons: string[];
  badges: string[];
  rating_source: string;
}

const SUPABASE_URL = "https://tksfdvnogzsweteetjjw.supabase.co";

export const usePartnerRatings = (partners: Partner[]) => {
  const [ratings, setRatings] = useState<Map<string, PartnerRating>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRatings = useCallback(async () => {
    if (partners.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-partner-ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partners: partners.map(p => ({
            partner_code: p.partner_code,
            partner_name: p.partner_name,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ratings");
      }

      const data = await response.json();
      const ratingsMap = new Map<string, PartnerRating>();
      
      for (const rating of data.ratings || []) {
        ratingsMap.set(rating.partner_code, rating);
      }

      setRatings(ratingsMap);
    } catch (err) {
      console.error("Error fetching partner ratings:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [partners]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return { ratings, isLoading, error, refetch: fetchRatings };
};
