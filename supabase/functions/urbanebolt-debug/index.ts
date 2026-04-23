import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { urbaneboltFetch } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const env = getEnvironmentFromRequest(req);
  const attempts: any[] = [];

  const tries: Array<{ path: string; method: string; body?: any }> = [
    { path: "/api/v1/location/pincodes/?pincodes=122017,560030", method: "GET" },
    { path: "/api/v1/location/pincode/?pincode=122017", method: "GET" },
    { path: "/api/v1/location/pincode/", method: "POST", body: { pincode: "122017" } },
    { path: "/api/v1/location/pincodes/", method: "POST", body: { pincodes: ["122017", "560030"] } },
    { path: "/api/v1/location/serviceability/", method: "POST", body: { pickup_pincode: "122017", delivery_pincode: "560030" } },
    { path: "/api/v1/services/serviceability/", method: "POST", body: { pickup_pincode: "122017", delivery_pincode: "560030" } },
    { path: "/api/v1/services/pincode/", method: "POST", body: { pincode: "122017" } },
  ];

  for (const t of tries) {
    try {
      const init: RequestInit = { method: t.method };
      if (t.body) init.body = JSON.stringify(t.body);
      const res = await urbaneboltFetch(env, t.path, init);
      const text = await res.text();
      attempts.push({ path: t.path, method: t.method, status: res.status, body: text.slice(0, 600) });
    } catch (e) {
      attempts.push({ path: t.path, method: t.method, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ attempts }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
