import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Package, ArrowRight, Sparkles, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
interface BookingStep1Props {
  onNext: () => void;
}
const BookingStep1 = ({
  onNext
}: BookingStep1Props) => {
  return <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4" />
          Fast & Reliable
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text bg-primary-glow text-primary-foreground">
          Choose Service Type
        </h2>
        
      </div>

      <div className="grid gap-4">
        {/* Domestic Card - Enhanced with glassmorphism */}
        <Card className={cn("group relative overflow-hidden cursor-pointer transition-all duration-300", "border-2 border-primary/20 hover:border-primary/50", "bg-gradient-to-br from-primary/5 via-background to-primary-glow/5", "hover:shadow-lg hover:shadow-primary/10", "hover:-translate-y-1")} onClick={onNext}>
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                  Domestic Delivery
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Send packages anywhere within India
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs bg-success/15 text-success px-3 py-1 rounded-full font-medium border border-success/20">
                    Same Day
                  </span>
                  <span className="text-xs bg-primary/15 text-primary px-3 py-1 rounded-full font-medium border border-primary/20">
                    Express
                  </span>
                  <span className="text-xs bg-accent/50 text-accent-foreground px-3 py-1 rounded-full font-medium">
                    Standard
                  </span>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </CardContent>
        </Card>

        {/* International Card - Coming Soon */}
        <Card className="relative overflow-hidden border border-muted/50 opacity-70">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,hsl(var(--muted)/0.1)_10px,hsl(var(--muted)/0.1)_20px)]" />
          
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center">
                <Globe className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-muted-foreground">
                  International Delivery
                </h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Send packages worldwide
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-2">
        <Button onClick={onNext} className="w-full h-14 text-base font-semibold gap-2 group">
          Continue with Domestic Delivery
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>;
};
export default BookingStep1;