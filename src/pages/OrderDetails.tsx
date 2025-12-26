import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin, Calendar, Truck, Weight, Box, Navigation, Download } from "lucide-react";
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
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

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

  const handleDownloadInvoice = () => {
    if (!order) return;
    
    setDownloadingInvoice(true);
    
    const pickupAddr = order.addresses?.find(a => a.type === 'PICKUP');
    const deliveryAddr = order.addresses?.find(a => a.type === 'DELIVERY');
    const shipmentData = order.shipments?.[0];
    
    const invoiceHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${order.orderId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
          .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 32px; color: #333; margin-bottom: 8px; }
          .invoice-title p { color: #666; font-size: 14px; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; }
          .info-box h3 { font-size: 14px; color: #3b82f6; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-box p { color: #333; font-size: 14px; line-height: 1.6; }
          .info-box .name { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
          .order-details { margin-bottom: 30px; }
          .order-details h3 { font-size: 18px; color: #333; margin-bottom: 15px; }
          .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .detail-item { background: #f8fafc; padding: 15px; border-radius: 8px; }
          .detail-item label { font-size: 12px; color: #666; display: block; margin-bottom: 4px; }
          .detail-item span { font-size: 14px; font-weight: 600; color: #333; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-size: 14px; }
          .items-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .items-table tr:last-child td { border-bottom: none; }
          .payment-section { background: #f8fafc; padding: 25px; border-radius: 8px; }
          .payment-section h3 { font-size: 18px; color: #333; margin-bottom: 20px; }
          .payment-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .payment-row.total { border-top: 2px solid #3b82f6; margin-top: 15px; padding-top: 15px; font-size: 18px; font-weight: bold; color: #3b82f6; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .status-processing { background: #fef3c7; color: #d97706; }
          .status-delivered { background: #d1fae5; color: #059669; }
          .status-failed { background: #fee2e2; color: #dc2626; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 0; background: white; } .invoice-container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="logo">📦 ShipEasy</div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <p>Order ID: ${order.orderId}</p>
              <p>Date: ${new Date(order.orderDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div class="info-section">
            <div class="info-box">
              <h3>Pickup Address</h3>
              ${pickupAddr ? `
                <p class="name">${pickupAddr.name}</p>
                <p>${pickupAddr.phone}</p>
                <p>${pickupAddr.street}</p>
                <p>${pickupAddr.city}, ${pickupAddr.state} - ${pickupAddr.zip}</p>
                <p>${pickupAddr.country}</p>
              ` : '<p>Not available</p>'}
            </div>
            <div class="info-box">
              <h3>Delivery Address</h3>
              ${deliveryAddr ? `
                <p class="name">${deliveryAddr.name}</p>
                <p>${deliveryAddr.phone}</p>
                <p>${deliveryAddr.street}</p>
                <p>${deliveryAddr.city}, ${deliveryAddr.state} - ${deliveryAddr.zip}</p>
                <p>${deliveryAddr.country}</p>
              ` : '<p>Not available</p>'}
            </div>
          </div>

          <div class="order-details">
            <h3>Order Details</h3>
            <div class="details-grid">
              <div class="detail-item">
                <label>AWB Number</label>
                <span>${shipmentData?.awbNumber || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <label>Delivery Type</label>
                <span>${order.deliveryPromise || 'Standard'}</span>
              </div>
              <div class="detail-item">
                <label>Status</label>
                <span class="status-badge status-${order.orderStatus?.toLowerCase()}">${order.orderStatus}</span>
              </div>
              <div class="detail-item">
                <label>Payment Type</label>
                <span>${order.payment?.type || 'N/A'}</span>
              </div>
            </div>
          </div>

          ${shipmentData ? `
            <div class="order-details">
              <h3>Shipment Information</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Dimensions (L×W×H)</th>
                    <th>Physical Weight</th>
                    <th>Volumetric Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${shipmentData.items?.[0]?.name || 'Package'} ${shipmentData.items?.[0]?.description ? `- ${shipmentData.items[0].description}` : ''}</td>
                    <td>${shipmentData.dimensions ? `${shipmentData.dimensions.length} × ${shipmentData.dimensions.width} × ${shipmentData.dimensions.height} cm` : 'N/A'}</td>
                    <td>${shipmentData.physicalWeight !== undefined ? `${shipmentData.physicalWeight} g` : 'N/A'}</td>
                    <td>${shipmentData.volumetricWeight !== undefined ? `${shipmentData.volumetricWeight.toFixed(2)} g` : 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="payment-section">
            <h3>Payment Summary</h3>
            <div class="payment-row">
              <span>Base Rate</span>
              <span>₹${order.payment?.finalAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="payment-row">
              <span>Taxes</span>
              <span>₹0.00</span>
            </div>
            <div class="payment-row">
              <span>Discount</span>
              <span>-₹0.00</span>
            </div>
            <div class="payment-row total">
              <span>Total Amount</span>
              <span>₹${order.payment?.finalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing ShipEasy!</p>
            <p>For support, contact us at support@shipeasy.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(invoiceHtml);
      newWindow.document.close();
    }
    
    setDownloadingInvoice(false);
    toast({
      title: "Success",
      description: "Invoice opened in new tab",
    });
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
                awbNumber: shipment?.awbNumber,
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

        {/* Download Invoice */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleDownloadInvoice}
          disabled={downloadingInvoice}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloadingInvoice ? "Downloading..." : "Download Invoice"}
        </Button>
      </div>
    </div>
  );
};

export default OrderDetails;
