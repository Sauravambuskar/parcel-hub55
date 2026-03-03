import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Package, Truck, CheckCircle, Clock, Phone, User, Navigation,
  RefreshCw, Search, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG } from "@/config/environment";
import { supabase } from "@/integrations/supabase/client";

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
  address: string; city: string; landmark: string; pincode: string; state: string;
}

interface TrackingData {
  orderInformation: {
    trackingId: string;
    cAwbNumber: string;
    orderId: string;
    sourceLocation: LocationInfo;
    destinationLocation: LocationInfo;
    senderDetails: { sender_mobile: string; sender_name: string };
    receiverDetails: { receiver_mobile: string; receiver_name: string };
    travelType: string;
    serviceType: string;
    bookingDate: string;
    type: string;
  };
  statuses: TrackingStatus[];
}

const RealTimeTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setTrackingId(id);
      fetchTracking(id);
    }
  }, [searchParams]);

  const fetchTracking = async (awb: string) => {
    if (!awb.trim()) return;
    setLoading(true);
    setTrackingData(null);
    try {
      const prayogAuth = localStorage.getItem('prayog_auth');
      if (!prayogAuth) {
        toast({ title: "Auth required", description: "Please log in via the main app first", variant: "destructive" });
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

      if (!response.ok) throw new Error(`Tracking API error: ${response.status}`);
      const result = await response.json();
      setTrackingData(result);
      setLastUpdate(new Date());
    } catch (error: any) {
      toast({ title: "Tracking Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (trackingId.trim()) {
      setSearchParams({ id: trackingId });
      fetchTracking(trackingId.trim());
    }
  };

  const handleRefresh = () => {
    const id = searchParams.get("id") || trackingId;
    if (id) fetchTracking(id);
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-500';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500';
      case 'IN_TRANSIT': case 'INTRANSIT': return 'bg-indigo-500';
      case 'ORDER_CONFIRMED': return 'bg-primary';
      case 'CANCELLED': case 'RTO': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (ts: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const latestStatus = trackingData?.statuses?.[0];
  const sortedStatuses = trackingData?.statuses 
    ? [...trackingData.statuses].sort((a, b) => b.statusTimestamp - a.statusTimestamp)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Real-Time Package Tracking</h2>
        <p className="text-muted-foreground">Monitor package location and status via Prayog API</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Track Package</CardTitle>
          <CardDescription>Enter AWB number to view real-time status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter AWB number..." 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !trackingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {trackingData && (
        <>
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Current Status</CardTitle></CardHeader>
              <CardContent>
                <Badge className={`${getCategoryColor(latestStatus?.category || '')} text-white`}>
                  {latestStatus?.category?.replace(/_/g, ' ') || 'Unknown'}
                </Badge>
                <p className="text-sm mt-2 font-medium">{latestStatus?.subcategory}</p>
                {latestStatus?.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />{latestStatus.location}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Shipment Details</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">AWB:</span> {trackingData.orderInformation.cAwbNumber}</p>
                  <p><span className="text-muted-foreground">Service:</span> {trackingData.orderInformation.serviceType}</p>
                  <p><span className="text-muted-foreground">Type:</span> {trackingData.orderInformation.travelType}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Last Updated</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>{formatTimestamp(latestStatus?.statusTimestamp || 0)}</p>
                  {lastUpdate && (
                    <p className="text-muted-foreground text-xs">Fetched: {lastUpdate.toLocaleTimeString()}</p>
                  )}
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5" />Tracking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedStatuses.map((status, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-2 ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {index === 0 ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        {index < sortedStatuses.length - 1 && (
                          <div className={`w-0.5 h-12 ${index === 0 ? "bg-primary" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className={`flex-1 pb-4 ${index === 0 ? "border-l-4 border-primary pl-4" : ""}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                            {status.category?.replace(/_/g, ' ')}
                          </Badge>
                          {index === 0 && <Badge variant="outline">Current</Badge>}
                        </div>
                        <p className="font-medium text-sm mt-1">{status.subcategory}</p>
                        {status.location && <p className="text-xs text-muted-foreground">{status.location}</p>}
                        <p className="text-xs text-muted-foreground">{formatTimestamp(status.statusTimestamp)}</p>
                        {status.deliveryPartnerName && (
                          <p className="text-xs text-muted-foreground capitalize">Partner: {status.deliveryPartnerName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Sender</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{trackingData.orderInformation.senderDetails.sender_name}</p>
                    <p>{trackingData.orderInformation.sourceLocation.address}, {trackingData.orderInformation.sourceLocation.city}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />{trackingData.orderInformation.senderDetails.sender_mobile}
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Receiver</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{trackingData.orderInformation.receiverDetails.receiver_name}</p>
                    <p>{trackingData.orderInformation.destinationLocation.address}, {trackingData.orderInformation.destinationLocation.city}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />{trackingData.orderInformation.receiverDetails.receiver_mobile}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default RealTimeTracking;
