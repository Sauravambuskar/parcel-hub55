import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

  // Mock order history data
  const orders = [
    {
      id: "BK1703234567",
      date: "Dec 22, 2024",
      from: "Koregaon Park",
      to: "FC Road",
      status: "delivered",
      amount: 45,
      partner: "QuickDelivery Pune"
    },
    {
      id: "BK1703123456",
      date: "Dec 20, 2024",
      from: "Hadapsar",
      to: "Baner",
      status: "delivered",
      amount: 52,
      partner: "SpeedyLogistics"
    },
    {
      id: "BK1702987654",
      date: "Dec 18, 2024",
      from: "Wakad",
      to: "Viman Nagar",
      status: "cancelled",
      amount: 38,
      partner: "EcoTransport"
    },
    {
      id: "BK1702876543",
      date: "Dec 15, 2024",
      from: "Camp",
      to: "Kothrud",
      status: "delivered",
      amount: 41,
      partner: "QuickDelivery Pune"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-success text-success-foreground">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "transit":
        return <Badge className="bg-warning text-warning-foreground">In Transit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate('/tracking', { state: { bookingId: orderId, courierId: 1 } });
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
          <h1 className="text-xl font-bold text-foreground">Order History</h1>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {orders.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first delivery with us
              </p>
              <Button 
                onClick={() => navigate('/booking')}
                className="bg-primary hover:bg-primary/90"
              >
                Book Your First Delivery
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Deliveries</h2>
              <p className="text-sm text-muted-foreground">{orders.length} orders</p>
            </div>

            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">#{order.id}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {order.date}
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>From: {order.from}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>To: {order.to}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-primary">₹{order.amount}</p>
                      <p className="text-xs text-muted-foreground">{order.partner}</p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewOrder(order.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/booking')}
              >
                <Package className="h-4 w-4 mr-2" />
                Book New Delivery
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;