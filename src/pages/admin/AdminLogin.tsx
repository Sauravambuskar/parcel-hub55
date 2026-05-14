import StaffLogin from "@/components/admin/StaffLogin";

const AdminLogin = () => (
  <StaffLogin
    config={{
      title: "Admin Login",
      description: "Sign in with your @viasetu.com admin account",
      allowedRoles: ["super_admin"],
      defaultRedirect: "/admin/dashboard",
      resetPath: "/admin/reset-password",
      enforceViasetuDomain: true,
    }}
  />
);

export default AdminLogin;
