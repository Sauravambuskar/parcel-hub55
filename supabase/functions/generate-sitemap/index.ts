import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SITE = "https://www.viasetu.com";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data } = await supabase
    .from("cms_content")
    .select("type,slug,updated_at")
    .eq("status", "published");

  const typePath: Record<string, string> = {
    post: "/blog",
    page: "/p",
    partner: "/courier",
    faq: "/faq",
  };

  const staticUrls = [
    { loc: "/", priority: "1.0" },
    { loc: "/blog", priority: "0.8" },
    { loc: "/faq", priority: "0.7" },
    { loc: "/tracking", priority: "0.8" },
  ];

  const urls = staticUrls.map(u => `<url><loc>${SITE}${u.loc}</loc><priority>${u.priority}</priority></url>`).join("");
  const dyn = (data || [])
    .filter(r => r.type !== "faq")
    .map(r => `<url><loc>${SITE}${typePath[r.type]}/${r.slug}</loc><lastmod>${new Date(r.updated_at).toISOString()}</lastmod><priority>0.7</priority></url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}${dyn}</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
});
