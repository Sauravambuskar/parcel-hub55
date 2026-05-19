import { createContext, useContext } from "react";

export type AdminRole = "super_admin" | "cms_editor" | "operations" | "support";

export type AdminUser = {
  role: AdminRole;
  email: string;
};

export type AdminAuthState = {
  loading: boolean;
  adminUser: AdminUser | null;
  refresh: () => Promise<void>;
};

export const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
};