import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Package, Clock, AlertCircle, CheckCircle, MapPin, User, Eye, Search, IndianRupee, Truck, Phone, Calendar, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Booking {
  id: string;
  tracking_id: string | null;
  status: string | null;
  courier_name: string;
  courier_price: number;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_city: string;
  sender_state: string;
  sender_pincode: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_city: string;
  receiver_state: string;
  receiver_pincode: string;
  goods_type: string;
  package_weight: string;
  urgency: string;
  delivery_time: string;
  shipment_value: number | null;
  insurance_required: boolean | null;
  packaging_required: boolean | null;
  created_at: string;
  updated_at: string;
  length: string | null;
  width: string | null;
  height: string | null;
  base_fare?: number;
  platform_fee?: number;
  prayog_commission?: number;
  gst?: number;
  insurance_amount?: number;
  packaging_amount?: number;
  payment_id?: string;
  payment_status?: string;
  prayog_order_id?: string;
  prayog_awb?: string;
}

const OrderMonitoring = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching bookings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "default";
      case "in_transit": case "in transit": return "secondary";
      case "picked_up": case "picked up": return "outline";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return "Pending";
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.tracking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.receiver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "pending") return matchesSearch && booking.status === "pending";
    if (selectedFilter === "in_transit") return matchesSearch && (booking.status === "in_transit" || booking.status === "in transit");
    if (selectedFilter === "delivered") return matchesSearch && booking.status === "delivered";
    if (selectedFilter === "cop_pending") return matchesSearch && booking.payment_status === "cop_pending";
    return matchesSearch;
  });

  const stats = [
    { 
      title: "Total Orders", 
      value: bookings.length.toString(), 
      icon: Package, 
      color: "text-blue-600" 
    },
    { 
      title: "In Transit", 
      value: bookings.filter(b => b.status === "in_transit" || b.status === "in transit").length.toString(), 
      icon: Truck, 
      color: "text-green-600" 
    },
    { 
      title: "Pending", 
      value: bookings.filter(b => b.status === "pending" || !b.status).length.toString(), 
      icon: Clock, 
      color: "text-yellow-600" 
    },
    { 
      title: "Delivered", 
      value: bookings.filter(b => b.status === "delivered").length.toString(), 
      icon: CheckCircle, 
      color: "text-purple-600" 
    },
  ];

  const calculatePriceBreakdown = (booking: Booking) => {
    const courierPrice = Number(booking.courier_price) || 0;
    const platformFee = Number(booking.platform_fee) || 0;
    const prayogCommission = Number(booking.prayog_commission) || 0;
    const gst = Number(booking.gst) || 0;
    const insurance = Number(booking.insurance_amount) || 0;
    const packaging = Number(booking.packaging_amount) || 0;
    // Partner payable = real base_fare when stored, else derive from total
    const baseFare = booking.base_fare != null && Number(booking.base_fare) > 0
      ? Number(booking.base_fare)
      : Math.max(0, courierPrice - platformFee - gst - insurance - packaging);

    return {
      baseFare,
      platformFee,
      prayogCommission,
      gst,
      insurance,
      packaging,
      total: courierPrice,
    };
  };

  const openDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Order Monitoring</h2>
        <p className="text-muted-foreground">Real-time order tracking with complete visibility</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name, or tracking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cop_pending">💵 COP Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchBookings}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders ({bookings.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({bookings.filter(b => b.status !== "delivered").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({bookings.filter(b => b.status === "delivered").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Complete list of all bookings with pricing details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No orders found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Receiver</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">{booking.id.slice(0, 8)}...</span>
                              {booking.tracking_id && (
                                <span className="text-xs font-medium text-primary">{booking.tracking_id}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(booking.created_at), "dd MMM yyyy")}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(booking.created_at), "HH:mm")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.sender_name}</span>
                              <span className="text-xs text-muted-foreground">{booking.sender_city}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.receiver_name}</span>
                              <span className="text-xs text-muted-foreground">{booking.receiver_city}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <span>{booking.sender_pincode}</span>
                              <span>→</span>
                              <span>{booking.receiver_pincode}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{booking.courier_name}</TableCell>
                          <TableCell className="font-medium">
                            ₹{booking.courier_price?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={getStatusColor(booking.status)}>
                                {getStatusLabel(booking.status)}
                              </Badge>
                              {booking.payment_status === 'cop_pending' && (
                                <Badge className="bg-yellow-500 text-yellow-950 text-xs">💵 COP</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openDetails(booking)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>Orders in progress</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Sender → Receiver</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>ETA</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.filter(b => b.status !== "delivered").map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.tracking_id || booking.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            {booking.sender_city} → {booking.receiver_city}
                          </TableCell>
                          <TableCell>{booking.courier_name}</TableCell>
                          <TableCell>{booking.delivery_time}</TableCell>
                          <TableCell className="font-medium">₹{booking.courier_price}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={getStatusColor(booking.status)}>
                                {getStatusLabel(booking.status)}
                              </Badge>
                              {booking.payment_status === 'cop_pending' && (
                                <Badge className="bg-yellow-500 text-yellow-950 text-xs">💵 COP</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openDetails(booking)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
              <CardDescription>Successfully delivered orders</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Completed On</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.filter(b => b.status === "delivered").map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.tracking_id || booking.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>{format(new Date(booking.updated_at), "dd MMM yyyy")}</TableCell>
                          <TableCell>{booking.sender_city} → {booking.receiver_city}</TableCell>
                          <TableCell>{booking.courier_name}</TableCell>
                          <TableCell className="font-medium">₹{booking.courier_price}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openDetails(booking)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedBooking?.tracking_id && (
                <span className="font-medium">Tracking: {selectedBooking.tracking_id}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <Badge variant={getStatusColor(selectedBooking.status)} className="mt-1">
                    {getStatusLabel(selectedBooking.status)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(selectedBooking.created_at), "dd MMM yyyy, HH:mm")}</p>
                </div>
              </div>

              {/* Price Breakdown - Admin Only View */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Price Breakdown (Admin View)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const breakdown = calculatePriceBreakdown(selectedBooking);
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Fare (Courier Cost)</span>
                          <span className="font-medium">₹{breakdown.baseFare.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee</span>
                          <span className="font-medium">₹{breakdown.platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prayog Commission</span>
                          <span className="font-medium">₹{breakdown.prayogCommission.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GST (18%)</span>
                          <span className="font-medium">₹{breakdown.gst.toLocaleString()}</span>
                        </div>
                        {selectedBooking.insurance_required && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Insurance</span>
                            <span className="font-medium">₹{breakdown.insurance.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedBooking.packaging_required && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Packaging</span>
                            <span className="font-medium">₹{breakdown.packaging.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount</span>
                          <span className="text-primary">₹{breakdown.total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Sender & Receiver Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      Pickup (Sender)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedBooking.sender_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.sender_phone}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {selectedBooking.sender_address}
                      <br />
                      {selectedBooking.sender_city}, {selectedBooking.sender_state} - {selectedBooking.sender_pincode}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      Delivery (Receiver)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedBooking.receiver_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.receiver_phone}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {selectedBooking.receiver_address}
                      <br />
                      {selectedBooking.receiver_city}, {selectedBooking.receiver_state} - {selectedBooking.receiver_pincode}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Package & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Package Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Goods Type</span>
                      <span className="font-medium capitalize">{selectedBooking.goods_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight</span>
                      <span className="font-medium">{selectedBooking.package_weight} kg</span>
                    </div>
                    {(selectedBooking.length || selectedBooking.width || selectedBooking.height) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimensions</span>
                        <span className="font-medium">
                          {selectedBooking.length} × {selectedBooking.width} × {selectedBooking.height} cm
                        </span>
                      </div>
                    )}
                    {selectedBooking.shipment_value && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Declared Value</span>
                        <span className="font-medium">₹{selectedBooking.shipment_value.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Insurance</span>
                      <Badge variant={selectedBooking.insurance_required ? "default" : "outline"}>
                        {selectedBooking.insurance_required ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Packaging</span>
                      <Badge variant={selectedBooking.packaging_required ? "default" : "outline"}>
                        {selectedBooking.packaging_required ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courier</span>
                      <span className="font-medium">{selectedBooking.courier_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Urgency</span>
                      <Badge variant="outline" className="capitalize">{selectedBooking.urgency}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Delivery</span>
                      <span className="font-medium">{selectedBooking.delivery_time}</span>
                    </div>
                    {selectedBooking.prayog_order_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prayog Order ID</span>
                        <span className="font-medium text-xs">{selectedBooking.prayog_order_id}</span>
                      </div>
                    )}
                    {selectedBooking.prayog_awb && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AWB Number</span>
                        <span className="font-medium">{selectedBooking.prayog_awb}</span>
                      </div>
                    )}
                    {selectedBooking.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment ID</span>
                        <span className="font-medium text-xs">{selectedBooking.payment_id}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              {(selectedBooking.tracking_id || selectedBooking.prayog_awb) && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`/admin/tracking?id=${selectedBooking.prayog_awb || selectedBooking.tracking_id}`, '_self')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Track in Admin
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderMonitoring;