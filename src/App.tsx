import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Booking from "./pages/Booking";
import Tracking from "./pages/Tracking";
import History from "./pages/History";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import { PartnerProvider } from "./contexts/PartnerContext";
import PartnerLogin from "./pages/partner/PartnerLogin";
import PartnerLayout from "./components/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import OrderManagement from "./pages/partner/OrderManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PartnerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/history" element={<History />} />
            <Route path="/support" element={<Support />} />
            
            {/* Partner Routes */}
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route path="/partner" element={<PartnerLayout />}>
              <Route path="dashboard" element={<PartnerDashboard />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="active" element={<div>Active Deliveries (Coming Soon)</div>} />
              <Route path="fleet" element={<div>Fleet Management (Coming Soon)</div>} />
              <Route path="earnings" element={<div>Earnings Dashboard (Coming Soon)</div>} />
              <Route path="analytics" element={<div>Analytics (Coming Soon)</div>} />
              <Route path="support" element={<div>Partner Support (Coming Soon)</div>} />
              <Route path="settings" element={<div>Partner Settings (Coming Soon)</div>} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </PartnerProvider>
  </QueryClientProvider>
);

export default App;
