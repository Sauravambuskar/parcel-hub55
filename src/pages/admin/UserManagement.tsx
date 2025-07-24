import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, UserX, Eye } from "lucide-react";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", type: "Customer", status: "Active", orders: 23, joinDate: "2024-01-15" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", type: "Customer", status: "Active", orders: 45, joinDate: "2024-02-20" },
    { id: 3, name: "Bob Wilson", email: "bob@example.com", type: "Customer", status: "Suspended", orders: 12, joinDate: "2024-03-10" },
  ];

  const partners = [
    { id: 1, name: "Fast Delivery Co", email: "contact@fastdelivery.com", status: "Active", orders: 234, rating: 4.8, joinDate: "2024-01-05" },
    { id: 2, name: "Quick Transport", email: "info@quicktransport.com", status: "Pending", orders: 0, rating: 0, joinDate: "2024-07-20" },
    { id: 3, name: "Express Logistics", email: "support@expresslog.com", status: "Active", orders: 156, rating: 4.6, joinDate: "2024-02-15" },
  ];

  const handleApprovePartner = (id: number) => {
    console.log("Approving partner:", id);
  };

  const handleRejectPartner = (id: number) => {
    console.log("Rejecting partner:", id);
  };

  const handleSuspendUser = (id: number) => {
    console.log("Suspending user:", id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User & Partner Management</h2>
        <p className="text-muted-foreground">Manage users, partners, and approve applications</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="pending">Pending Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "destructive"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.orders}</TableCell>
                      <TableCell>{user.joinDate}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={user.status === "Active" ? "destructive" : "default"}
                          onClick={() => handleSuspendUser(user.id)}
                        >
                          {user.status === "Active" ? "Suspend" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Partner Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.filter(p => p.status !== "Pending").map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{partner.email}</TableCell>
                      <TableCell>
                        <Badge variant={partner.status === "Active" ? "default" : "secondary"}>
                          {partner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{partner.orders}</TableCell>
                      <TableCell>{partner.rating > 0 ? `${partner.rating}/5` : "N/A"}</TableCell>
                      <TableCell>{partner.joinDate}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          Suspend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Partner Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Application Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.filter(p => p.status === "Pending").map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{partner.email}</TableCell>
                      <TableCell>{partner.joinDate}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleApprovePartner(partner.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRejectPartner(partner.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
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

export default UserManagement;