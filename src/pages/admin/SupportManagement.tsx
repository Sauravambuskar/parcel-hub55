import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Clock, AlertCircle, CheckCircle, User, Search, Plus } from "lucide-react";

const SupportManagement = () => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const supportStats = [
    { title: "Open Tickets", value: "23", change: "+3", icon: MessageSquare, color: "text-blue-600" },
    { title: "Pending Response", value: "8", change: "-2", icon: Clock, color: "text-orange-600" },
    { title: "Escalated", value: "5", change: "+1", icon: AlertCircle, color: "text-red-600" },
    { title: "Resolved Today", value: "12", change: "+4", icon: CheckCircle, color: "text-green-600" },
  ];

  const tickets = [
    { 
      id: "TKT-1234", 
      customer: "John Doe", 
      subject: "Order delivery delay", 
      priority: "High", 
      status: "Open", 
      assignee: "Sarah Wilson", 
      created: "2024-07-24 10:30",
      category: "Delivery",
      lastReply: "2 hours ago"
    },
    { 
      id: "TKT-1235", 
      customer: "Jane Smith", 
      subject: "Payment not processed", 
      priority: "Medium", 
      status: "In Progress", 
      assignee: "Mike Johnson", 
      created: "2024-07-24 09:15",
      category: "Payment",
      lastReply: "30 min ago"
    },
    { 
      id: "TKT-1236", 
      customer: "Bob Wilson", 
      subject: "App login issues", 
      priority: "Low", 
      status: "Pending", 
      assignee: "Unassigned", 
      created: "2024-07-24 08:45",
      category: "Technical",
      lastReply: "1 hour ago"
    },
    { 
      id: "TKT-1237", 
      customer: "Alice Johnson", 
      subject: "Refund request", 
      priority: "Medium", 
      status: "Resolved", 
      assignee: "Tom Brown", 
      created: "2024-07-23 16:20",
      category: "Billing",
      lastReply: "Resolved"
    },
  ];

  const agents = [
    { name: "Sarah Wilson", activeTickets: 8, avgResponseTime: "2.3 hours", rating: 4.8 },
    { name: "Mike Johnson", activeTickets: 6, avgResponseTime: "1.8 hours", rating: 4.9 },
    { name: "Tom Brown", activeTickets: 5, avgResponseTime: "3.1 hours", rating: 4.6 },
    { name: "Lisa Davis", activeTickets: 4, avgResponseTime: "1.5 hours", rating: 4.9 },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "destructive";
      case "In Progress": return "secondary";
      case "Pending": return "outline";
      case "Resolved": return "default";
      default: return "secondary";
    }
  };

  const handleAssignTicket = (ticketId: string, agent: string) => {
    console.log("Assigning ticket", ticketId, "to", agent);
  };

  const handleCloseTicket = (ticketId: string) => {
    console.log("Closing ticket", ticketId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Support Management</h2>
        <p className="text-muted-foreground">Manage customer support tickets and agent assignments</p>
      </div>

      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} from yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open Only</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="escalations">Escalations</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Support Ticket Queue</CardTitle>
              <CardDescription>Manage and assign customer support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Reply</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.customer}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.assignee}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.category}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ticket.lastReply}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        {ticket.status !== "Resolved" && (
                          <Button size="sm" variant="default">
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Dashboard</CardTitle>
              <CardDescription>Monitor support agent productivity and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Active Tickets</TableHead>
                    <TableHead>Avg Response Time</TableHead>
                    <TableHead>Customer Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.activeTickets}</TableCell>
                      <TableCell>{agent.avgResponseTime}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{agent.rating}/5</span>
                          <div className="text-yellow-500">★</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Online</Badge>
                      </TableCell>
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

        <TabsContent value="escalations">
          <Card>
            <CardHeader>
              <CardTitle>Escalated Tickets</CardTitle>
              <CardDescription>High-priority tickets requiring management attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Escalation Reason</TableHead>
                    <TableHead>Time Since Escalation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.filter(t => t.priority === "High").map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.customer}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>Customer Complaint</TableCell>
                      <TableCell>2 hours</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                        <Button size="sm" variant="default">
                          Take Over
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>FAQ Management</CardTitle>
                <CardDescription>Manage frequently asked questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">Add New FAQ</Button>
                <div className="space-y-2">
                  <div className="p-3 border rounded">
                    <p className="font-medium">How to track my order?</p>
                    <p className="text-sm text-muted-foreground">Updated 2 days ago</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Refund policy</p>
                    <p className="text-sm text-muted-foreground">Updated 1 week ago</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">How to become a partner?</p>
                    <p className="text-sm text-muted-foreground">Updated 3 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Responses</CardTitle>
                <CardDescription>Pre-written responses for common issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">Create Template</Button>
                <div className="space-y-2">
                  <div className="p-3 border rounded">
                    <p className="font-medium">Order Delay Apology</p>
                    <p className="text-sm text-muted-foreground">Used 23 times this week</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Refund Process</p>
                    <p className="text-sm text-muted-foreground">Used 15 times this week</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Technical Support</p>
                    <p className="text-sm text-muted-foreground">Used 8 times this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportManagement;