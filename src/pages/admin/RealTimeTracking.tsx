import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Phone, 
  User, 
  Navigation,
  AlertCircle,
  RefreshCw,
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const RealTimeTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock tracking data - will be replaced with API integration
  const trackingData = {
    orderId: "ORD-1001",
    trackingId: "TRK-2024-001",
    status: "In Transit",
    currentLocation: "Mumbai Distribution Center",
    estimatedDelivery: "Today, 4:30 PM",
    courier: "BlueDart",
    courierPhone: "+91-1800-123-4567",
    priority: "High",
    packageDetails: {
      weight: "2.5 kg",
      dimensions: "30x20x15 cm",
      value: "₹5,000",
    },
    sender: {
      name: "ABC Store",
      address: "123 Market Street, Mumbai, 400001",
      phone: "+91-9876543210",
    },
    receiver: {
      name: "John Doe",
      address: "456 Park Avenue, Mumbai, 400002",
      phone: "+91-9123456789",
    },
    timeline: [
      { status: "Order Placed", location: "Mumbai", timestamp: "Today, 10:00 AM", completed: true },
      { status: "Picked Up", location: "Mumbai", timestamp: "Today, 11:30 AM", completed: true },
      { status: "In Transit", location: "Mumbai DC", timestamp: "Today, 1:00 PM", completed: true, current: true },
      { status: "Out for Delivery", location: "Mumbai", timestamp: "Expected 3:30 PM", completed: false },
      { status: "Delivered", location: "Mumbai", timestamp: "Expected 4:30 PM", completed: false },
    ],
    liveUpdates: [
      { message: "Package arrived at distribution center", timestamp: "2 mins ago" },
      { message: "Package sorted and ready for dispatch", timestamp: "15 mins ago" },
      { message: "Package picked up from sender", timestamp: "2 hours ago" },
    ],
  };

  const handleSearch = () => {
    if (trackingId.trim()) {
      setSearchParams({ id: trackingId });
      setIsTracking(true);
      // Here you would make an API call to fetch tracking data
    }
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    // Here you would refresh tracking data from API
  };

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setTrackingId(id);
      setIsTracking(true);
    }
  }, [searchParams]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "default";
      case "in transit": return "default";
      case "out for delivery": return "default";
      case "picked up": return "secondary";
      case "delayed": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Real-Time Package Tracking</h2>
        <p className="text-muted-foreground">Monitor package location and status in real-time</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Track Package
          </CardTitle>
          <CardDescription>Enter tracking ID or order number to view real-time status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter tracking ID or order number..." 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {isTracking && (
        <>
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant={getStatusColor(trackingData.status)} className="text-base">
                    {trackingData.status}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {trackingData.currentLocation}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Estimated Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{trackingData.estimatedDelivery}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Courier Partner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span className="font-semibold">{trackingData.courier}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Courier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Delivery Timeline
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <CardDescription>Track the journey of your package</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-2 ${
                          event.completed 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {event.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        {index < trackingData.timeline.length - 1 && (
                          <div className={`w-0.5 h-12 ${
                            event.completed ? "bg-primary" : "bg-muted"
                          }`} />
                        )}
                      </div>
                      <div className={`flex-1 pb-4 ${event.current ? "border-l-4 border-primary pl-4" : ""}`}>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{event.status}</p>
                          {event.current && <Badge variant="outline">Current</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                        <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Live Updates
                </CardTitle>
                <CardDescription>Real-time notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingData.liveUpdates.map((update, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <p className="text-sm">{update.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{update.timestamp}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Package & Contact Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Order ID</p>
                  <p className="text-sm text-muted-foreground">{trackingData.orderId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tracking ID</p>
                  <p className="text-sm text-muted-foreground">{trackingData.trackingId}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Weight</p>
                    <p className="text-sm text-muted-foreground">{trackingData.packageDetails.weight}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dimensions</p>
                    <p className="text-sm text-muted-foreground">{trackingData.packageDetails.dimensions}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Value</p>
                    <p className="text-sm text-muted-foreground">{trackingData.packageDetails.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Sender</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{trackingData.sender.name}</p>
                    <p>{trackingData.sender.address}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {trackingData.sender.phone}
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Receiver</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{trackingData.receiver.name}</p>
                    <p>{trackingData.receiver.address}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {trackingData.receiver.phone}
                    </div>
                  </div>
                </div>
                <Separator />
                <Button className="w-full" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Customer
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default RealTimeTracking;
