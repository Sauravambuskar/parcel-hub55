import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminAuthContext } from "@/contexts/useAdminAuth";
import type { AdminRole, AdminUser } from "@/contexts/useAdminAuth";

const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const refresh = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
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

      setAdminUser((prev) => {
        const next = { role: data.role as AdminRole, email: data.email };
        if (prev && prev.role === next.role && prev.email === next.email) return prev;
        return next;
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let hasLoadedOnce = false;
    refresh(true).finally(() => { hasLoadedOnce = true; });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAdminUser(null);
        setLoading(false);
        return;
      }

      if (event === "USER_UPDATED") {
        // Refresh quietly if we're already loaded so we don't unmount the page.
        refresh(!hasLoadedOnce);
        return;
      }

      if (event === "SIGNED_IN" && !hasLoadedOnce) {
        refresh(true);
      }
      // Ignore SIGNED_IN after initial load and TOKEN_REFRESHED — these fire
      // on tab refocus / token rotation. Flipping `loading` here would unmount
      // ProtectedAdminRoute's children and wipe in-progress editor state.
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo(() => ({ loading, adminUser, refresh }), [loading, adminUser, refresh]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export { AdminAuthProvider };
export { useAdminAuth } from "@/contexts/useAdminAuth";
export type { AdminRole, AdminUser } from "@/contexts/useAdminAuth";