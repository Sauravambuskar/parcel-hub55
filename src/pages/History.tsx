import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, MapPin, Calendar, Eye, Navigation, Truck, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG } from "@/config/environment";
import EmptyBoxIllustration from "@/components/illustrations/EmptyBoxIllustration";
import PageBackground from "@/components/PageBackground";

interface OrderAddress {
  type: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ShipmentDocument {
  id: number;
  type: string;
  url?: string;
  number?: string;
  date?: string;
  is_active?: boolean;
}

interface PrayogOrder {
  orderId: string;
  orderDate: string;
  orderStatus: string;
  carrierName?: string;
  carrierId?: string;
  shipments?: Array<{
    awbNumber: string;
    partnerName: string;
    shipmentStatus: string;
    documents?: ShipmentDocument[];
  }>;
  addresses?: OrderAddress[];
}

const OrderCardSkeleton = () => (
  <Card className="p-4 animate-in bg-white/10 backdrop-blur-xl border-white/20">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32 bg-white/20" />
          <Skeleton className="h-5 w-20 rounded-full bg-white/20" />
        </div>
        <Skeleton className="h-4 w-24 bg-white/20" />
        <Skeleton className="h-4 w-36 bg-white/20" />
      </div>
      <Skeleton className="h-10 w-10 rounded-md bg-white/20" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="flex items-start gap-2">
        <Skeleton className="h-4 w-4 mt-1 bg-white/20" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-12 bg-white/20" />
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="h-3 w-full bg-white/20" />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Skeleton className="h-4 w-4 mt-1 bg-white/20" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-12 bg-white/20" />
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="h-3 w-full bg-white/20" />
        </div>
      </div>
    </div>
    <Skeleton className="h-9 w-full bg-white/20" />
  </Card>
);

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<PrayogOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const prayogAuth = localStorage.getItem('prayog_auth');
      
      if (!prayogAuth) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your orders",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const authData = JSON.parse(prayogAuth);

      const response = await fetch(
        `${PRAYOG_CONFIG.API_BASE_URL}/gateway/booking-service/orders?filterByCurrentUser=true`,
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
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const result = await response.json();
      const ordersList = Array.isArray(result) ? result : (result?.orders || result?.data || []);
      setOrders(ordersList);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'delivered':
        return 'bg-green-500';
      case 'in_transit':
      case 'intransit':
      case 'shipped':
        return 'bg-blue-500';
      case 'pending':
      case 'booked':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
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

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <PageBackground variant="shipping" opacity={0.75} />
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4 sticky top-0 z-50">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-10 rounded-md bg-white/20" />
            <Skeleton className="h-7 w-32 bg-white/20" />
          </div>
        </header>
        <div className="p-4 max-w-4xl mx-auto space-y-4 relative z-10">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <PageBackground variant="shipping" opacity={0.75} />
      
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Order History</h1>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4 relative z-10">
        {orders.length === 0 ? (
          <Card className="p-8 text-center bg-white/10 backdrop-blur-xl border-white/20">
            <EmptyBoxIllustration className="mb-6" />
            <h2 className="text-xl font-semibold mb-2 text-white">No orders yet</h2>
            <p className="text-white/70 mb-6 max-w-xs mx-auto">
              Your delivery history will appear here once you book your first shipment
            </p>
            <Button onClick={() => navigate('/booking')} size="lg">
              Book Your First Delivery
            </Button>
          </Card>
        ) : (
          orders.map((order) => {
            const pickupAddress = order.addresses?.find(a => a.type === 'PICKUP');
            const deliveryAddress = order.addresses?.find(a => a.type === 'DELIVERY');
            
            const labelDocument = order.shipments?.[0]?.documents?.find(
              (doc) => doc.type === "label" && doc.url
            );
            const labelUrl = labelDocument?.url;
            
            const isShreeMaruti = order.carrierName?.toLowerCase().includes('shree maruti') || 
                                  order.carrierName?.toLowerCase().includes('shreemaruti') ||
                                  order.carrierName?.toLowerCase().includes('smcourier');
            
            const showLabelButton = labelUrl && !isShreeMaruti;
            
            return (
              <Card key={order.orderId} className="p-4 bg-white/10 backdrop-blur-xl border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-white">
                        {order.shipments?.[0]?.awbNumber || order.orderId}
                      </h3>
                      <Badge className={getStatusColor(order.orderStatus)}>
                        {order.orderStatus || 'Unknown'}
                      </Badge>
                    </div>
                    {order.carrierName && (
                      <p className="text-sm text-white/70 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {order.carrierName}
                      </p>
                    )}
                    <p className="text-sm text-white/70 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(order.orderDate)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/tracking', { 
                      state: { 
                        awbNumber: order.shipments?.[0]?.awbNumber,
                        orderId: order.orderId 
                      } 
                    })}
                    className="text-primary hover:bg-white/10"
                  >
                    <Navigation className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-white/50">Pickup</p>
                        <p className="text-sm font-medium text-white">{pickupAddress?.name || 'N/A'}</p>
                        <p className="text-xs text-white/60">
                          {pickupAddress?.street}{pickupAddress?.city ? `, ${pickupAddress.city}` : ''}{pickupAddress?.state ? `, ${pickupAddress.state}` : ''} - {pickupAddress?.zip || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-white/50">Delivery</p>
                        <p className="text-sm font-medium text-white">{deliveryAddress?.name || 'N/A'}</p>
                        <p className="text-xs text-white/60">
                          {deliveryAddress?.street}{deliveryAddress?.city ? `, ${deliveryAddress.city}` : ''}{deliveryAddress?.state ? `, ${deliveryAddress.state}` : ''} - {deliveryAddress?.zip || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {showLabelButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                      onClick={() => window.open(labelUrl, '_blank')}
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download Label
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${showLabelButton ? "flex-1" : "w-full"} bg-white/10 border-white/30 text-white hover:bg-white/20`}
                    onClick={() => navigate(`/order/${order.orderId}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default History;