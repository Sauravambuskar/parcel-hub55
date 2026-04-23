import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { getUrbaneboltConfig } from "../_shared/environment.ts";
import { getUrbaneboltToken } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const env = getEnvironmentFromRequest(req);
  const { apiBaseUrl } = getUrbaneboltConfig(env);
  const token = await getUrbaneboltToken(env, true);

  const tries = [
    { path: "/api/v1/location/pincodes/?pincodes=122017,560030", method: "GET" },
    { path: "/api/v1/location/pincodes/", method: "POST", body: { pincodes: ["122017", "560030"] } },
    { path: "/api/v1/location/pincode/?pincode=122017", method: "GET" },
    { path: "/api/v1/location/pincode/", method: "POST", body: { pincode: "122017" } },
    { path: "/api/v1/services/pincode/", method: "POST", body: { pincode: "122017" } },
    { path: "/api/v1/services/serviceability/?pickup=122017&delivery=560030", method: "GET" },
    { path: "/api/v1/services/serviceability/", method: "POST", body: { pickup_pincode: "122017", delivery_pincode: "560030" } },
    { path: "/api/v1/location/", method: "GET" },
    { path: "/api/v1/services/", method: "GET" },
  ];

  const attempts: any[] = [];
  for (const t of tries) {
    const url = `${apiBaseUrl}${t.path}`;
    const init: RequestInit = {
      method: t.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    if (t.body) init.body = JSON.stringify(t.body);
    try {
      const res = await fetch(url, init);
      const text = await res.text();
      attempts.push({ path: t.path, method: t.method, status: res.status, body: text.slice(0, 500) });
    } catch (e) {
      attempts.push({ path: t.path, method: t.method, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ token_present: !!token, base: apiBaseUrl, attempts }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
