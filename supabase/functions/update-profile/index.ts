import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      full_name, 
      phone, 
      preferred_language, 
      theme_preference, 
      sms_notifications, 
      promo_notifications 
    } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (full_name !== undefined) updateData.full_name = full_name;
      if (phone !== undefined) updateData.phone = phone;
      if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
      if (theme_preference !== undefined) updateData.theme_preference = theme_preference;
      if (sms_notifications !== undefined) updateData.sms_notifications = sms_notifications;
      if (promo_notifications !== undefined) updateData.promo_notifications = promo_notifications;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user_id);

      if (error) throw error;
    } else {
      // Create new profile
      const { error } = await supabase
        .from("profiles")
        .insert({
          user_id,
          full_name: full_name || null,
          phone: phone || null,
          preferred_language: preferred_language || 'en',
          theme_preference: theme_preference || 'light',
          sms_notifications: sms_notifications ?? true,
          promo_notifications: promo_notifications ?? true,
        });

      if (error) throw error;
    }

    // Return the updated profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError) throw fetchError;

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
