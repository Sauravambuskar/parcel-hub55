import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Package, IndianRupee, TrendingUp, Search, MapPin, Clock, Eye, RefreshCw, Calendar, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, startOfMonth, subDays } from "date-fns";

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  monthlyOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  avgOrderValue: number;
  platformFees: number;
}

interface RecentBooking {
  id: string;
  tracking_id: string | null;
  sender_name: string;
  receiver_name: string;
  sender_city: string;
  receiver_city: string;
  courier_name: string;
  courier_price: number;
  status: string | null;
  created_at: string;
  urgency: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trackingSearch, setTrackingSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    todayOrders: 0,
    monthlyOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    avgOrderValue: 0,
    platformFees: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const today = startOfDay(new Date());
      const monthStart = startOfMonth(new Date());

      // Calculate stats
      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.courier_price || 0), 0) || 0;
      const todayBookings = bookings?.filter(b => new Date(b.created_at) >= today) || [];
      const monthlyBookings = bookings?.filter(b => new Date(b.created_at) >= monthStart) || [];
      
      const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.courier_price || 0), 0);
      const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.courier_price || 0), 0);
      
      const pendingOrders = bookings?.filter(b => b.status === "pending" || !b.status).length || 0;
      const inTransitOrders = bookings?.filter(b => b.status === "in_transit" || b.status === "in transit").length || 0;
      const deliveredOrders = bookings?.filter(b => b.status === "delivered").length || 0;

      // Platform fee calculation (assuming 10% of total)
      const platformFees = Math.round(totalRevenue * 0.1);

      setStats({
        totalOrders: bookings?.length || 0,
        todayOrders: todayBookings.length,
        monthlyOrders: monthlyBookings.length,
        totalRevenue,
        todayRevenue,
        monthlyRevenue,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
        avgOrderValue: bookings && bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
        platformFees,
      });

      // Set recent bookings (last 10)
      setRecentBookings(bookings?.slice(0, 10) || []);

    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPackage = () => {
    if (trackingSearch.trim()) {
      navigate(`/admin/tracking?id=${trackingSearch}`);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "default";
      case "in_transit": case "in transit": return "secondary";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return "Pending";
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const statCards = [
    { 
      title: "Today's Orders", 
      value: stats.todayOrders.toString(), 
      subValue: `₹${stats.todayRevenue.toLocaleString()} revenue`,
      icon: Calendar, 
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    { 
      title: "Monthly Orders", 
      value: stats.monthlyOrders.toString(), 
      subValue: `₹${stats.monthlyRevenue.toLocaleString()} revenue`,
      icon: TrendingUp, 
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    { 
      title: "Total Revenue", 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      subValue: `${stats.totalOrders} total orders`,
      icon: IndianRupee, 
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    { 
      title: "Platform Earnings", 
      value: `₹${stats.platformFees.toLocaleString()}`, 
      subValue: "10% commission",
      icon: TrendingUp, 
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
  ];

  const orderStatusCards = [
    { title: "Pending", value: stats.pendingOrders, color: "text-yellow-600", bgColor: "bg-yellow-100" },
    { title: "In Transit", value: stats.inTransitOrders, color: "text-blue-600", bgColor: "bg-blue-100" },
    { title: "Delivered", value: stats.deliveredOrders, color: "text-green-600", bgColor: "bg-green-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Real-time platform analytics and order management</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Track */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter tracking ID to track..."
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleTrackPackage()}
              />
            </div>
            <Button onClick={handleTrackPackage}>
              Track Package
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status Overview</CardTitle>
          <CardDescription>Current distribution of orders by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {orderStatusCards.map((status) => (
              <div 
                key={status.title} 
                className={`p-4 rounded-lg ${status.bgColor} text-center`}
              >
                <p className="text-3xl font-bold">{loading ? "..." : status.value}</p>
                <p className={`text-sm font-medium ${status.color}`}>{status.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
            <CardDescription>Financial summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Total Collections</p>
                <p className="text-sm text-muted-foreground">All-time revenue</p>
              </div>
              <p className="text-2xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Platform Commission (10%)</p>
                <p className="text-sm text-muted-foreground">Your earnings</p>
              </div>
              <p className="text-xl font-bold text-green-600">₹{stats.platformFees.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Average Order Value</p>
                <p className="text-sm text-muted-foreground">Per booking</p>
              </div>
              <p className="text-xl font-bold">₹{stats.avgOrderValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span>Total Bookings</span>
              </div>
              <span className="font-bold text-xl">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span>Delivery Success Rate</span>
              </div>
              <span className="font-bold text-xl text-green-600">
                {stats.totalOrders > 0 
                  ? `${Math.round((stats.deliveredOrders / stats.totalOrders) * 100)}%` 
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>Pending Dispatch</span>
              </div>
              <span className="font-bold text-xl text-yellow-600">{stats.pendingOrders}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest bookings on the platform</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/orders')}>
            View All Orders
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
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
                        {format(new Date(booking.created_at), "dd MMM, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {booking.sender_city} → {booking.receiver_city}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{booking.courier_name}</TableCell>
                      <TableCell className="font-medium">₹{booking.courier_price?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => navigate('/admin/orders')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.tracking_id && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => navigate(`/admin/tracking?id=${booking.tracking_id}`)}
                              title="Track package"
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;