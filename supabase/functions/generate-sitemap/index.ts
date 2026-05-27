import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://www.viasetu.com";

const STATIC_URLS = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/booking", changefreq: "daily", priority: "0.9" },
  { loc: "/tracking", changefreq: "daily", priority: "0.9" },
  { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  { loc: "/faq", changefreq: "monthly", priority: "0.7" },
  { loc: "/support", changefreq: "monthly", priority: "0.6" },
];

const TYPE_PREFIX: Record<string, string> = {
  post: "/blog/",
  page: "/p/",
  partner: "/courier/",
  faq: "", // FAQs are aggregated on /faq, not individually indexable
};

function fmtDate(d: string | null | undefined): string {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().slice(0, 10);
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

Deno.serve(async () => {
  const today = fmtDate(null);
  const entries: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = STATIC_URLS.map(u => ({
    loc: u.loc,
    lastmod: today,
    changefreq: u.changefreq,
    priority: u.priority,
  }));

  // Pull dynamic CMS entries (blog posts, service pages, city/location pages via partner/page types)
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data } = await supabase
      .from("cms_content")
      .select("slug,type,updated_at,published_at")
      .eq("status", "published")
      .in("type", ["post", "page", "partner"])
      .order("updated_at", { ascending: false });

    if (Array.isArray(data)) {
      for (const row of data as Array<{ slug: string; type: string; updated_at: string | null; published_at: string | null }>) {
        const prefix = TYPE_PREFIX[row.type];
        if (!prefix || !row.slug) continue;
        entries.push({
          loc: `${prefix}${row.slug}`,
          lastmod: fmtDate(row.updated_at || row.published_at),
          changefreq: row.type === "post" ? "weekly" : "monthly",
          priority: row.type === "post" ? "0.7" : "0.6",
        });
      }
    }
  } catch (e) {
    console.error("sitemap: failed to load cms entries", e);
  }

  const urls = entries.map(u =>
    `<url>` +
      `<loc>${SITE}${xmlEscape(u.loc)}</loc>` +
      `<lastmod>${u.lastmod}</lastmod>` +
      `<changefreq>${u.changefreq}</changefreq>` +
      `<priority>${u.priority}</priority>` +
    `</url>`
  ).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Short cache so newly published CMS content shows up quickly
      "Cache-Control": "public, max-age=300",
    },
  });
});
