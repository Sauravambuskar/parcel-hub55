import { Package, Sparkles, Star } from "lucide-react";

const EmptyBoxIllustration = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative w-32 h-32 mx-auto ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
      
      {/* Main package */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Shadow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-muted rounded-full blur-sm" />
          
          {/* Box */}
          <div className="relative p-4 bg-muted/50 rounded-2xl border-2 border-dashed border-muted-foreground/20">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        </div>
      </div>

      {/* Decorative sparkles */}
      <Sparkles className="absolute top-2 right-2 h-5 w-5 text-primary animate-pulse" />
      <Star className="absolute bottom-4 left-2 h-4 w-4 text-primary/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
      <Sparkles className="absolute top-8 left-0 h-3 w-3 text-accent-foreground/50 animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default EmptyBoxIllustration;
