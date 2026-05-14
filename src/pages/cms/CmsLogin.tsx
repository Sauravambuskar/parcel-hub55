import StaffLogin from "@/components/admin/StaffLogin";

const CmsLogin = () => (
  <StaffLogin
    config={{
      title: "CMS Login",
      description: "Sign in to manage content",
      allowedRoles: ["super_admin", "cms_editor"],
      defaultRedirect: "/admin/cms",
      resetPath: "/cms/reset-password",
    }}
  />
);

export default CmsLogin;
