// Admin-only: look up (or create) a customer by 10-digit phone.
// Verifies the caller is an active admin (super_admin/operations/support) via
// their Supabase JWT, then derives the deterministic user_id from the phone
// using the same UUID-v5 namespace convention used by src/lib/auth.ts, and
// returns the customer's profile — creating a minimal one if missing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VIASETU_PHONE_NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const hexToBytes = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
};

const bytesToUuid = (b: Uint8Array): string => {
  const h = Array.from(b.slice(0, 16)).map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

async function deriveUserId(phoneDigits: string): Promise<string> {
  const phone = `+91${phoneDigits}`;
  const ns = hexToBytes(VIASETU_PHONE_NAMESPACE.replace(/-/g, ""));
  const name = new TextEncoder().encode(phone);
  const combined = new Uint8Array(ns.length + name.length);
  combined.set(ns, 0);
  combined.set(name, ns.length);
  const digest = await crypto.subtle.digest("SHA-1", combined);
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

const ALLOWED_ROLES = new Set(["super_admin", "operations", "support"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller identity with the anon client + user JWT.
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminAuthId = userData.user.id;
    const adminEmail = userData.user.email || "";

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: adminRow } = await admin
      .from("admin_users")
      .select("role,is_active,email")
      .eq("user_id", adminAuthId)
      .maybeSingle();

    if (!adminRow?.is_active || !ALLOWED_ROLES.has(adminRow.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone, name } = await req.json();
    const phoneDigits = String(phone || "").replace(/\D/g, "").slice(-10);
    if (phoneDigits.length !== 10) {
      return new Response(JSON.stringify({ error: "Enter a valid 10-digit phone number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await deriveUserId(phoneDigits);

    const { data: existing } = await admin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let profile = existing;
    let isNew = false;

    if (!existing) {
      const { data: inserted, error: insErr } = await admin
        .from("profiles")
        .insert({
          user_id: userId,
          phone: `+91${phoneDigits}`,
          full_name: name || null,
          preferred_language: "en",
          theme_preference: "light",
          sms_notifications: true,
          promo_notifications: true,
        })
        .select("*")
        .single();
      if (insErr) {
        console.error("[admin-lookup-customer] insert error", insErr);
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      profile = inserted;
      isNew = true;
    } else if (name && !existing.full_name) {
      await admin.from("profiles").update({ full_name: name }).eq("user_id", userId);
      profile = { ...existing, full_name: name };
    }

    return new Response(
      JSON.stringify({
        user_id: userId,
        phone: `+91${phoneDigits}`,
        phone_digits: phoneDigits,
        name: profile?.full_name || name || "",
        profile,
        isNew,
        admin: { id: adminAuthId, email: adminEmail, role: adminRow.role },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[admin-lookup-customer] error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
