import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, Download, Percent, CreditCard, Package, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns";

interface Booking {
  id: string;
  tracking_id: string | null;
  courier_name: string;
  courier_price: number;
  status: string | null;
  created_at: string;
  sender_name: string;
  receiver_name: string;
  base_fare?: number;
  platform_fee?: number;
  prayog_commission?: number;
  gst?: number;
  payment_status?: string;
}

const RevenueManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
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
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "week":
        startDate = startOfWeek(now);
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "year":
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = startOfDay(now);
    }

    return bookings.filter(b => new Date(b.created_at) >= startDate);
  };

  const filteredBookings = getFilteredBookings();

  // Calculate revenue stats
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.courier_price || 0), 0);
  const platformCommission = Math.round(totalRevenue * 0.1); // 10% platform fee
  const prayogCommission = Math.round(totalRevenue * 0.05); // 5% Prayog commission
  const gstCollected = Math.round(totalRevenue * 0.18 / 1.18); // GST from total
  const netRevenue = platformCommission; // Your actual earnings

  const revenueStats = [
    { 
      title: "Total Collections", 
      value: `₹${totalRevenue.toLocaleString()}`, 
      change: `${filteredBookings.length} orders`, 
      icon: IndianRupee, 
      color: "text-green-600" 
    },
    { 
      title: "Platform Commission (10%)", 
      value: `₹${platformCommission.toLocaleString()}`, 
      change: "Your earnings", 
      icon: Percent, 
      color: "text-blue-600" 
    },
    { 
      title: "Prayog Commission (5%)", 
      value: `₹${prayogCommission.toLocaleString()}`, 
      change: "Partner share", 
      icon: CreditCard, 
      color: "text-purple-600" 
    },
    { 
      title: "GST Collected", 
      value: `₹${gstCollected.toLocaleString()}`, 
      change: "18% GST", 
      icon: TrendingUp, 
      color: "text-orange-600" 
    },
  ];

  // Calculate per-transaction breakdown
  const getTransactionBreakdown = (booking: Booking) => {
    const total = booking.courier_price || 0;
    const baseFare = booking.base_fare || Math.round(total * 0.67);
    const platformFee = booking.platform_fee || Math.round(total * 0.10);
    const prayogFee = booking.prayog_commission || Math.round(total * 0.05);
    const gst = booking.gst || Math.round(total * 0.18 / 1.18);
    
    return { baseFare, platformFee, prayogFee, gst, total };
  };

  // Monthly revenue data
  const getMonthlyData = () => {
    const monthlyMap = new Map<string, { revenue: number; orders: number; commission: number }>();
    
    bookings.forEach(booking => {
      const monthKey = format(new Date(booking.created_at), "MMM yyyy");
      const existing = monthlyMap.get(monthKey) || { revenue: 0, orders: 0, commission: 0 };
      monthlyMap.set(monthKey, {
        revenue: existing.revenue + (booking.courier_price || 0),
        orders: existing.orders + 1,
        commission: existing.commission + Math.round((booking.courier_price || 0) * 0.1),
      });
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .slice(0, 6);
  };

  const monthlyData = getMonthlyData();

  const handleExportReport = () => {
    // Create CSV content
    const headers = ["Order ID", "Date", "Courier", "Total", "Platform Fee", "Prayog Commission", "GST", "Status"];
    const rows = filteredBookings.map(b => {
      const breakdown = getTransactionBreakdown(b);
      return [
        b.tracking_id || b.id.slice(0, 8),
        format(new Date(b.created_at), "dd/MM/yyyy"),
        b.courier_name,
        breakdown.total,
        breakdown.platformFee,
        breakdown.prayogFee,
        breakdown.gst,
        b.status || "pending"
      ].join(",");
    });
    
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${dateRange}.csv`;
    a.click();
    
    toast({ title: "Report exported successfully" });
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "default";
      case "pending": return "secondary";
      case "in_transit": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue & Commission Tracking</h2>
          <p className="text-muted-foreground">Complete financial breakdown with price splits</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchBookings}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
          <TabsTrigger value="breakdown">Price Breakdown</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete list with commission breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No transactions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Platform Fee (10%)</TableHead>
                        <TableHead>Prayog (5%)</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => {
                        const breakdown = getTransactionBreakdown(booking);
                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              {booking.tracking_id || booking.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>{format(new Date(booking.created_at), "dd MMM yyyy")}</TableCell>
                            <TableCell>{booking.courier_name}</TableCell>
                            <TableCell className="font-medium">₹{breakdown.total.toLocaleString()}</TableCell>
                            <TableCell className="text-green-600">₹{breakdown.platformFee.toLocaleString()}</TableCell>
                            <TableCell className="text-purple-600">₹{breakdown.prayogFee.toLocaleString()}</TableCell>
                            <TableCell className="text-orange-600">₹{breakdown.gst.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(booking.status)}>
                                {booking.status || "Pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Price Structure Breakdown</CardTitle>
              <CardDescription>How each order amount is distributed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Revenue Split Structure</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Base Fare</p>
                        <p className="text-sm text-muted-foreground">Courier partner cost</p>
                      </div>
                      <Badge variant="outline" className="text-lg">~67%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg bg-green-50">
                      <div>
                        <p className="font-medium text-green-700">Platform Fee</p>
                        <p className="text-sm text-muted-foreground">Your commission</p>
                      </div>
                      <Badge className="text-lg bg-green-600">10%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg bg-purple-50">
                      <div>
                        <p className="font-medium text-purple-700">Prayog Commission</p>
                        <p className="text-sm text-muted-foreground">API partner fee</p>
                      </div>
                      <Badge className="text-lg bg-purple-600">5%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg bg-orange-50">
                      <div>
                        <p className="font-medium text-orange-700">GST</p>
                        <p className="text-sm text-muted-foreground">Government tax</p>
                      </div>
                      <Badge className="text-lg bg-orange-600">18%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Example Calculation</h3>
                  <Card className="bg-muted">
                    <CardContent className="pt-6 space-y-3">
                      <p className="text-sm text-muted-foreground">For an order of ₹500:</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Fare (Courier Cost)</span>
                          <span className="font-medium">₹335</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Platform Fee (10%)</span>
                          <span className="font-medium">₹50</span>
                        </div>
                        <div className="flex justify-between text-purple-600">
                          <span>Prayog Commission (5%)</span>
                          <span className="font-medium">₹25</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>GST (18%)</span>
                          <span className="font-medium">₹90</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>₹500</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Reports</CardTitle>
              <CardDescription>Historical revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Platform Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{data.month}</TableCell>
                        <TableCell>{data.orders}</TableCell>
                        <TableCell className="font-medium">₹{data.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₹{data.commission.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Overall financial health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Lifetime Revenue</p>
                    <p className="text-sm text-muted-foreground">{bookings.length} orders</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ₹{bookings.reduce((sum, b) => sum + (b.courier_price || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Platform Earnings</p>
                    <p className="text-sm text-muted-foreground">10% commission</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    ₹{Math.round(bookings.reduce((sum, b) => sum + (b.courier_price || 0), 0) * 0.1).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Average Order Value</p>
                    <p className="text-sm text-muted-foreground">Per booking</p>
                  </div>
                  <p className="text-xl font-bold">
                    ₹{bookings.length > 0 
                      ? Math.round(bookings.reduce((sum, b) => sum + (b.courier_price || 0), 0) / bookings.length).toLocaleString()
                      : 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Couriers by Revenue</CardTitle>
                <CardDescription>Best performing courier partners</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const courierMap = new Map<string, { revenue: number; orders: number }>();
                  bookings.forEach(b => {
                    const existing = courierMap.get(b.courier_name) || { revenue: 0, orders: 0 };
                    courierMap.set(b.courier_name, {
                      revenue: existing.revenue + (b.courier_price || 0),
                      orders: existing.orders + 1,
                    });
                  });
                  const topCouriers = Array.from(courierMap.entries())
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5);

                  return topCouriers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No data</div>
                  ) : (
                    <div className="space-y-3">
                      {topCouriers.map((courier, index) => (
                        <div key={courier.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{courier.name}</p>
                              <p className="text-sm text-muted-foreground">{courier.orders} orders</p>
                            </div>
                          </div>
                          <p className="font-bold">₹{courier.revenue.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManagement;