import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin, Calendar, Truck, Weight, Box, Navigation } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PRAYOG_CONFIG } from "@/config/prayog";

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

interface Shipment {
  awbNumber: string;
  shipmentStatus: string;
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };
  physicalWeight?: number;
  volumetricWeight?: number;
  items?: Array<{
    name: string;
    description: string;
  }>;
}

interface Payment {
  finalAmount: number;
  type: string;
}

interface OrderDetails {
  orderId: string;
  orderDate: string;
  orderStatus: string;
  deliveryPromise: string;
  addresses?: OrderAddress[];
  shipments?: Shipment[];
  payment?: Payment;
}

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const prayogAuth = localStorage.getItem('prayog_auth');
      
      if (!prayogAuth) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view order details",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const authData = JSON.parse(prayogAuth);

      const response = await fetch(
        `${PRAYOG_CONFIG.API_BASE_URL}/gateway/booking-service/orders/${orderId}`,
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
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }

      const result = await response.json();
      setOrder(result?.data || result);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
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
      case 'processing':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'failed':
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Button onClick={() => navigate('/history')}>
            Go to Order History
          </Button>
        </Card>
      </div>
    );
  }

  const pickupAddress = order.addresses?.find(a => a.type === 'PICKUP');
  const deliveryAddress = order.addresses?.find(a => a.type === 'DELIVERY');
  const shipment = order.shipments?.[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Order Details</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tracking', { 
              state: { 
                trackingId: shipment?.awbNumber || order.orderId,
                orderId: order.orderId 
              } 
            })}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Track
          </Button>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Order Summary */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">{shipment?.awbNumber || order.orderId}</h2>
              <p className="text-sm text-muted-foreground">Order ID: {order.orderId}</p>
            </div>
            <Badge className={getStatusColor(order.orderStatus)}>
              {order.orderStatus || 'Unknown'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(order.orderDate)}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              {order.deliveryPromise || 'Standard'}
            </span>
          </div>
        </Card>

        {/* Addresses */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Addresses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Pickup Address</span>
              </div>
              {pickupAddress ? (
                <div className="text-sm">
                  <p className="font-medium">{pickupAddress.name}</p>
                  <p className="text-muted-foreground">{pickupAddress.phone}</p>
                  <p className="text-muted-foreground">
                    {pickupAddress.street}, {pickupAddress.city}
                  </p>
                  <p className="text-muted-foreground">
                    {pickupAddress.state} - {pickupAddress.zip}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not available</p>
              )}
            </div>

            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Delivery Address</span>
              </div>
              {deliveryAddress ? (
                <div className="text-sm">
                  <p className="font-medium">{deliveryAddress.name}</p>
                  <p className="text-muted-foreground">{deliveryAddress.phone}</p>
                  <p className="text-muted-foreground">
                    {deliveryAddress.street}, {deliveryAddress.city}
                  </p>
                  <p className="text-muted-foreground">
                    {deliveryAddress.state} - {deliveryAddress.zip}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not available</p>
              )}
            </div>
          </div>
        </Card>

        {/* Shipment Details */}
        {shipment && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Shipment Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shipment.dimensions && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Box className="h-4 w-4" />
                    <span className="text-xs">Dimensions</span>
                  </div>
                  <p className="text-sm font-medium">
                    {shipment.dimensions.length} x {shipment.dimensions.width} x {shipment.dimensions.height} cm
                  </p>
                </div>
              )}
              {shipment.physicalWeight !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Weight className="h-4 w-4" />
                    <span className="text-xs">Weight</span>
                  </div>
                  <p className="text-sm font-medium">{shipment.physicalWeight} g</p>
                </div>
              )}
              {shipment.volumetricWeight !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Weight className="h-4 w-4" />
                    <span className="text-xs">Volumetric</span>
                  </div>
                  <p className="text-sm font-medium">{shipment.volumetricWeight.toFixed(2)} g</p>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Status</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {shipment.shipmentStatus}
                </Badge>
              </div>
            </div>

            {shipment.items && shipment.items.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Items</p>
                {shipment.items.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    <span className="font-medium">{item.name}</span>
                    {item.description && <span> - {item.description}</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Payment Details */}
        {order.payment && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Payment Type</p>
                <p className="font-medium">{order.payment.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold text-primary">₹{order.payment.finalAmount?.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
