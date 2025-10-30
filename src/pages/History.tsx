import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin, Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  tracking_id: string;
  sender_name: string;
  sender_address: string;
  sender_city: string;
  receiver_name: string;
  receiver_address: string;
  receiver_city: string;
  courier_name: string;
  courier_price: number;
  status: string;
  packaging_required: boolean;
  insurance_required: boolean;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your bookings",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'in_transit':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
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
        <p className="text-muted-foreground">Loading your bookings...</p>
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
        {bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
            <p className="text-muted-foreground mb-4">
              Start by creating your first delivery
            </p>
            <Button onClick={() => navigate('/booking')}>
              Book a Delivery
            </Button>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">
                      {booking.tracking_id}
                    </h3>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(booking.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Courier</p>
                  <p className="font-semibold">{booking.courier_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="text-sm font-medium">{booking.sender_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.sender_address}, {booking.sender_city}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-destructive mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="text-sm font-medium">{booking.receiver_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.receiver_address}, {booking.receiver_city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex gap-2">
                  {booking.packaging_required && (
                    <Badge variant="outline">Packaging</Badge>
                  )}
                  {booking.insurance_required && (
                    <Badge variant="outline">Insurance</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-lg font-semibold">
                  <DollarSign className="h-4 w-4" />
                  ₹{booking.courier_price}
                </div>
              </div>

              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/tracking', { state: { trackingId: booking.tracking_id } })}
                >
                  Track Order
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default History;