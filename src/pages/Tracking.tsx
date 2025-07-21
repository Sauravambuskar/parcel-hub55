import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Package, MapPin, Clock, Phone, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Tracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, courierId } = location.state || {};
  
  const [trackingStatus, setTrackingStatus] = useState("confirmed");
  const [progress, setProgress] = useState(20);

  const statusFlow = [
    { key: "confirmed", label: "Booking Confirmed", progress: 20 },
    { key: "pickup", label: "Pickup Scheduled", progress: 40 },
    { key: "collected", label: "Package Collected", progress: 60 },
    { key: "transit", label: "In Transit", progress: 80 },
    { key: "delivered", label: "Delivered", progress: 100 }
  ];

  // Mock status progression for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackingStatus(current => {
        const currentIndex = statusFlow.findIndex(s => s.key === current);
        if (currentIndex < statusFlow.length - 1) {
          const nextStatus = statusFlow[currentIndex + 1];
          setProgress(nextStatus.progress);
          return nextStatus.key;
        }
        return current;
      });
    }, 5000); // Progress every 5 seconds for demo

    return () => clearInterval(interval);
  }, []);

  const getCurrentStatusIndex = () => {
    return statusFlow.findIndex(s => s.key === trackingStatus);
  };

  const getStatusColor = (index: number) => {
    const currentIndex = getCurrentStatusIndex();
    if (index <= currentIndex) return "text-success";
    return "text-muted-foreground";
  };

  const getStatusBadgeVariant = () => {
    switch (trackingStatus) {
      case "delivered": return "default";
      case "transit": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Track Order</h1>
            <p className="text-sm text-muted-foreground">#{bookingId}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order Status
              </span>
              <Badge variant={getStatusBadgeVariant()}>
                {statusFlow.find(s => s.key === trackingStatus)?.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {progress}% Complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusFlow.map((status, index) => (
                <div key={status.key} className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${
                    index <= getCurrentStatusIndex() ? "bg-success" : "bg-muted"
                  }`}>
                    <CheckCircle className={`h-4 w-4 ${
                      index <= getCurrentStatusIndex() ? "text-success-foreground" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${getStatusColor(index)}`}>
                      {status.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {index === getCurrentStatusIndex() ? "In Progress" : 
                       index < getCurrentStatusIndex() ? "Completed" : "Pending"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index <= getCurrentStatusIndex() && "✓"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground">FC Road, Pune, Maharashtra</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground">Today, 3:00 PM - 5:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Delivery Partner</p>
                <p className="text-sm text-muted-foreground">Raj Kumar • +91 98765 43210</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Call Partner
          </Button>
          <Button variant="outline" className="w-full">
            Get Help
          </Button>
        </div>

        {trackingStatus === "delivered" && (
          <Card className="border-success">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-success mb-2">Package Delivered!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your package has been successfully delivered. Thank you for using our service!
              </p>
              <Button 
                onClick={() => navigate('/history')}
                className="w-full"
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tracking;