import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings, Percent, MapPin, Clock, Bell, CreditCard, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SystemSettings = () => {
  const [commissionRate, setCommissionRate] = useState("20");
  const [deliveryRadius, setDeliveryRadius] = useState("25");
  const [minOrderValue, setMinOrderValue] = useState("15");

  const cities = [
    { name: "New York", active: true, partners: 45, avgDeliveryTime: "28 min" },
    { name: "Los Angeles", active: true, partners: 38, avgDeliveryTime: "32 min" },
    { name: "Chicago", active: true, partners: 29, avgDeliveryTime: "25 min" },
    { name: "Houston", active: false, partners: 0, avgDeliveryTime: "N/A" },
  ];

  const timeSlots = [
    { time: "6:00 AM - 10:00 AM", active: true, surcharge: "0%" },
    { time: "10:00 AM - 2:00 PM", active: true, surcharge: "0%" },
    { time: "2:00 PM - 6:00 PM", active: true, surcharge: "10%" },
    { time: "6:00 PM - 10:00 PM", active: true, surcharge: "15%" },
    { time: "10:00 PM - 12:00 AM", active: true, surcharge: "25%" },
    { time: "12:00 AM - 6:00 AM", active: false, surcharge: "N/A" },
  ];

  const coupons = [
    { code: "WELCOME10", discount: "10%", type: "Percentage", expires: "2024-12-31", uses: 245, status: "Active" },
    { code: "FIRSTORDER", discount: "$5", type: "Fixed", expires: "2024-11-30", uses: 156, status: "Active" },
    { code: "WEEKEND20", discount: "20%", type: "Percentage", expires: "2024-08-31", uses: 89, status: "Active" },
    { code: "STUDENT15", discount: "15%", type: "Percentage", expires: "2024-09-30", uses: 234, status: "Paused" },
  ];

  const handleSaveSettings = () => {
    toast({
      title: "Settings Updated",
      description: "System settings have been successfully updated.",
    });
  };

  const handleAddCity = () => {
    console.log("Adding new city");
  };

  const handleAddCoupon = () => {
    console.log("Adding new coupon");
  };

  const handleToggleCity = (cityName: string) => {
    console.log("Toggling city:", cityName);
  };

  const handleDeleteCoupon = (couponCode: string) => {
    console.log("Deleting coupon:", couponCode);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System & App Settings</h2>
        <p className="text-muted-foreground">Configure platform settings, pricing, and operational parameters</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Commission</TabsTrigger>
          <TabsTrigger value="geography">Cities & Coverage</TabsTrigger>
          <TabsTrigger value="time">Time Slots</TabsTrigger>
          <TabsTrigger value="coupons">Discount Coupons</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>Basic platform settings and configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="DeliveryApp" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input id="support-email" defaultValue="support@deliveryapp.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input id="contact-phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="maintenance-mode" />
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="new-registrations" defaultChecked />
                  <Label htmlFor="new-registrations">Allow New Registrations</Label>
                </div>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Settings</CardTitle>
                <CardDescription>Configure delivery and operational parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-radius">Maximum Delivery Radius (km)</Label>
                  <Input 
                    id="delivery-radius" 
                    type="number" 
                    value={deliveryRadius}
                    onChange={(e) => setDeliveryRadius(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-order">Minimum Order Value ($)</Label>
                  <Input 
                    id="min-order" 
                    type="number" 
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-delivery-time">Maximum Delivery Time (minutes)</Label>
                  <Input id="max-delivery-time" type="number" defaultValue="60" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="real-time-tracking" defaultChecked />
                  <Label htmlFor="real-time-tracking">Real-time Tracking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-assignment" defaultChecked />
                  <Label htmlFor="auto-assignment">Auto-assign Orders</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Pricing & Commission Structure
              </CardTitle>
              <CardDescription>Configure commission rates and pricing models</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission-rate">Platform Commission (%)</Label>
                  <Input 
                    id="commission-rate" 
                    type="number" 
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-fee">Base Delivery Fee ($)</Label>
                  <Input id="delivery-fee" type="number" defaultValue="3.99" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-fee">Service Fee ($)</Label>
                  <Input id="service-fee" type="number" defaultValue="1.99" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Distance-based Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>0-5 km: Base Rate</Label>
                    <Input defaultValue="$0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>5-10 km: Additional</Label>
                    <Input defaultValue="$1.50" />
                  </div>
                  <div className="space-y-2">
                    <Label>10-15 km: Additional</Label>
                    <Input defaultValue="$2.50" />
                  </div>
                  <div className="space-y-2">
                    <Label>15+ km: Additional</Label>
                    <Input defaultValue="$3.50" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Peak Hour Surcharges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="lunch-surge" defaultChecked />
                    <Label htmlFor="lunch-surge">Lunch Hours (12-2 PM): +10%</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="dinner-surge" defaultChecked />
                    <Label htmlFor="dinner-surge">Dinner Hours (6-9 PM): +15%</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="weekend-surge" />
                    <Label htmlFor="weekend-surge">Weekends: +20%</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="weather-surge" />
                    <Label htmlFor="weather-surge">Bad Weather: +25%</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSettings}>Update Pricing</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Serviceable Cities & Pincodes
              </CardTitle>
              <CardDescription>Manage cities and areas where the platform operates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">Active Cities</h4>
                <Button onClick={handleAddCity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add City
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active Partners</TableHead>
                    <TableHead>Avg Delivery Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>
                        <Badge variant={city.active ? "default" : "secondary"}>
                          {city.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{city.partners}</TableCell>
                      <TableCell>{city.avgDeliveryTime}</TableCell>
                      <TableCell className="space-x-2">
                        <Button 
                          size="sm" 
                          variant={city.active ? "destructive" : "default"}
                          onClick={() => handleToggleCity(city.name)}
                        >
                          {city.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Delivery Time Slots
              </CardTitle>
              <CardDescription>Configure available delivery time slots and surcharges</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Surcharge</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map((slot, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{slot.time}</TableCell>
                      <TableCell>
                        <Badge variant={slot.active ? "default" : "secondary"}>
                          {slot.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{slot.surcharge}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant={slot.active ? "destructive" : "default"}
                        >
                          {slot.active ? "Disable" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Discount Coupons & Promotions
              </CardTitle>
              <CardDescription>Manage discount codes and promotional campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">Active Coupons</h4>
                <Button onClick={handleAddCoupon}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Coupon
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{coupon.code}</TableCell>
                      <TableCell>{coupon.discount}</TableCell>
                      <TableCell>{coupon.type}</TableCell>
                      <TableCell>{coupon.expires}</TableCell>
                      <TableCell>{coupon.uses}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.status === "Active" ? "default" : "secondary"}>
                          {coupon.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteCoupon(coupon.code)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notification Settings
              </CardTitle>
              <CardDescription>Configure push notification content and triggers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Order Notifications</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="order-confirmed">Order Confirmed</Label>
                    <Textarea 
                      id="order-confirmed" 
                      defaultValue="Your order has been confirmed! We'll notify you when it's on the way."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-picked">Order Picked Up</Label>
                    <Textarea 
                      id="order-picked" 
                      defaultValue="Your order is on the way! Track your delivery in real-time."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-delivered">Order Delivered</Label>
                    <Textarea 
                      id="order-delivered" 
                      defaultValue="Your order has been delivered! Thank you for choosing us."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Marketing Notifications</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="promo-notification">Promotional Offers</Label>
                    <Textarea 
                      id="promo-notification" 
                      defaultValue="🎉 Special offer just for you! Get 20% off your next order."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcome-notification">Welcome Message</Label>
                    <Textarea 
                      id="welcome-notification" 
                      defaultValue="Welcome to our app! Enjoy fast delivery at your fingertips."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Notification Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="push-enabled" defaultChecked />
                    <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="email-notifications" defaultChecked />
                    <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sms-notifications" />
                    <Label htmlFor="sms-notifications">Enable SMS Notifications</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSettings}>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;