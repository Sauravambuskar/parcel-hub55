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
          {/* Orbiting elements - 3 icons at 120° intervals */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
            {/* Air - Top (0°) */}
            <div 
              className="absolute left-1/2 top-1/2"
              style={{ transform: 'translate(-50%, -50%) rotate(0deg) translateY(-80px)' }}
            >
              <div 
                className="p-3 bg-background rounded-full border-2 border-primary shadow-lg"
                style={{ transform: 'rotate(0deg)' }}
              >
                <Plane className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            {/* Road - Bottom Left (120°) */}
            <div 
              className="absolute left-1/2 top-1/2"
              style={{ transform: 'translate(-50%, -50%) rotate(120deg) translateY(-80px)' }}
            >
              <div 
                className="p-3 bg-background rounded-full border-2 border-primary shadow-lg"
                style={{ transform: 'rotate(-120deg)' }}
              >
                <Truck className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            {/* Sea - Bottom Right (240°) */}
            <div 
              className="absolute left-1/2 top-1/2"
              style={{ transform: 'translate(-50%, -50%) rotate(240deg) translateY(-80px)' }}
            >
              <div 
                className="p-3 bg-background rounded-full border-2 border-primary shadow-lg"
                style={{ transform: 'rotate(-240deg)' }}
              >
                <Ship className="h-6 w-6 text-primary" />
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
