import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Download, Calendar, Percent, CreditCard } from "lucide-react";

const RevenueManagement = () => {
  const revenueStats = [
    { title: "Today's Revenue", value: "$12,456", change: "+8.2%", icon: DollarSign, color: "text-green-600" },
    { title: "Platform Commission", value: "$2,491", change: "+12%", icon: Percent, color: "text-blue-600" },
    { title: "Partner Payouts", value: "$9,965", change: "+7%", icon: CreditCard, color: "text-purple-600" },
    { title: "Growth Rate", value: "15.3%", change: "+2.1%", icon: TrendingUp, color: "text-orange-600" },
  ];

  const transactions = [
    { id: "TXN-1234", orderId: "ORD-1234", partner: "Fast Delivery Co", amount: "$24.50", commission: "$4.90", payout: "$19.60", status: "Completed", date: "2024-07-24" },
    { id: "TXN-1235", orderId: "ORD-1235", partner: "Quick Transport", amount: "$18.75", commission: "$3.75", payout: "$15.00", status: "Pending", date: "2024-07-24" },
    { id: "TXN-1236", orderId: "ORD-1236", partner: "Express Logistics", amount: "$32.00", commission: "$6.40", payout: "$25.60", status: "Completed", date: "2024-07-24" },
  ];

  const partnerPayouts = [
    { partner: "Fast Delivery Co", totalOrders: 45, totalRevenue: "$1,125.50", commission: "$225.10", payout: "$900.40", status: "Paid" },
    { partner: "Quick Transport", totalOrders: 32, totalRevenue: "$856.75", commission: "$171.35", payout: "$685.40", status: "Pending" },
    { partner: "Express Logistics", totalOrders: 67, totalRevenue: "$1,789.25", commission: "$357.85", payout: "$1,431.40", status: "Paid" },
  ];

  const monthlyData = [
    { month: "January", revenue: "$45,678", commission: "$9,135", payouts: "$36,543" },
    { month: "February", revenue: "$52,341", commission: "$10,468", payouts: "$41,873" },
    { month: "March", revenue: "$48,912", commission: "$9,782", payouts: "$39,130" },
    { month: "April", revenue: "$61,234", commission: "$12,247", payouts: "$48,987" },
    { month: "May", revenue: "$67,891", commission: "$13,578", payouts: "$54,313" },
    { month: "June", revenue: "$73,456", commission: "$14,691", payouts: "$58,765" },
  ];

  const handleExportReport = (type: string) => {
    console.log("Exporting", type, "report");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": case "Paid": return "default";
      case "Pending": return "secondary";
      case "Failed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue & Commission Tracking</h2>
          <p className="text-muted-foreground">Monitor platform revenue, commissions, and partner payouts</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="today">
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
          <Button variant="outline">
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Partner Payouts</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All platform transactions with commission breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Commission (20%)</TableHead>
                    <TableHead>Partner Payout</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">{txn.id}</TableCell>
                      <TableCell>{txn.orderId}</TableCell>
                      <TableCell>{txn.partner}</TableCell>
                      <TableCell className="font-medium">{txn.amount}</TableCell>
                      <TableCell className="text-green-600">{txn.commission}</TableCell>
                      <TableCell>{txn.payout}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(txn.status)}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{txn.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Partner Payouts</CardTitle>
              <CardDescription>Weekly payout summary for all partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button>Process All Payouts</Button>
                  <Button variant="outline" onClick={() => handleExportReport("payouts")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Payouts
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Payout Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerPayouts.map((payout, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{payout.partner}</TableCell>
                      <TableCell>{payout.totalOrders}</TableCell>
                      <TableCell>{payout.totalRevenue}</TableCell>
                      <TableCell className="text-green-600">{payout.commission}</TableCell>
                      <TableCell className="font-medium">{payout.payout}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payout.status === "Pending" && (
                          <Button size="sm">Process Payment</Button>
                        )}
                        {payout.status === "Paid" && (
                          <Button size="sm" variant="outline">View Receipt</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Reports</CardTitle>
              <CardDescription>Historical revenue data and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={() => handleExportReport("monthly")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Annual Report
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Platform Commission</TableHead>
                    <TableHead>Partner Payouts</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{data.month}</TableCell>
                      <TableCell className="font-medium">{data.revenue}</TableCell>
                      <TableCell className="text-green-600">{data.commission}</TableCell>
                      <TableCell>{data.payouts}</TableCell>
                      <TableCell>
                        <Badge variant="default">+12%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Current month revenue distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span>Food Delivery</span>
                  <span className="font-medium">$45,678 (62%)</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span>Package Delivery</span>
                  <span className="font-medium">$18,234 (25%)</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span>Express Delivery</span>
                  <span className="font-medium">$9,567 (13%)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Partners</CardTitle>
                <CardDescription>Highest revenue generators this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Fast Delivery Co</div>
                    <div className="text-sm text-muted-foreground">234 orders</div>
                  </div>
                  <span className="font-medium">$12,456</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Express Logistics</div>
                    <div className="text-sm text-muted-foreground">189 orders</div>
                  </div>
                  <span className="font-medium">$9,823</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Quick Transport</div>
                    <div className="text-sm text-muted-foreground">156 orders</div>
                  </div>
                  <span className="font-medium">$7,654</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManagement;