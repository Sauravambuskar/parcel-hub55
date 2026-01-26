import { Package, Search, MapPin, Route } from "lucide-react";

const TrackingSearchIllustration = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative w-40 h-40 mx-auto ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Route line */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
        <path
          d="M 40 120 Q 80 80 120 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="text-primary/30"
        />
      </svg>

      {/* Start point */}
      <div className="absolute bottom-6 left-4">
        <div className="p-2 bg-primary/10 rounded-full border border-primary/20">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* End point */}
      <div className="absolute top-4 right-6">
        <div className="p-2 bg-success/10 rounded-full border border-success/20">
          <MapPin className="h-5 w-5 text-success" />
        </div>
      </div>

      {/* Center package with search */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Package */}
          <div className="p-4 bg-muted rounded-xl border border-border shadow-lg">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {/* Search magnifier */}
          <div className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-full shadow-lg">
            <Search className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Moving indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-4 -translate-y-8">
        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
      </div>
    </div>
  );
};

export default TrackingSearchIllustration;
