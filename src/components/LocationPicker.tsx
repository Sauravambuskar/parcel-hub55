import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const LocationPicker = ({ label, value, onChange, placeholder }: LocationPickerProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const handleCurrentLocation = () => {
    setIsSearching(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simulate reverse geocoding
          setTimeout(() => {
            const mockAddress = "123 FC Road, Pune, Maharashtra 411005";
            onChange(mockAddress);
            setIsSearching(false);
            toast({
              title: "Location detected",
              description: "Current location has been set",
            });
          }, 1000);
        },
        (error) => {
          setIsSearching(false);
          toast({
            title: "Location Error",
            description: "Unable to get current location. Please enter manually.",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsSearching(false);
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (searchText: string) => {
    onChange(searchText);
    
    if (searchText.length > 2) {
      // Simulate address suggestions
      const mockSuggestions = [
        `${searchText}, FC Road, Pune`,
        `${searchText}, Koregaon Park, Pune`,
        `${searchText}, Baner, Pune`,
        `${searchText}, Viman Nagar, Pune`
      ];
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder || "Enter address"}
              className="pl-10"
            />
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleCurrentLocation}
            disabled={isSearching}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            {isSearching ? 'Detecting...' : 'Current'}
          </Button>
        </div>

        {suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full text-left p-3 hover:bg-muted transition-colors flex items-center gap-2 border-b last:border-b-0"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;