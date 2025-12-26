import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin, Phone, CheckCircle, Clock, Truck, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PRAYOG_CONFIG } from "@/config/prayog";
import { Skeleton } from "@/components/ui/skeleton";

interface TrackingStatus {
  trackingId: string;
  status: string;
  location?: string;
  deliveryPartnerName: string;
  statusTimestamp: number;
  event: string;
  movement_type: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  subcategory: string;
}

interface LocationInfo {
  address: string;
  city: string;
  landmark: string;
  pincode: string;
  state: string;
}

interface OrderInformation {
  trackingId: string;
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
  bookingDate: string;
  type: string;
  serviceType: string;
}

interface TrackingResponse {
  orderInformation: OrderInformation;
  statuses: TrackingStatus[];
}

const Tracking = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!orderId) return;

      try {
        const authData = localStorage.getItem('prayog_auth');
        if (!authData) {
          navigate('/login');
          return;
        }

        const { id_token, tenantId } = JSON.parse(authData);

        const response = await fetch(`${PRAYOG_CONFIG.API_BASE_URL}/gateway/tracking/v2/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${id_token}`,
            'tenantId': tenantId,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tracking data');
        }

        const data = await response.json();
        setTrackingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [orderId, navigate]);

  const getStatusIcon = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ORDER_CONFIRMED':
        return <CheckCircle className="h-5 w-5" />;
      case 'READY_FOR_DISPATCH':
        return <Package className="h-5 w-5" />;
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return <Truck className="h-5 w-5" />;
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ORDER_CONFIRMED':
        return 'bg-blue-500';
      case 'READY_FOR_DISPATCH':
        return 'bg-yellow-500';
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'bg-orange-500';
      case 'DELIVERED':
        return 'bg-green-500';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrentStatus = () => {
    if (!trackingData?.statuses?.length) return null;
    return trackingData.statuses[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
          </div>
        </header>
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Track Order</h1>
          </div>
        </header>
        <div className="p-4 max-w-md mx-auto">
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => navigate(-1)} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStatus = getCurrentStatus();
  const sortedStatuses = trackingData?.statuses?.sort((a, b) => b.statusTimestamp - a.statusTimestamp) || [];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Track Order</h1>
            <p className="text-sm text-muted-foreground">
              {trackingData?.orderInformation?.trackingId || orderId}
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Current Status Card */}
        {currentStatus && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Current Status
                </span>
                <Badge className={`${getStatusColor(currentStatus.category)} text-white`}>
                  {currentStatus.category.replace(/_/g, ' ')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{currentStatus.subcategory}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(currentStatus.statusTimestamp)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sender & Receiver Info */}
        {trackingData?.orderInformation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sender */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-medium text-sm">
                    {trackingData.orderInformation.senderDetails.sender_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trackingData.orderInformation.sourceLocation.address}, {trackingData.orderInformation.sourceLocation.city}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trackingData.orderInformation.sourceLocation.state} - {trackingData.orderInformation.sourceLocation.pincode}
                  </p>
                </div>
              </div>

              <div className="border-l-2 border-dashed border-muted-foreground/30 ml-4 h-4" />

              {/* Receiver */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                  <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-medium text-sm">
                    {trackingData.orderInformation.receiverDetails.receiver_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trackingData.orderInformation.destinationLocation.address}, {trackingData.orderInformation.destinationLocation.city}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trackingData.orderInformation.destinationLocation.state} - {trackingData.orderInformation.destinationLocation.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracking Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedStatuses.map((status, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${getStatusColor(status.category)} text-white`}>
                      {getStatusIcon(status.category)}
                    </div>
                    {index < sortedStatuses.length - 1 && (
                      <div className="w-0.5 h-full min-h-8 bg-muted-foreground/30 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-sm">
                      {status.category.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {status.subcategory}
                    </p>
                    {status.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {status.location}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(status.statusTimestamp)}
                    </p>
                    {status.deliveryPartnerName && (
                      <p className="text-xs text-muted-foreground">
                        via {status.deliveryPartnerName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        {trackingData?.orderInformation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Sender</p>
                  <p className="text-sm text-muted-foreground">
                    {trackingData.orderInformation.senderDetails.sender_name} • {trackingData.orderInformation.senderDetails.sender_mobile}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Receiver</p>
                  <p className="text-sm text-muted-foreground">
                    {trackingData.orderInformation.receiverDetails.receiver_name} • {trackingData.orderInformation.receiverDetails.receiver_mobile}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Call Support
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/support')}>
            Get Help
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tracking;