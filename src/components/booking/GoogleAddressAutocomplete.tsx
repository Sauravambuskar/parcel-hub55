import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyBV-s_rISnIAm3QoDYqmoVH2HhhikVUNQA";

interface AddressData {
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface GoogleAddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (address: string, data: AddressData) => void;
  placeholder?: string;
}

const GoogleAddressAutocomplete = ({
  label,
  value,
  onChange,
  placeholder = "Start typing an address...",
}: GoogleAddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if script already exists
    const windowWithGoogle = window as any;
    if (windowWithGoogle.google?.maps?.places) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load Google Maps script
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setIsLoaded(true);
        setIsLoading(false);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    script.onerror = () => {
      setIsLoading(false);
      console.error("Failed to load Google Maps script");
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const windowWithGoogle = window as any;
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new windowWithGoogle.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["address_components", "formatted_address", "geometry"],
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.address_components) return;

      let city = "";
      let state = "";
      let pincode = "";
      let country = "";

      place.address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes("locality")) {
          city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        if (types.includes("postal_code")) {
          pincode = component.long_name;
        }
        if (types.includes("country")) {
          country = component.long_name;
        }
      });

      onChange(place.formatted_address || "", {
        fullAddress: place.formatted_address || "",
        city,
        state,
        pincode,
        country,
      });
    });
  }, [isLoaded, onChange]);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value, { fullAddress: e.target.value, city: "", state: "", pincode: "", country: "" })}
          placeholder={placeholder}
          className="pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
};

export default GoogleAddressAutocomplete;
