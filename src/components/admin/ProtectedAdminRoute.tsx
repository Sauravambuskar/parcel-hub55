import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AdminRole, useAdminAuth } from "@/contexts/useAdminAuth";

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
  const { loading, adminUser } = useAdminAuth();

  const effectiveAllowed: AdminRole[] | undefined =
    allowedRoles ?? (requireSuperAdmin ? ["super_admin"] : undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (effectiveAllowed && !effectiveAllowed.includes(adminUser.role)) {
    return <Navigate to={roleLanding[adminUser.role] ?? "/admin/login"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
