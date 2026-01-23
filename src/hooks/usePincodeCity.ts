import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CityData {
  city: string;
  state: string;
}

interface PincodeCityResult {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  isLoading: boolean;
  error: string | null;
  fetchCities: (pickupPincode: string, deliveryPincode: string) => Promise<{ pickup: CityData; delivery: CityData } | null>;
}

// Simple cache to avoid duplicate API calls
const cityCache: Record<string, CityData> = {};

export const usePincodeCity = (): PincodeCityResult => {
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = useCallback(async (pickupPincode: string, deliveryPincode: string) => {
    if (!pickupPincode || !deliveryPincode) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedPickup = cityCache[pickupPincode];
      const cachedDelivery = cityCache[deliveryPincode];

      if (cachedPickup && cachedDelivery) {
        setPickupCity(cachedPickup.city);
        setPickupState(cachedPickup.state);
        setDeliveryCity(cachedDelivery.city);
        setDeliveryState(cachedDelivery.state);
        return {
          pickup: cachedPickup,
          delivery: cachedDelivery
        };
      }

      // Determine which pincodes need fetching
      const pincodesToFetch: string[] = [];
      if (!cachedPickup) pincodesToFetch.push(pickupPincode);
      if (!cachedDelivery && deliveryPincode !== pickupPincode) pincodesToFetch.push(deliveryPincode);

      if (pincodesToFetch.length > 0) {
        const { data, error: fnError } = await supabase.functions.invoke('google-geocode-pincode', {
          body: { pincodes: pincodesToFetch }
        });

        if (fnError) {
          console.error('Edge function error:', fnError);
          throw new Error('Failed to fetch city names');
        }

        if (data?.results) {
          for (const result of data.results) {
            cityCache[result.pincode] = {
              city: result.city,
              state: result.state
            };
          }
        }
      }

      // Get final results from cache
      const finalPickup = cityCache[pickupPincode] || { city: '', state: '' };
      const finalDelivery = cityCache[deliveryPincode] || { city: '', state: '' };

      setPickupCity(finalPickup.city);
      setPickupState(finalPickup.state);
      setDeliveryCity(finalDelivery.city);
      setDeliveryState(finalDelivery.state);

      return {
        pickup: finalPickup,
        delivery: finalDelivery
      };
    } catch (err: any) {
      console.error('Error fetching city names:', err);
      setError(err.message || 'Failed to fetch city names');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    pickupCity,
    pickupState,
    deliveryCity,
    deliveryState,
    isLoading,
    error,
    fetchCities
  };
};
