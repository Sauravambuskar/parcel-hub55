import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Booking from "./pages/Booking";
import Tracking from "./pages/Tracking";
import History from "./pages/History";
import OrderDetails from "./pages/OrderDetails";
import Support from "./pages/Support";
import Settings from "./pages/Settings";

import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import ResetPassword from "./pages/admin/ResetPassword";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RealTimeTracking from "./pages/admin/RealTimeTracking";
import UserManagement from "./pages/admin/UserManagement";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import OrderMonitoring from "./pages/admin/OrderMonitoring";
import RevenueManagement from "./pages/admin/RevenueManagement";
import Reconciliation from "./pages/admin/Reconciliation";
import SupportManagement from "./pages/admin/SupportManagement";
import Analytics from "./pages/admin/Analytics";
import SystemSettings from "./pages/admin/SystemSettings";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/history" element={<History />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route path="/support" element={<Support />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tracking" element={<RealTimeTracking />} />
            <Route path="orders" element={<OrderMonitoring />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="admin-users" element={<ProtectedAdminRoute requireSuperAdmin><AdminUserManagement /></ProtectedAdminRoute>} />
            <Route path="revenue" element={<RevenueManagement />} />
            <Route path="reconciliation" element={<Reconciliation />} />
            <Route path="support" element={<SupportManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
