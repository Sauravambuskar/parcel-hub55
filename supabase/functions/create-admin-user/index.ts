import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is super admin
    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!adminUser || adminUser.role !== "super_admin") {
      throw new Error("Only super admins can create admin users");
    }

    const { email, role } = await req.json();

    // Validate email domain
    if (!email || typeof email !== "string" || !email.endsWith("@viasetu.com")) {
      throw new Error("Only @viasetu.com email addresses are allowed");
    }

    // Validate role
    if (!role || !["super_admin", "support"].includes(role)) {
      throw new Error("Invalid role specified");
    }

    // Check if user already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email.trim())
      .single();

    if (existingAdmin) {
      throw new Error("User with this email already exists");
    }

    // Create auth user with temporary password
    const tempPassword = crypto.randomUUID() + "A1@";
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    // Add to admin_users table
    const { error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        user_id: authData.user.id,
        email: email.trim(),
        role: role,
        is_active: true,
        created_by: user.id,
      });

    if (insertError) {
      // Rollback: delete the auth user if admin_users insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create admin user: ${insertError.message}`);
    }

    // Send password reset email
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${req.headers.get("origin")}/admin/reset-password`,
      }
    );

    if (resetError) {
      console.error("Failed to send password reset email:", resetError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
