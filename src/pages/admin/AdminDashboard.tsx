import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Package, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Search, MapPin, Clock, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [trackingSearch, setTrackingSearch] = useState("");

  const stats = [
    { title: "Total Users", value: "12,345", change: "+12%", icon: Users, color: "text-blue-600" },
    { title: "Active Orders", value: "2,341", change: "+8%", icon: Package, color: "text-green-600" },
    { title: "Today's Revenue", value: "₹45,678", change: "+23%", icon: DollarSign, color: "text-yellow-600" },
    { title: "Deliveries Today", value: "1,234", change: "+15%", icon: TrendingUp, color: "text-purple-600" },
  ];

  const liveOrders = [
    { id: "ORD-1001", customer: "John Doe", courier: "BlueDart", status: "In Transit", location: "Mumbai", eta: "2 hours", priority: "High" },
    { id: "ORD-1002", customer: "Sarah Wilson", courier: "Delhivery", status: "Out for Delivery", location: "Delhi", eta: "30 mins", priority: "Normal" },
    { id: "ORD-1003", customer: "Mike Johnson", courier: "DTDC", status: "Picked Up", location: "Bangalore", eta: "4 hours", priority: "High" },
    { id: "ORD-1004", customer: "Emma Brown", courier: "FedEx", status: "In Transit", location: "Pune", eta: "3 hours", priority: "Normal" },
    { id: "ORD-1005", customer: "David Lee", courier: "XpressBees", status: "Processing", location: "Chennai", eta: "5 hours", priority: "Urgent" },
  ];

  const supportTickets = [
    { id: "TKT-001", customer: "John Doe", issue: "Delivery delayed", status: "Open", priority: "High", time: "5 mins ago" },
    { id: "TKT-002", customer: "Sarah Wilson", issue: "Wrong address", status: "In Progress", priority: "Urgent", time: "15 mins ago" },
    { id: "TKT-003", customer: "Mike Johnson", issue: "Package damaged", status: "Open", priority: "High", time: "30 mins ago" },
  ];

  const handleTrackPackage = () => {
    if (trackingSearch.trim()) {
      navigate(`/admin/tracking?id=${trackingSearch}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in transit": return "default";
      case "out for delivery": return "default";
      case "picked up": return "secondary";
      case "processing": return "secondary";
      case "delivered": return "default";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "normal": return "secondary";
      default: return "secondary";
    }
  };

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
    </div>
  );
};

export default AdminDashboard;