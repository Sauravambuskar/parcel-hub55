import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, UserX, Loader2, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { format } from "date-fns";

interface UserData {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  order_count: number;
  created_at: string;
  survey_source: string | null;
  survey_frequency: string | null;
  survey_courier_type: string | null;
  survey_completed_at: string | null;
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useRealtimeTable(["profiles", "bookings"], () => fetchUsers(), { channelName: "admin-user-mgmt" });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles with booking counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch booking counts for each user
      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          return {
            id: profile.id,
            full_name: profile.full_name,
            phone: profile.phone,
            email: profile.email,
            status: profile.status || 'active',
            order_count: count || 0,
            created_at: profile.created_at,
            survey_source: profile.survey_source ?? null,
            survey_frequency: profile.survey_frequency ?? null,
            survey_courier_type: profile.survey_courier_type ?? null,
            survey_completed_at: profile.survey_completed_at ?? null,
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCsv = () => {
    const headers = ["Name","Phone","Email","Status","Orders","Join Date","Heard About Us","Parcel Frequency","Courier Type","Survey Completed At"];
    const escape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filteredUsers.map(u => [
      u.full_name || "",
      u.phone || "",
      u.email || "",
      u.status,
      u.order_count,
      u.created_at ? format(new Date(u.created_at), "yyyy-MM-dd") : "",
      u.survey_source || "",
      u.survey_frequency || "",
      u.survey_courier_type || "",
      u.survey_completed_at ? format(new Date(u.survey_completed_at), "yyyy-MM-dd HH:mm") : "",
    ].map(escape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage and monitor app users</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={filteredUsers.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Heard About Us</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Courier Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || "N/A"}
                        </TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "destructive"}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.order_count}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={user.survey_source || ""}>
                          {user.survey_source || "—"}
                        </TableCell>
                        <TableCell>{user.survey_frequency || "—"}</TableCell>
                        <TableCell>{user.survey_courier_type || "—"}</TableCell>
                        <TableCell className="space-x-2">
                          <Button 
                            size="sm" 
                            variant={user.status === "active" ? "destructive" : "default"}
                            onClick={() => handleSuspendUser(user.id, user.status)}
                          >
                            {user.status === "active" ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;