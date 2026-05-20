import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/useAdminAuth";
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
  FileEdit,
  AlertOctagon
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

type Role = "super_admin" | "cms_editor" | "operations" | "support";

const adminMenuItems: { title: string; url: string; icon: any; allowedRoles: Role[] }[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Home, allowedRoles: ["super_admin"] },
  { title: "Real-Time Tracking", url: "/admin/tracking", icon: MapPin, allowedRoles: ["super_admin", "operations", "support"] },
  { title: "Order Monitoring", url: "/admin/orders", icon: Package, allowedRoles: ["super_admin", "operations", "support"] },
  { title: "User & Partner Management", url: "/admin/users", icon: Users, allowedRoles: ["super_admin", "operations", "support"] },
  { title: "Admin Users", url: "/admin/admin-users", icon: Shield, allowedRoles: ["super_admin"] },
  { title: "Revenue & Commission", url: "/admin/revenue", icon: DollarSign, allowedRoles: ["super_admin"] },
  { title: "Payment Reconciliation", url: "/admin/reconciliation", icon: AlertTriangle, allowedRoles: ["super_admin", "operations", "support"] },
  { title: "Support Management", url: "/admin/support", icon: MessageSquare, allowedRoles: ["super_admin", "operations", "support"] },
  { title: "Dispute Resolution", url: "/admin/disputes", icon: AlertOctagon, allowedRoles: ["super_admin", "operations", "support"] },
  { title: "Analytics & Insights", url: "/admin/analytics", icon: BarChart3, allowedRoles: ["super_admin"] },
  { title: "Content (CMS)", url: "/admin/cms", icon: FileEdit, allowedRoles: ["super_admin", "cms_editor"] },
  { title: "System Settings", url: "/admin/settings", icon: Settings, allowedRoles: ["super_admin"] },
];

const panelTitleByRole: Record<Role, string> = {
  super_admin: "Admin Panel",
  cms_editor: "CMS Panel",
  operations: "Operations Panel",
  support: "Operations Panel",
};

function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const { adminUser } = useAdminAuth();
  const userRole = adminUser?.role;

  const isActive = (path: string) => location.pathname === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const filteredMenuItems = adminMenuItems.filter(
    (item) => userRole && item.allowedRoles.includes(userRole as Role)
  );

  const panelTitle = panelTitleByRole[userRole as Role] ?? "Admin Panel";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {!collapsed && <span className="font-semibold text-lg">{panelTitle}</span>}
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
