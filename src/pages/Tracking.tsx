import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, MapPin, Clock, Phone, CheckCircle, Truck, Calendar, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG } from "@/config/environment";

interface TrackingStatus {
  trackingId: string;
  status: string;
  location?: string;
  deliveryPartnerName: string;
  statusTimestamp: number;
  event: string;
  category: string;
  subcategory: string;
  createdAt: string;
}

interface LocationInfo {
  address: string;
  city: string;
  landmark: string;
  pincode: string;
  state: string;
}

interface TrackingData {
  orderInformation: {
    trackingId: string;
    cAwbNumber: string;
    orderId: string;
    sourceLocation: LocationInfo;
    destinationLocation: LocationInfo;
    senderDetails: {
      sender_mobile: string;
      sender_name: string;
    };
    receiverDetails: {
      receiver_mobile: string;
      receiver_name: string;
    };
    travelType: string;
    serviceType: string;
    bookingDate: string;
    type: string;
  };
  statuses: TrackingStatus[];
}

const Tracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { awbNumber: initialAwbNumber } = location.state || {};
  
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [awbInput, setAwbInput] = useState(initialAwbNumber || "");
  const [currentAwb, setCurrentAwb] = useState(initialAwbNumber || "");

  useEffect(() => {
    if (initialAwbNumber) {
      setCurrentAwb(initialAwbNumber);
      fetchTrackingData(initialAwbNumber);
    }
  }, [initialAwbNumber]);

  const handleTrack = () => {
    if (!awbInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter an AWB number",
        variant: "destructive",
      });
      return;
    }
    setCurrentAwb(awbInput.trim());
    fetchTrackingData(awbInput.trim());
  };

  const fetchTrackingData = async (awb: string) => {
    setLoading(true);
    setTrackingData(null);
    
    try {
      const prayogAuth = localStorage.getItem('prayog_auth');
      
      if (!prayogAuth) {
        toast({
          title: "Authentication required",
          description: "Please sign in to track your order",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const authData = JSON.parse(prayogAuth);

      const response = await fetch(
        `${PRAYOG_CONFIG.API_BASE_URL}/gateway/tracking/v2/${awb}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authData.id_token}`,
            "tenantId": PRAYOG_CONFIG.TENANT_ID,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tracking: ${response.status}`);
      }

      const result = await response.json();
      setTrackingData(result);
    } catch (error: any) {
      console.error("Error fetching tracking:", error);
      toast({
        title: "Error",
        description: "Failed to load tracking information. Please check the AWB number.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryUpper = category?.toUpperCase() || '';
    switch (categoryUpper) {
      case 'DELIVERED':
        return 'bg-green-500';
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-500';
      case 'IN_TRANSIT':
      case 'INTRANSIT':
        return 'bg-indigo-500';
      case 'READY_FOR_DISPATCH':
        return 'bg-orange-500';
      case 'ORDER_CONFIRMED':
        return 'bg-primary';
      case 'CANCELLED':
      case 'RTO':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show search form when no tracking data
  if (!trackingData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background border-b border-border p-4 sticky top-0 z-50">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Track Order</h1>
          </div>
        </header>
        
        <div className="p-4 max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Track Your Shipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your AWB (Air Waybill) number to track your shipment
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter AWB Number"
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  className="flex-1"
                />
                <Button onClick={handleTrack} disabled={loading}>
                  {loading ? "Tracking..." : "Track"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading tracking information...</p>
            </div>
          )}

          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Where to find your AWB number?</h3>
              <p className="text-sm text-muted-foreground">
                You can find your AWB number in your order confirmation email or in your order history.
              </p>
              <Button variant="outline" onClick={() => navigate('/history')} className="mt-4">
                View Order History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { orderInformation, statuses } = trackingData;
  const latestStatus = statuses?.[0];
  const sortedStatuses = [...(statuses || [])].sort((a, b) => b.statusTimestamp - a.statusTimestamp);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Track Order</h1>
            <p className="text-sm text-muted-foreground">{orderInformation?.trackingId || currentAwb}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Search Again */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter AWB Number"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                className="flex-1"
              />
              <Button onClick={handleTrack} disabled={loading} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Current Status
              </span>
              <Badge className={getCategoryColor(latestStatus?.category)}>
                {latestStatus?.category?.replace(/_/g, ' ') || 'Unknown'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{latestStatus?.subcategory || latestStatus?.status}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatTimestamp(latestStatus?.statusTimestamp)}
            </p>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Booking Date</p>
                <p className="font-medium">{formatDate(orderInformation?.bookingDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-medium capitalize">{orderInformation?.serviceType || 'Standard'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup & Delivery Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Pickup Location</p>
                <p className="font-medium">{orderInformation?.senderDetails?.sender_name}</p>
                <p className="text-sm text-muted-foreground">
                  {orderInformation?.sourceLocation?.address}, {orderInformation?.sourceLocation?.city}, {orderInformation?.sourceLocation?.state} - {orderInformation?.sourceLocation?.pincode}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {orderInformation?.senderDetails?.sender_mobile}
                </p>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-muted-foreground/30 ml-5 h-6" />

            {/* Delivery */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <MapPin className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Delivery Location</p>
                <p className="font-medium">{orderInformation?.receiverDetails?.receiver_name}</p>
                <p className="text-sm text-muted-foreground">
                  {orderInformation?.destinationLocation?.address}, {orderInformation?.destinationLocation?.city}, {orderInformation?.destinationLocation?.state} - {orderInformation?.destinationLocation?.pincode}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {orderInformation?.receiverDetails?.receiver_mobile}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Tracking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedStatuses.map((status, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`}>
                    <CheckCircle className={`h-4 w-4 ${index === 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                        {status.category?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{status.subcategory}</p>
                    {status.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {status.location}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(status.statusTimestamp)}
                    </p>
                    {status.deliveryPartnerName && (
                      <p className="text-xs text-muted-foreground capitalize">
                        Partner: {status.deliveryPartnerName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full" onClick={() => navigate('/support')}>
            Get Help
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/history')}>
            All Orders
          </Button>
        </div>

        {latestStatus?.category?.toUpperCase() === 'DELIVERED' && (
          <Card className="border-green-500">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">Package Delivered!</h3>
              <p className="text-sm text-muted-foreground">
                Your package has been successfully delivered. Thank you for using our service!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tracking;
