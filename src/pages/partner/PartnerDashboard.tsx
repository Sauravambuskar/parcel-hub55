import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  DollarSign, 
  Clock, 
  Star, 
  TrendingUp, 
  MapPin,
  Truck,
  CheckCircle
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

const PartnerDashboard = () => {
  const { partner } = usePartner();

  const stats = [
    {
      title: "Today's Earnings",
      value: "₹2,840",
      change: "+12%",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Active Orders",
      value: "3",
      change: "2 pickup pending",
      icon: Package,
      trend: "neutral"
    },
    {
      title: "Completed Today",
      value: "12",
      change: "+8 from yesterday",
      icon: CheckCircle,
      trend: "up"
    },
    {
      title: "Average Rating",
      value: partner?.rating?.toString() || "4.7",
      change: "From 156 reviews",
      icon: Star,
      trend: "up"
    }
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      customer: "Priya Sharma",
      pickup: "FC Road, Pune",
      delivery: "Koregaon Park, Pune",
      amount: "₹180",
      status: "pickup_pending",
      time: "10 mins ago"
    },
    {
      id: "ORD-002", 
      customer: "Amit Patel",
      pickup: "Hinjewadi, Pune",
      delivery: "Baner, Pune",
      amount: "₹220",
      status: "in_transit",
      time: "25 mins ago"
    },
    {
      id: "ORD-003",
      customer: "Sneha Reddy",
      pickup: "Wakad, Pune",
      delivery: "Viman Nagar, Pune", 
      amount: "₹160",
      status: "delivered",
      time: "1 hour ago"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pickup_pending":
        return <Badge variant="outline" className="text-orange-600">Pickup Pending</Badge>;
      case "in_transit":
        return <Badge variant="default" className="bg-blue-600">In Transit</Badge>;
      case "delivered":
        return <Badge variant="secondary" className="text-green-600">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {partner?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your deliveries today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified Partner
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customer}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {order.pickup} → {order.delivery}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-green-600">{order.amount}</p>
                    <p className="text-xs text-gray-500">{order.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="default">
              <Truck className="h-4 w-4 mr-2" />
              View Active Orders
            </Button>
            <Button className="w-full" variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Set Availability
            </Button>
            <Button className="w-full" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Earnings
            </Button>
            <Button className="w-full" variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Rate Customers
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">87</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">98%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">On-time Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">₹12,450</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">4.8</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerDashboard;