import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  MapPin, 
  DollarSign, 
  BarChart3, 
  MessageCircle, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/Logo';
import { usePartner } from '@/contexts/PartnerContext';
import { cn } from '@/lib/utils';

const PartnerLayout = () => {
  const { partner, logout } = usePartner();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/partner/login');
  };

  const navigationItems = [
    { href: '/partner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/partner/orders', icon: Package, label: 'Orders', badge: '3' },
    { href: '/partner/active', icon: Truck, label: 'Active Deliveries' },
    { href: '/partner/fleet', icon: MapPin, label: 'Fleet Management' },
    { href: '/partner/earnings', icon: DollarSign, label: 'Earnings' },
    { href: '/partner/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/partner/support', icon: MessageCircle, label: 'Support' },
    { href: '/partner/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Partner Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {partner?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                2
              </Badge>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerLayout;