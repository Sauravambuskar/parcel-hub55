import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Zap, IndianRupee, Search } from "lucide-react";
import BackgroundParticles from "@/components/BackgroundParticles";
import DeliveryHeroIllustration from "@/components/illustrations/DeliveryHeroIllustration";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to home
    const prayogAuth = localStorage.getItem('prayog_auth');
    if (prayogAuth) {
      navigate("/home");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <BackgroundParticles />
      
      {/* Decorative gradient blobs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        {/* Logo */}
        <div className="space-y-2 opacity-0 animate-scale-fade-in">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <Package className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Via<span className="text-primary">Setu.</span>
          </h1>
        </div>

        {/* Hero Illustration */}
        <div className="opacity-0 animate-fade-in-up py-4" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          <DeliveryHeroIllustration className="scale-90" />
        </div>

        {/* Headline */}
        <div className="space-y-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <h2 className="text-2xl font-semibold text-foreground leading-tight">
            AI-Powered
            <br />
            Multi-Courier Platform
          </h2>
          <p className="text-muted-foreground text-lg">
            Ship smarter across 21,000+ pincodes
          </p>
        </div>

        {/* Benefit Badges */}
        <div className="flex flex-wrap justify-center gap-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium gap-2">
            <IndianRupee className="h-4 w-4" />
            Best Rates
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium gap-2">
            <MapPin className="h-4 w-4" />
            21K+ Pincodes
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium gap-2">
            <Zap className="h-4 w-4" />
            Instant Booking
          </Badge>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 pt-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <Button 
            onClick={() => navigate("/login")} 
            size="lg" 
            className="w-full text-lg py-6 font-semibold"
          >
            Start Shipping
          </Button>
          <Button 
            onClick={() => navigate("/tracking")} 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <Search className="h-4 w-4" />
            Track Package
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
