import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, AlertCircle, CheckCircle, MapPin, User } from "lucide-react";

const OrderMonitoring = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const orders = [
    { 
      id: "ORD-1234", 
      customer: "John Doe", 
      partner: "Fast Delivery Co", 
      courier: "Mike Johnson",
      status: "In Transit", 
      pickup: "Restaurant A", 
      delivery: "123 Main St", 
      time: "25 min",
      amount: "$24.50",
      priority: "Normal"
    },
    { 
      id: "ORD-1235", 
      customer: "Jane Smith", 
      partner: "Quick Transport", 
      courier: "Sarah Wilson",
      status: "Delayed", 
      pickup: "Store B", 
      delivery: "456 Oak Ave", 
      time: "45 min",
      amount: "$18.75",
      priority: "High"
    },
    { 
      id: "ORD-1236", 
      customer: "Bob Wilson", 
      partner: "Express Logistics", 
      courier: "Tom Brown",
      status: "Pickup", 
      pickup: "Shop C", 
      delivery: "789 Pine St", 
      time: "10 min",
      amount: "$32.00",
      priority: "Normal"
    },
    { 
      id: "ORD-1237", 
      customer: "Alice Johnson", 
      partner: "Fast Delivery Co", 
      courier: "Lisa Davis",
      status: "Delivered", 
      pickup: "Restaurant D", 
      delivery: "321 Elm St", 
      time: "Completed",
      amount: "$29.25",
      priority: "Normal"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "default";
      case "In Transit": return "secondary";
      case "Pickup": return "outline";
      case "Delayed": return "destructive";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === "High" ? "destructive" : "outline";
  };

  const handleReassignCourier = (orderId: string) => {
    console.log("Reassigning courier for order:", orderId);
  };

  const stats = [
    { title: "Active Orders", value: "12", icon: Package, color: "text-blue-600" },
    { title: "In Transit", value: "8", icon: Clock, color: "text-green-600" },
    { title: "Delayed", value: "2", icon: AlertCircle, color: "text-red-600" },
    { title: "Completed Today", value: "45", icon: CheckCircle, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Order Monitoring</h2>
        <p className="text-muted-foreground">Real-time order tracking and courier management</p>
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

      <div className="flex items-center gap-4">
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="delayed">Delayed Only</SelectItem>
            <SelectItem value="priority">High Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">Live Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="issues">Issues & Delays</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.filter(order => order.status !== "Delivered").map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.partner}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.courier}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {order.pickup} → {order.delivery}
                        </div>
                      </TableCell>
                      <TableCell>{order.time}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          Track
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleReassignCourier(order.id)}
                        >
                          Reassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Completion Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.filter(order => order.status === "Delivered").map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.partner}</TableCell>
                      <TableCell>{order.courier}</TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>Just now</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Orders with Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Delay Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.filter(order => order.status === "Delayed").map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Traffic Delay</Badge>
                      </TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.courier}</TableCell>
                      <TableCell>+20 min</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          Contact Customer
                        </Button>
                        <Button size="sm" variant="default">
                          Reassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderMonitoring;