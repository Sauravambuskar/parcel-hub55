// Parcel photos edge function: upload, list (with signed URLs), delete.
// Auth: customers via x-prayog-auth (booking.user_id match).
//       Admins via Supabase JWT (admin_users row).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-prayog-auth",
};

const BUCKET = "parcel-photos";
const MAX_PHOTOS = 5;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const SIGNED_TTL = 60 * 10; // 10 min

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, { public: false });
  }
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeBase64(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function resolveCaller(req: Request): Promise<{
  type: "user" | "admin";
  userId?: string;
  adminUid?: string;
} | null> {
  const prayog = req.headers.get("x-prayog-auth");
  if (prayog) {
    try {
      const parsed = JSON.parse(prayog);
      if (parsed?.user_id) return { type: "user", userId: parsed.user_id };
    } catch (_) {}
  }
  const authz = req.headers.get("authorization");
  if (authz?.startsWith("Bearer ")) {
    const token = authz.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      const { data: admin } = await supabase
        .from("admin_users")
        .select("user_id,is_active")
        .eq("user_id", data.user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (admin) return { type: "admin", adminUid: data.user.id };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await ensureBucket();
    const caller = await resolveCaller(req);
    if (!caller) return jsonResp({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action: string = body?.action;
    const bookingId: string = body?.booking_id;
    if (!action || !bookingId) {
      return jsonResp({ error: "action and booking_id required" }, 400);
    }

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id,user_id,parcel_photos")
      .eq("id", bookingId)
      .maybeSingle();
    if (bErr || !booking) return jsonResp({ error: "booking not found" }, 404);

    if (caller.type === "user" && booking.user_id !== caller.userId) {
      return jsonResp({ error: "forbidden" }, 403);
    }

    const photos: Array<{ path: string; uploaded_at: string }> = Array.isArray(
      booking.parcel_photos,
    )
      ? (booking.parcel_photos as any)
      : [];

    if (action === "list") {
      const signed = await Promise.all(
        photos.map(async (p) => {
          const { data } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(p.path, SIGNED_TTL);
          return { ...p, url: data?.signedUrl || null };
        }),
      );
      return jsonResp({ photos: signed });
    }

    if (action === "upload") {
      if (caller.type !== "user") {
        return jsonResp({ error: "only customers can upload" }, 403);
      }
      const file = body?.file;
      if (!file?.data || !file?.content_type) {
        return jsonResp({ error: "file.data and file.content_type required" }, 400);
      }
      if (!ALLOWED.includes(file.content_type)) {
        return jsonResp({ error: "unsupported file type" }, 400);
      }
      if (photos.length >= MAX_PHOTOS) {
        return jsonResp({ error: `maximum ${MAX_PHOTOS} photos per shipment` }, 400);
      }
      const bytes = decodeBase64(file.data);
      if (bytes.byteLength > MAX_BYTES) {
        return jsonResp({ error: "file too large (max 8MB)" }, 400);
      }
      const ext = file.content_type === "image/png"
        ? "png"
        : file.content_type === "image/webp"
        ? "webp"
        : "jpg";
      const path = `${booking.user_id}/${booking.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: file.content_type, upsert: false });
      if (upErr) return jsonResp({ error: upErr.message }, 500);

      const next = [...photos, { path, uploaded_at: new Date().toISOString() }];
      const { error: updErr } = await supabase
        .from("bookings")
        .update({
          parcel_photos: next,
          parcel_photos_uploaded_at: new Date().toISOString(),
        })
        .eq("id", booking.id);
      if (updErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        return jsonResp({ error: updErr.message }, 500);
      }
      const { data: sg } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL);
      return jsonResp({ photo: { path, uploaded_at: next.at(-1)!.uploaded_at, url: sg?.signedUrl || null } });
    }

    if (action === "delete") {
      if (caller.type !== "user") {
        return jsonResp({ error: "only customers can delete" }, 403);
      }
      const path: string = body?.path;
      if (!path) return jsonResp({ error: "path required" }, 400);
      const exists = photos.find((p) => p.path === path);
      if (!exists) return jsonResp({ error: "photo not found" }, 404);
      // Enforce user prefix to avoid cross-booking abuse.
      if (!path.startsWith(`${booking.user_id}/${booking.id}/`)) {
        return jsonResp({ error: "invalid path" }, 400);
      }
      await supabase.storage.from(BUCKET).remove([path]);
      const next = photos.filter((p) => p.path !== path);
      const { error: updErr } = await supabase
        .from("bookings")
        .update({ parcel_photos: next })
        .eq("id", booking.id);
      if (updErr) return jsonResp({ error: updErr.message }, 500);
      return jsonResp({ success: true });
    }

    return jsonResp({ error: "unknown action" }, 400);
  } catch (e: any) {
    console.error("parcel-photos error", e);
    return jsonResp({ error: e?.message || "internal error" }, 500);
  }
});
