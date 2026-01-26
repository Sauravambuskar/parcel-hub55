import { Package, Truck, Plane, Ship, ArrowRight } from "lucide-react";

const DeliveryHeroIllustration = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Central package with glow */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
        
        {/* Main container */}
        <div className="relative w-48 h-48 mx-auto">
          {/* Orbiting elements */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
              <div className="p-2 bg-primary/10 rounded-full border border-primary/20">
                <Plane className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
              <div className="p-2 bg-primary/10 rounded-full border border-primary/20">
                <Ship className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
              <div className="p-2 bg-primary/10 rounded-full border border-primary/20">
                <Truck className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Center package */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-glow rounded-2xl blur-lg opacity-40" />
              <div className="relative p-6 bg-gradient-to-br from-primary to-primary-glow rounded-2xl shadow-xl">
                <Package className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 192">
            <circle
              cx="96"
              cy="96"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="text-border"
            />
          </svg>
        </div>
      </div>

      {/* Decorative arrows */}
      <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-30">
        <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <div className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-30 rotate-180">
        <ArrowRight className="h-8 w-8 text-primary animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default DeliveryHeroIllustration;
