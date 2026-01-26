import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, MapPin, Calendar, Eye, Navigation, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG } from "@/config/environment";
import EmptyBoxIllustration from "@/components/illustrations/EmptyBoxIllustration";

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
  }>;
  addresses?: OrderAddress[];
}

const OrderCardSkeleton = () => (
  <Card className="p-4 animate-in">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-10 w-10 rounded-md" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="flex items-start gap-2">
        <Skeleton className="h-4 w-4 mt-1" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Skeleton className="h-4 w-4 mt-1" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
    <Skeleton className="h-9 w-full" />
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
      
      // Handle the response - it could be an array or an object with orders property
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
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-7 w-32" />
          </div>
        </header>
        <div className="p-4 max-w-4xl mx-auto space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Order History</h1>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {orders.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-to-br from-muted/30 to-background border-dashed">
            <EmptyBoxIllustration className="mb-6" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
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
            
            return (
              <Card key={order.orderId} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {order.shipments?.[0]?.awbNumber || order.orderId}
                      </h3>
                      <Badge className={getStatusColor(order.orderStatus)}>
                        {order.orderStatus || 'Unknown'}
                      </Badge>
                    </div>
                    {order.carrierName && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {order.carrierName}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
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
                    className="text-primary"
                  >
                    <Navigation className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="text-sm font-medium">{pickupAddress?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {pickupAddress?.street}{pickupAddress?.city ? `, ${pickupAddress.city}` : ''}{pickupAddress?.state ? `, ${pickupAddress.state}` : ''} - {pickupAddress?.zip || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Delivery</p>
                        <p className="text-sm font-medium">{deliveryAddress?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {deliveryAddress?.street}{deliveryAddress?.city ? `, ${deliveryAddress.city}` : ''}{deliveryAddress?.state ? `, ${deliveryAddress.state}` : ''} - {deliveryAddress?.zip || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/order/${order.orderId}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default History;
