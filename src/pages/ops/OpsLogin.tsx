import StaffLogin from "@/components/admin/StaffLogin";

const OpsLogin = () => (
  <StaffLogin
    config={{
      title: "Operations Login",
      description: "Sign in to manage orders, tracking, and customer support",
      allowedRoles: ["super_admin", "operations", "support"],
      defaultRedirect: "/admin/orders",
      resetPath: "/ops/reset-password",
    }}
  />
);

export default OpsLogin;
