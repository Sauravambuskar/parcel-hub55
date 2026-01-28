import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformFeeResult {
  platform_fee: number;
  distance_km: number;
  distance_tier: string;
  breakdown: {
    base_fee: number;
    distance_fee: number;
    weight_surcharge: number;
  };
  explanation: string;
}

interface UsePlatformFeeOptions {
  sourcePincode: string;
  destinationPincode: string;
  weightKg?: number;
  shipmentValue?: number;
  enabled?: boolean;
}

export function usePlatformFee({
  sourcePincode,
  destinationPincode,
  weightKg = 1,
  shipmentValue = 0,
  enabled = true,
}: UsePlatformFeeOptions) {
  const [feeData, setFeeData] = useState<PlatformFeeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !sourcePincode || !destinationPincode) {
      return;
    }

    // Validate pincodes (6 digits)
    if (sourcePincode.length !== 6 || destinationPincode.length !== 6) {
      return;
    }

    const fetchPlatformFee = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('calculate-platform-fee', {
          body: {
            source_pincode: sourcePincode,
            destination_pincode: destinationPincode,
            weight_kg: weightKg,
            shipment_value: shipmentValue,
          },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setFeeData(data);
      } catch (err) {
        console.error('Error fetching platform fee:', err);
        setError(err instanceof Error ? err.message : 'Failed to calculate platform fee');
        // Use fallback value
        setFeeData({
          platform_fee: 50,
          distance_km: 0,
          distance_tier: 'Standard',
          breakdown: {
            base_fee: 50,
            distance_fee: 0,
            weight_surcharge: 0,
          },
          explanation: 'Standard platform fee',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformFee();
  }, [sourcePincode, destinationPincode, weightKg, shipmentValue, enabled]);

  return {
    platformFee: feeData?.platform_fee ?? 50,
    feeData,
    isLoading,
    error,
  };
}
