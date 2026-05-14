import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["super_admin", "cms_editor", "operations", "support"] as const;
type Role = typeof ALLOWED_ROLES[number];

const resetPathByRole: Record<Role, string> = {
  super_admin: "/admin/reset-password",
  cms_editor: "/cms/reset-password",
  operations: "/ops/reset-password",
  support: "/ops/reset-password",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!adminUser || adminUser.role !== "super_admin") {
      throw new Error("Only super admins can create users");
    }

    const { email, role } = await req.json();

    if (!email || typeof email !== "string") {
      throw new Error("Email is required");
    }
    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("Invalid email format");
    }
    // Super admin role still restricted to @viasetu.com
    if (role === "super_admin" && !email.trim().endsWith("@viasetu.com")) {
      throw new Error("Super admin emails must be @viasetu.com");
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new Error("Invalid role specified");
    }

    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email.trim())
      .single();
    if (existingAdmin) throw new Error("User with this email already exists");

    const tempPassword = crypto.randomUUID() + "A1@";
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      email_confirm: true,
    });
    if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);
    if (!authData.user) throw new Error("Failed to create user");

    const { error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        user_id: authData.user.id,
        email: email.trim(),
        role,
        is_active: true,
        created_by: user.id,
      });

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create admin user: ${insertError.message}`);
    }

    const redirectPath = resetPathByRole[role as Role] ?? "/admin/reset-password";
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${req.headers.get("origin")}${redirectPath}` }
    );
    if (resetError) console.error("Failed to send password reset email:", resetError);

    return new Response(
      JSON.stringify({ success: true, message: "User created successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "An error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
