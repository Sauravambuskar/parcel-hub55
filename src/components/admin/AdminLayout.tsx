import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Package, 
  DollarSign, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  Home,
  MapPin,
  AlertTriangle,
  FileEdit
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Home },
  { title: "Real-Time Tracking", url: "/admin/tracking", icon: MapPin },
  { title: "Order Monitoring", url: "/admin/orders", icon: Package },
  { title: "User & Partner Management", url: "/admin/users", icon: Users },
  { title: "Admin Users", url: "/admin/admin-users", icon: Shield, requireSuperAdmin: true },
  { title: "Revenue & Commission", url: "/admin/revenue", icon: DollarSign },
  { title: "Payment Reconciliation", url: "/admin/reconciliation", icon: AlertTriangle },
  { title: "Support Management", url: "/admin/support", icon: MessageSquare },
  { title: "Analytics & Insights", url: "/admin/analytics", icon: BarChart3 },
  { title: "Content (CMS)", url: "/admin/cms", icon: FileEdit, requireSuperAdmin: true },
  { title: "System Settings", url: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("admin_users")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (data) {
          setUserRole(data.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const filteredMenuItems = adminMenuItems.filter(
    (item) => !item.requireSuperAdmin || userRole === "super_admin"
  );

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {!collapsed && <span className="font-semibold">Admin Panel</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4">
            <SidebarTrigger />
            <h1 className="ml-4 font-semibold">Admin Dashboard</h1>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
