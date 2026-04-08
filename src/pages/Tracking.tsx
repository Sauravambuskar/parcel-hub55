import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, MapPin, Clock, Phone, CheckCircle, Truck, Calendar, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG, CURRENT_ENV } from "@/config/environment";
import { supabase } from "@/integrations/supabase/client";
import TrackingSearchIllustration from "@/components/illustrations/TrackingSearchIllustration";
import PageBackground from "@/components/PageBackground";

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
      <div className="min-h-screen relative">
        <PageBackground variant="logistics" opacity={0.75} />
        
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4 sticky top-0 z-50">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">Track Order</h1>
          </div>
        </header>
        
        <div className="p-4 max-w-4xl mx-auto space-y-6 relative z-10">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Search className="h-5 w-5 text-primary" />
                Track Your Shipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TrackingSearchIllustration className="my-4" />
              <p className="text-sm text-white/70 text-center">
                Enter your AWB (Air Waybill) number to track your shipment in real-time
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter AWB Number"
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
                <Button onClick={handleTrack} disabled={loading}>
                  {loading ? "Tracking..." : "Track"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <div className="space-y-4">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-white/20" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-full bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/20" />
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-white/50" />
              <h3 className="font-semibold mb-2 text-white">Where to find your AWB number?</h3>
              <p className="text-sm text-white/70">
                You can find your AWB number in your order confirmation email or in your order history.
              </p>
              <Button variant="outline" onClick={() => navigate('/history')} className="mt-4 bg-white/10 border-white/30 text-white hover:bg-white/20">
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
    <div className="min-h-screen relative">
      <PageBackground variant="logistics" opacity={0.75} />
      
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Track Order</h1>
            <p className="text-sm text-white/70">{orderInformation?.trackingId || currentAwb}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-4xl mx-auto relative z-10">
        {/* Search Again */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter AWB Number"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
              <Button onClick={handleTrack} disabled={loading} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-white">
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
            <p className="text-lg font-medium text-white">{latestStatus?.subcategory || latestStatus?.status}</p>
            <p className="text-sm text-white/70 mt-1">
              {formatTimestamp(latestStatus?.statusTimestamp)}
            </p>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Truck className="h-5 w-5 text-primary" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-white/50" />
              <div>
                <p className="text-sm text-white/60">Booking Date</p>
                <p className="font-medium text-white">{formatDate(orderInformation?.bookingDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-white/50" />
              <div>
                <p className="text-sm text-white/60">Service Type</p>
                <p className="font-medium capitalize text-white">{orderInformation?.serviceType || 'Standard'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup & Delivery Locations */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Shipment Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50">Pickup Location</p>
                <p className="font-medium text-white">{orderInformation?.senderDetails?.sender_name}</p>
                <p className="text-sm text-white/70">
                  {orderInformation?.sourceLocation?.address}, {orderInformation?.sourceLocation?.city}, {orderInformation?.sourceLocation?.state} - {orderInformation?.sourceLocation?.pincode}
                </p>
                <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {orderInformation?.senderDetails?.sender_mobile}
                </p>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-white/30 ml-5 h-6" />

            {/* Delivery */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-500/20">
                <MapPin className="h-4 w-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50">Delivery Location</p>
                <p className="font-medium text-white">{orderInformation?.receiverDetails?.receiver_name}</p>
                <p className="text-sm text-white/70">
                  {orderInformation?.destinationLocation?.address}, {orderInformation?.destinationLocation?.city}, {orderInformation?.destinationLocation?.state} - {orderInformation?.destinationLocation?.pincode}
                </p>
                <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {orderInformation?.receiverDetails?.receiver_mobile}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-primary" />
              Tracking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedStatuses.map((status, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full ${index === 0 ? 'bg-primary' : 'bg-white/20'}`}>
                    <CheckCircle className={`h-4 w-4 ${index === 0 ? 'text-primary-foreground' : 'text-white/50'}`} />
                  </div>
                  <div className="flex-1 pb-4 border-b border-white/10 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                        {status.category?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm text-white">{status.subcategory}</p>
                    {status.location && (
                      <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {status.location}
                      </p>
                    )}
                    <p className="text-xs text-white/50 mt-1">
                      {formatTimestamp(status.statusTimestamp)}
                    </p>
                    {status.deliveryPartnerName && (
                      <p className="text-xs text-white/50 capitalize">
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
          <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => navigate('/support')}>
            Get Help
          </Button>
          <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => navigate('/history')}>
            All Orders
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tracking;