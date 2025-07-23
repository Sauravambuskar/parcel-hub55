import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, Clock, Star, Phone, History, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Setu
            </h1>
          </div>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Package className="h-10 w-10 text-white" />
            </div>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">2-4h</p>
              <p className="text-xs text-muted-foreground">Avg Delivery</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Star className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">4.6</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Package className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">5+</p>
              <p className="text-xs text-muted-foreground">Partners</p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Why Choose Setu?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Pune-Focused</p>
                <p className="text-sm text-muted-foreground">Local expertise, faster deliveries</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium">Best Rates</p>
                <p className="text-sm text-muted-foreground">Compare prices from multiple partners</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Real-time Tracking</p>
                <p className="text-sm text-muted-foreground">Know exactly where your package is</p>
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
            className="h-14 flex-col gap-1"
          >
            <Phone className="h-5 w-5" />
            <span className="text-sm">Support</span>
          </Button>
        </div>

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
