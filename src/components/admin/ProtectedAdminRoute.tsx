import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

const ProtectedAdminRoute = ({ children, requireSuperAdmin = false }: ProtectedAdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // Check if user is an admin
        const { data: adminUser, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_active", true)
          .single();

        if (error || !adminUser) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // If super admin is required, check the role
        if (requireSuperAdmin && adminUser.role !== "super_admin") {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setIsAuthorized(true);
        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthorized(false);
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requireSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
