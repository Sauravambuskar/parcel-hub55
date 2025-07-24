import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, Clock, Star, Phone, History, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Logo size="sm" />
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="mb-6">
            <Logo size="lg" showText={false} className="justify-center mb-4" />
            <h2 className="text-3xl font-bold mb-2">Fast Delivery Across Pune</h2>
            <p className="text-muted-foreground">
              Connect with multiple courier partners for the best rates and fastest delivery
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/booking')}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
          >
            <MapPin className="h-5 w-5 mr-2" />
            Book a Delivery
          </Button>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>S.E.T.U. — Seamless Experience Through Unification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Seamless</p>
                <p className="text-sm text-muted-foreground">Effortless booking with one-click delivery solutions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium">Experience</p>
                <p className="text-sm text-muted-foreground">User-focused design that puts your needs first</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Through Unification</p>
                <p className="text-sm text-muted-foreground">Connecting multiple courier partners for best rates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/history')}
            className="h-14 flex-col gap-1"
          >
            <History className="h-5 w-5" />
            <span className="text-sm">Order History</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/support')}
            className="h-14 flex-col gap-1"
          >
            <Phone className="h-5 w-5" />
            <span className="text-sm">Support</span>
          </Button>
        </div>

        {/* Partner Access */}
        <Card className="border-partner-primary/20 bg-partner-primary/5">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Are you a delivery partner?
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/partner/login')}
                className="border-partner-primary text-partner-primary hover:bg-partner-primary hover:text-white"
              >
                Partner Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Serving All of Pune</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm text-center">
              {[
                "Koregaon Park", "FC Road", "Baner", "Wakad",
                "Hadapsar", "Viman Nagar", "Kothrud", "Camp",
                "Deccan", "Shivaji Nagar", "Aundh", "Warje"
              ].map((area) => (
                <div key={area} className="p-2 bg-muted/50 rounded-md">
                  {area}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
