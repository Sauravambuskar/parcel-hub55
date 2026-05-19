import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "super_admin" | "cms_editor" | "operations" | "support";

type AdminUser = {
  role: AdminRole;
  email: string;
};

type AdminAuthState = {
  loading: boolean;
  adminUser: AdminUser | null;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setAdminUser(null);
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("role,email")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setAdminUser(null);
        return;
      }

      setAdminUser({ role: data.role as AdminRole, email: data.email });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAdminUser(null);
        setLoading(false);
        return;
      }

      refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo(() => ({ loading, adminUser, refresh }), [loading, adminUser, refresh]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
};