import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin } from "lucide-react";

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressComponents {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  disabled?: boolean;
}

const AddressAutocomplete = ({
  id,
  label,
  value,
  placeholder = "Start typing an address...",
  onChange,
  onAddressSelect,
  disabled = false,
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaces = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: { input, types: 'address' }
      });

      if (error) throw error;

      if (data?.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-places-details', {
        body: { placeId: prediction.place_id }
      });

      if (error) throw error;

      if (data?.result) {
        const result = data.result;
        const components = result.address_components || [];
        
        let address = '';
        let city = '';
        let state = '';
        let pincode = '';

        // Build address from components
        const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name || '';
        const route = components.find((c: any) => c.types.includes('route'))?.long_name || '';
        const sublocality3 = components.find((c: any) => c.types.includes('sublocality_level_3'))?.long_name || '';
        const sublocality2 = components.find((c: any) => c.types.includes('sublocality_level_2'))?.long_name || '';
        const sublocality1 = components.find((c: any) => c.types.includes('sublocality_level_1'))?.long_name || '';
        const premise = components.find((c: any) => c.types.includes('premise'))?.long_name || '';
        
        // Build complete address
        const addressParts = [premise, streetNumber, route, sublocality3, sublocality2, sublocality1].filter(Boolean);
        address = addressParts.join(', ');
        
        // If no address parts found, use the formatted address minus city/state/pincode
        if (!address && result.formatted_address) {
          address = result.formatted_address.split(',').slice(0, -3).join(',').trim();
        }

        city = components.find((c: any) => 
          c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        )?.long_name || '';
        
        state = components.find((c: any) => 
          c.types.includes('administrative_area_level_1')
        )?.long_name || '';
        
        pincode = components.find((c: any) => 
          c.types.includes('postal_code')
        )?.long_name || '';

        // Update the address field
        onChange(address || prediction.description);

        // Call the callback with all address components
        if (onAddressSelect) {
          onAddressSelect({ address: address || prediction.description, city, state, pincode });
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      onChange(prediction.description);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-2 transition-colors"
              onClick={() => handleSelectPlace(prediction)}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {prediction.structured_formatting?.main_text || prediction.description}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting?.secondary_text || ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
