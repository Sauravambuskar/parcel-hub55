import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Zap, IndianRupee, Search } from "lucide-react";
import warehouseBg from "@/assets/warehouse-bg.jpg";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const authRaw = localStorage.getItem('auth_session') || localStorage.getItem('prayog_auth');
    if (authRaw) {
      navigate("/home");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${warehouseBg})` }}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      
      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        {/* Logo */}
        <div className="space-y-2 opacity-0 animate-scale-fade-in">
          <div className="flex justify-center">
            <div className="bg-primary p-4 rounded-2xl shadow-2xl">
              <Package className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white opacity-0 animate-fade-in-up drop-shadow-lg" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Via<span className="bg-primary text-primary-foreground px-2 rounded">Setu.</span>
          </h1>
        </div>

        {/* Headline */}
        <div className="space-y-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <h2 className="text-2xl font-semibold text-white leading-tight drop-shadow-md">
            AI-Powered
            <br />
            Multi-Courier Platform
          </h2>
          <p className="text-white/80 text-lg">
            Ship smarter across 21,000+ pincodes
          </p>
        </div>

        {/* Benefit Badges */}
        <div className="flex flex-wrap justify-center gap-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium gap-2 bg-white/20 backdrop-blur-sm text-white border-white/30">
            <IndianRupee className="h-4 w-4" />
            Best Rates
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium gap-2 bg-white/20 backdrop-blur-sm text-white border-white/30">
            <Zap className="h-4 w-4" />
            Instant Comparison
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium gap-2 bg-white/20 backdrop-blur-sm text-white border-white/30">
            <Zap className="h-4 w-4" />
            Instant Booking
          </Badge>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 pt-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <Button 
            onClick={() => navigate("/login")} 
            size="lg" 
            className="w-full text-lg py-6 font-semibold shadow-xl"
          >
            Start Shipping
          </Button>
          <Button 
            onClick={() => navigate("/tracking")} 
            variant="ghost" 
            className="text-white/80 hover:text-white hover:bg-white/10 gap-2"
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