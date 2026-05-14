import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export type AdminRole = "super_admin" | "cms_editor" | "operations" | "support";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  /** Legacy prop: equivalent to allowedRoles=['super_admin'] */
  requireSuperAdmin?: boolean;
  /** Restrict access to these roles only. Defaults to any active admin. */
  allowedRoles?: AdminRole[];
}

// Default landing page for each role when redirected
const roleLanding: Record<AdminRole, string> = {
  super_admin: "/admin/dashboard",
  cms_editor: "/admin/cms",
  operations: "/admin/orders",
  support: "/admin/orders",
};

const ProtectedAdminRoute = ({ children, requireSuperAdmin = false, allowedRoles }: ProtectedAdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string>("/admin/login");

  const effectiveAllowed: AdminRole[] | undefined =
    allowedRoles ?? (requireSuperAdmin ? ["super_admin"] : undefined);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setRedirectTo("/admin/login");
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        const { data: adminUser, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_active", true)
          .single();

        if (error || !adminUser) {
          setRedirectTo("/admin/login");
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        const role = adminUser.role as AdminRole;
        if (effectiveAllowed && !effectiveAllowed.includes(role)) {
          // Authenticated but wrong role: send to their own landing
          setRedirectTo(roleLanding[role] ?? "/admin/login");
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setIsAuthorized(true);
        setLoading(false);
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthorized(false);
        setLoading(false);
      }
    };

    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAuth());
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireSuperAdmin, JSON.stringify(allowedRoles)]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
