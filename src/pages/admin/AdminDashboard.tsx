import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    { title: "Total Users", value: "12,345", change: "+12%", icon: Users, color: "text-blue-600" },
    { title: "Active Partners", value: "2,341", change: "+8%", icon: Package, color: "text-green-600" },
    { title: "Today's Revenue", value: "$45,678", change: "+23%", icon: DollarSign, color: "text-yellow-600" },
    { title: "Orders Today", value: "1,234", change: "+15%", icon: TrendingUp, color: "text-purple-600" },
  ];

  const alerts = [
    { type: "High Priority", message: "System maintenance scheduled for tonight", status: "warning" },
    { type: "New Partner", message: "5 new partner applications pending approval", status: "info" },
    { type: "Revenue Alert", message: "Daily revenue target achieved", status: "success" },
  ];

  const recentActivities = [
    { action: "New user registered", time: "2 minutes ago", user: "john@example.com" },
    { action: "Partner application approved", time: "5 minutes ago", user: "delivery_partner_123" },
    { action: "Order completed", time: "8 minutes ago", user: "Order #ORD-1234" },
    { action: "Payment processed", time: "12 minutes ago", user: "$234.56" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of platform performance and key metrics</p>
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
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>Important notifications and system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alert.status === "warning" ? "destructive" : 
                                  alert.status === "success" ? "default" : "secondary"}>
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
                {alert.status === "success" && <CheckCircle className="h-4 w-4 text-green-600 mt-1" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest platform activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;