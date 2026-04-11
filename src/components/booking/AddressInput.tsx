import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, CheckCircle2, AlertTriangle, Sparkles, X } from "lucide-react";

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
  city?: string;
  state?: string;
  pincode?: string;
}

interface AddressInputProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  disabled?: boolean;
}

interface PincodeValidation {
  valid: boolean;
  district?: string;
  state?: string;
  postOffice?: string;
}

interface AICorrectionSuggestion {
  corrected_address: string;
  pincode: string | null;
  city: string | null;
  state: string | null;
  confidence: number;
}

const AddressInput = ({
  id,
  label,
  value,
  placeholder = "Start typing an address...",
  onChange,
  onAddressSelect,
  disabled = false,
}: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<PincodeValidation | null>(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [aiCorrected, setAiCorrected] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AICorrectionSuggestion | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [placesUnavailable, setPlacesUnavailable] = useState(false);
  const [selectedViaAutocomplete, setSelectedViaAutocomplete] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
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

  // Pincode validation via India Post API
  const validatePincode = useCallback(async (pincode: string) => {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeStatus(null);
      return;
    }
    setPincodeChecking(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setPincodeStatus({
          valid: true,
          district: po.District,
          state: po.State,
          postOffice: po.Name,
        });
      } else {
        setPincodeStatus({ valid: false });
      }
    } catch {
      // Skip silently on failure
      setPincodeStatus(null);
    } finally {
      setPincodeChecking(false);
    }
  }, []);

  // AI address correction for manual entries
  const triggerAICorrection = useCallback(async (rawAddress: string) => {
    if (rawAddress.length < 10) return;
    setAiChecking(true);
    setAiCorrected(false);
    setAiSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("fix-address", {
        body: { raw_address: rawAddress },
      });
      if (error || !data?.corrected_address) return;

      if (data.confidence > 0.7) {
        // Auto-apply
        onChange(data.corrected_address);
        if (onAddressSelect) {
          onAddressSelect({
            address: data.corrected_address,
            city: data.city || undefined,
            state: data.state || undefined,
            pincode: data.pincode || undefined,
          });
        }
        if (data.pincode) validatePincode(data.pincode);
        setAiCorrected(true);
      } else if (data.confidence > 0.3) {
        // Show as suggestion
        setAiSuggestion({
          corrected_address: data.corrected_address,
          pincode: data.pincode,
          city: data.city,
          state: data.state,
          confidence: data.confidence,
        });
      }
    } catch {
      // Skip silently
    } finally {
      setAiChecking(false);
    }
  }, [onChange, onAddressSelect, validatePincode]);

  const searchPlaces = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-autocomplete", {
        body: { input, types: "address" },
      });
      if (error) throw error;
      if (data?.predictions) {
        setSuggestions(data.predictions.slice(0, 5));
        setShowSuggestions(true);
        setPlacesUnavailable(false);
      }
    } catch {
      setPlacesUnavailable(true);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedViaAutocomplete(false);
    setAiCorrected(false);
    setAiSuggestion(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(newValue), 300);
  };

  const handleBlur = () => {
    // Only trigger AI correction on manual entry (not autocomplete selection)
    if (!selectedViaAutocomplete && value.length >= 10) {
      triggerAICorrection(value);
    }
  };

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);
    setSelectedViaAutocomplete(true);
    setAiCorrected(false);
    setAiSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke("google-places-details", {
        body: { placeId: prediction.place_id },
      });
      if (error) throw error;

      if (data?.result) {
        const result = data.result;
        const components = result.address_components || [];

        const getComp = (type: string) =>
          components.find((c: any) => c.types.includes(type))?.long_name || "";

        const premise = getComp("premise");
        const streetNumber = getComp("street_number");
        const route = getComp("route");
        const sub3 = getComp("sublocality_level_3");
        const sub2 = getComp("sublocality_level_2");
        const sub1 = getComp("sublocality_level_1");
        const addressParts = [premise, streetNumber, route, sub3, sub2, sub1].filter(Boolean);
        let address = addressParts.join(", ");
        if (!address && result.formatted_address) {
          address = result.formatted_address.split(",").slice(0, -3).join(",").trim();
        }

        const city =
          getComp("locality") ||
          getComp("administrative_area_level_2") ||
          "";
        const state = getComp("administrative_area_level_1");
        const pincode = getComp("postal_code");

        onChange(address || prediction.description);

        if (onAddressSelect) {
          onAddressSelect({
            address: address || prediction.description,
            city,
            state,
            pincode,
          });
        }

        // Validate extracted pincode
        if (pincode) validatePincode(pincode);
      }
    } catch {
      onChange(prediction.description);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptAISuggestion = () => {
    if (!aiSuggestion) return;
    onChange(aiSuggestion.corrected_address);
    if (onAddressSelect) {
      onAddressSelect({
        address: aiSuggestion.corrected_address,
        city: aiSuggestion.city || undefined,
        state: aiSuggestion.state || undefined,
        pincode: aiSuggestion.pincode || undefined,
      });
    }
    if (aiSuggestion.pincode) validatePincode(aiSuggestion.pincode);
    setAiCorrected(true);
    setAiSuggestion(null);
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="pr-8 bg-card border-border focus:border-primary focus:ring-primary/30"
        />
        {(isLoading || aiChecking) && (
          <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Places unavailable fallback */}
      {placesUnavailable && (
        <p className="text-[11px] text-muted-foreground">
          Smart address suggestions unavailable
        </p>
      )}

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-60 overflow-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-3 py-2.5 text-left hover:bg-accent/20 flex items-start gap-2 transition-colors border-b border-border/50 last:border-b-0"
              onClick={() => handleSelectPlace(prediction)}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {prediction.structured_formatting?.main_text || prediction.description}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting?.secondary_text || ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pincode validation badge */}
      {pincodeChecking && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verifying pincode...
        </div>
      )}
      {pincodeStatus?.valid && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <CheckCircle2 className="h-3 w-3" />
          Pincode verified — {pincodeStatus.district}, {pincodeStatus.state}
        </div>
      )}
      {pincodeStatus && !pincodeStatus.valid && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          Pincode may not be serviceable — please verify
        </div>
      )}

      {/* AI correction applied badge */}
      {aiCorrected && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[11px] bg-primary/10 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Address corrected by AI ✓
          </Badge>
        </div>
      )}

      {/* AI suggestion (low confidence) */}
      {aiSuggestion && (
        <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
            AI suggests a corrected address:
          </p>
          <p className="text-sm text-foreground">{aiSuggestion.corrected_address}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={acceptAISuggestion}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setAiSuggestion(null)}
            >
              <X className="h-3 w-3 mr-1" /> Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressInput;
