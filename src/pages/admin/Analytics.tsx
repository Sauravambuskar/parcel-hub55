import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Package, Clock, MapPin, Download, Calendar } from "lucide-react";

const Analytics = () => {
  const kpiStats = [
    { title: "Orders Today", value: "1,234", change: "+15%", icon: Package, color: "text-blue-600" },
    { title: "Avg Delivery Time", value: "28 min", change: "-5%", icon: Clock, color: "text-green-600" },
    { title: "Active Users", value: "8,945", change: "+12%", icon: Users, color: "text-purple-600" },
    { title: "Revenue Growth", value: "+23%", change: "+3%", icon: TrendingUp, color: "text-orange-600" },
  ];

  const topPartners = [
    { name: "Fast Delivery Co", orders: 234, rating: 4.8, revenue: "$12,456", growth: "+12%" },
    { name: "Express Logistics", orders: 189, rating: 4.6, revenue: "$9,823", growth: "+8%" },
    { name: "Quick Transport", orders: 156, rating: 4.7, revenue: "$7,654", growth: "+15%" },
    { name: "Swift Delivery", orders: 134, rating: 4.5, revenue: "$6,789", growth: "+6%" },
    { name: "Rapid Logistics", orders: 98, rating: 4.4, revenue: "$5,432", growth: "+3%" },
  ];

  const regionData = [
    { region: "Downtown", orders: 456, demand: "Very High", partners: 23, avgTime: "25 min" },
    { region: "North District", orders: 334, demand: "High", partners: 18, avgTime: "32 min" },
    { region: "South Zone", orders: 289, demand: "Medium", partners: 15, avgTime: "28 min" },
    { region: "East Side", orders: 234, demand: "Medium", partners: 12, avgTime: "35 min" },
    { region: "West End", orders: 156, demand: "Low", partners: 8, avgTime: "42 min" },
  ];

  const timeSlotAnalysis = [
    { timeSlot: "6:00 - 9:00 AM", orders: 89, demand: "Medium", efficiency: "92%" },
    { timeSlot: "9:00 - 12:00 PM", orders: 234, demand: "High", efficiency: "85%" },
    { timeSlot: "12:00 - 3:00 PM", orders: 456, demand: "Very High", efficiency: "78%" },
    { timeSlot: "3:00 - 6:00 PM", orders: 298, demand: "High", efficiency: "88%" },
    { timeSlot: "6:00 - 9:00 PM", orders: 345, demand: "Very High", efficiency: "82%" },
    { timeSlot: "9:00 PM - 12:00 AM", orders: 123, demand: "Medium", efficiency: "95%" },
  ];

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "Very High": return "destructive";
      case "High": return "default";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  const handleExportReport = (type: string) => {
    console.log("Exporting", type, "report");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
          <p className="text-muted-foreground">Comprehensive platform analytics and performance metrics</p>
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
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span> from yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance KPIs</TabsTrigger>
          <TabsTrigger value="partners">Partner Analytics</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Analysis</TabsTrigger>
          <TabsTrigger value="time">Time-based Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Order Trends</CardTitle>
                <CardDescription>Order volume and completion rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Total Orders</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <div className="text-green-600">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Completion Rate</p>
                    <p className="text-2xl font-bold">94.2%</p>
                  </div>
                  <Badge variant="default">+2.3%</Badge>
                </div>
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Customer Satisfaction</p>
                    <p className="text-2xl font-bold">4.7/5</p>
                  </div>
                  <Badge variant="default">+0.2</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Financial performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Daily Revenue</p>
                    <p className="text-2xl font-bold">$45,678</p>
                  </div>
                  <Badge variant="default">+23%</Badge>
                </div>
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Average Order Value</p>
                    <p className="text-2xl font-bold">$37.02</p>
                  </div>
                  <Badge variant="default">+5%</Badge>
                </div>
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Platform Commission</p>
                    <p className="text-2xl font-bold">$9,136</p>
                  </div>
                  <Badge variant="default">+20%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Partners</CardTitle>
              <CardDescription>Partner performance rankings and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPartners.map((partner, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {partner.orders} orders • {partner.rating}/5 rating
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{partner.revenue}</p>
                      <Badge variant="default">{partner.growth}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => handleExportReport("partners")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Partner Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic">
          <Card>
            <CardHeader>
              <CardTitle>Region-wise Demand Analysis</CardTitle>
              <CardDescription>Geographic distribution of orders and demand patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {regionData.map((region, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-4">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{region.region}</p>
                        <p className="text-sm text-muted-foreground">
                          {region.partners} partners • Avg: {region.avgTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{region.orders} orders</p>
                        <Badge variant={getDemandColor(region.demand)}>
                          {region.demand}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Heat Map Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Downtown shows highest demand during lunch hours (12-2 PM)</li>
                  <li>• North District needs more partner coverage for faster delivery</li>
                  <li>• West End represents growth opportunity with low competition</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Time-based Performance Analysis</CardTitle>
              <CardDescription>Order patterns and efficiency across different time slots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSlotAnalysis.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{slot.timeSlot}</p>
                        <p className="text-sm text-muted-foreground">
                          Efficiency: {slot.efficiency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{slot.orders} orders</p>
                        <Badge variant={getDemandColor(slot.demand)}>
                          {slot.demand}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Peak Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    Lunch (12-3 PM) and dinner (6-9 PM) represent 65% of daily orders
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Optimization Opportunity</h4>
                  <p className="text-sm text-muted-foreground">
                    Late night orders (9 PM+) show highest efficiency due to lower traffic
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;