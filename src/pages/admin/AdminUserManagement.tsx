import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address").refine(
  (email) => email.endsWith("@viasetu.com"),
  { message: "Only @viasetu.com email addresses are allowed for admin users" }
);

type AdminUser = {
  id: string;
  email: string;
  role: "super_admin" | "support";
  created_at: string;
  is_active: boolean;
};

const AdminUserManagement = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"support" | "super_admin">("support");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    fetchAdminUsers();
    fetchCurrentUserRole();
  }, []);

  const fetchCurrentUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      if (data) {
        setCurrentUserRole(data.role);
      }
    }
  };

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      toast.error("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailValidation = emailSchema.safeParse(newUserEmail);
    if (!emailValidation.success) {
      toast.error(emailValidation.error.errors[0].message);
      return;
    }

    try {
      // Create auth user with a temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + "A1@";
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail.trim(),
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create user");
        return;
      }

      // Add to admin_users table
      const { error: insertError } = await supabase
        .from("admin_users")
        .insert({
          user_id: authData.user.id,
          email: newUserEmail.trim(),
          role: newUserRole,
          is_active: true,
        });

      if (insertError) {
        toast.error(insertError.message);
        return;
      }

      // Send password reset email so user can set their own password
      await supabase.auth.resetPasswordForEmail(newUserEmail.trim(), {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      toast.success(`Admin user created successfully. A password reset email has been sent to ${newUserEmail}`);
      setIsAddDialogOpen(false);
      setNewUserEmail("");
      setNewUserRole("support");
      fetchAdminUsers();
    } catch (error) {
      console.error("Error creating admin user:", error);
      toast.error("Failed to create admin user");
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchAdminUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user status");
    }
  };

  const isSuperAdmin = currentUserRole === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin User Management</h2>
          <p className="text-muted-foreground">Manage admin and support team members</p>
        </div>
        {isSuperAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin User</DialogTitle>
                <DialogDescription>
                  Create a new admin or support user. Only @viasetu.com emails are allowed.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@viasetu.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={(value: "support" | "super_admin") => setNewUserRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Support: Limited access for customer support. Super Admin: Full access to all features.
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  Create User
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Users
          </CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? "Manage all admin and support users with @viasetu.com email addresses"
              : "View admin users (Super admin privileges required to manage users)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No admin users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {isSuperAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                        {user.role === "super_admin" ? "Super Admin" : "Support"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "destructive"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
