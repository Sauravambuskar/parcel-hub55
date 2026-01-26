import { Home, Package, Navigation, Clock, HelpCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Package, label: "Book", path: "/booking" },
  { icon: Navigation, label: "Track", path: "/tracking" },
  { icon: Clock, label: "History", path: "/history" },
  { icon: HelpCircle, label: "Support", path: "/support" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient border top */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Glass background */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                  "active:scale-95",
                  isActive 
                    ? "text-foreground bg-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "relative",
                  isActive && "animate-pulse"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )} />
                  {isActive && (
                    <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm -z-10" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
};

export default BottomNav;
