import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle, 
  X,
  Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  pickup: {
    address: string;
    landmark: string;
    contact: string;
  };
  delivery: {
    address: string;
    landmark: string;
    contact: string;
  };
  package: {
    type: string;
    weight: string;
    dimensions: string;
    value: string;
  };
  earnings: string;
  distance: string;
  timeWindow: string;
  requestTime: string;
  timeLeft: number;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  // Mock incoming orders
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 'ORD-2024-001',
        customer: {
          name: 'Priya Sharma',
          phone: '+91 9876543210'
        },
        pickup: {
          address: 'Shop 15, FC Road, Deccan Gymkhana',
          landmark: 'Near Goodluck Cafe',
          contact: '+91 9876543210'
        },
        delivery: {
          address: 'Flat 302, Koregaon Park Plaza',
          landmark: 'Opposite German Bakery',
          contact: '+91 9876543211'
        },
        package: {
          type: 'Electronics',
          weight: '1.2 kg',
          dimensions: '25x20x15 cm',
          value: '₹15,000'
        },
        earnings: '₹180',
        distance: '3.2 km',
        timeWindow: '2:00 PM - 4:00 PM',
        requestTime: '1:45 PM',
        timeLeft: 30
      },
      {
        id: 'ORD-2024-002',
        customer: {
          name: 'Amit Patel',
          phone: '+91 9876543212'
        },
        pickup: {
          address: 'Hinjewadi IT Park, Phase 1',
          landmark: 'Gate 3, Infosys Building',
          contact: '+91 9876543212'
        },
        delivery: {
          address: 'Baner Road, Kumar Pacific Mall',
          landmark: 'Food Court Entrance',
          contact: '+91 9876543213'
        },
        package: {
          type: 'Documents',
          weight: '0.5 kg',
          dimensions: '30x25x5 cm',
          value: '₹500'
        },
        earnings: '₹220',
        distance: '8.5 km',
        timeWindow: '3:00 PM - 5:00 PM',
        requestTime: '2:30 PM',
        timeLeft: 25
      },
      {
        id: 'ORD-2024-003',
        customer: {
          name: 'Sneha Reddy',
          phone: '+91 9876543214'
        },
        pickup: {
          address: 'Wakad Market, Shop 45',
          landmark: 'Near Dmart',
          contact: '+91 9876543214'
        },
        delivery: {
          address: 'Viman Nagar, Phoenix Mall',
          landmark: 'Main Entrance',
          contact: '+91 9876543215'
        },
        package: {
          type: 'Fashion',
          weight: '0.8 kg',
          dimensions: '35x25x10 cm',
          value: '₹3,500'
        },
        earnings: '₹160',
        distance: '12.3 km',
        timeWindow: '4:00 PM - 6:00 PM',
        requestTime: '3:15 PM',
        timeLeft: 15
      }
    ];

    setOrders(mockOrders);
    
    // Initialize timers
    const initialTimers: { [key: string]: number } = {};
    mockOrders.forEach(order => {
      initialTimers[order.id] = order.timeLeft;
    });
    setTimers(initialTimers);
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(orderId => {
          if (updated[orderId] > 0) {
            updated[orderId] -= 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAcceptOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    setTimers(prev => {
      const updated = { ...prev };
      delete updated[orderId];
      return updated;
    });
    
    toast({
      title: "Order Accepted!",
      description: "Navigate to pickup location and mark when collected.",
    });
  };

  const handleRejectOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    setTimers(prev => {
      const updated = { ...prev };
      delete updated[orderId];
      return updated;
    });
    
    toast({
      title: "Order Declined",
      description: "Order has been passed to another partner.",
      variant: "destructive",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Incoming Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {orders.length} orders waiting for your response
          </p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Available for Orders
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No pending orders
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              You're all caught up! New orders will appear here when available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {order.id}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={timers[order.id] <= 10 ? "destructive" : "outline"}
                      className="font-mono"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(timers[order.id] || 0)}
                    </Badge>
                    <Badge variant="secondary" className="text-green-600">
                      {order.earnings}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Customer Info */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.phone}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>

                {/* Pickup & Delivery */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup Location
                    </h4>
                    <p className="text-sm">{order.pickup.address}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{order.pickup.landmark}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Location
                    </h4>
                    <p className="text-sm">{order.delivery.address}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{order.delivery.landmark}</p>
                  </div>
                </div>

                {/* Package Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-medium">{order.package.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Weight</p>
                    <p className="font-medium">{order.package.weight}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Distance</p>
                    <p className="font-medium">{order.distance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Window</p>
                    <p className="font-medium">{order.timeWindow}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleAcceptOrder(order.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Order
                  </Button>
                  <Button 
                    onClick={() => handleRejectOrder(order.id)}
                    variant="outline" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button variant="outline" size="icon">
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;