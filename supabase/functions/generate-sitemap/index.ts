const SITE = "https://www.viasetu.com";

const STATIC_URLS = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/booking", changefreq: "daily", priority: "0.9" },
  { loc: "/tracking", changefreq: "daily", priority: "0.9" },
  { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  { loc: "/faq", changefreq: "monthly", priority: "0.7" },
  { loc: "/support", changefreq: "monthly", priority: "0.6" },
];

const LASTMOD = "2026-05-27";

Deno.serve(async () => {
  const urls = STATIC_URLS.map(u =>
    `<url>` +
      `<loc>${SITE}${u.loc}</loc>` +
      `<lastmod>${LASTMOD}</lastmod>` +
      `<changefreq>${u.changefreq}</changefreq>` +
      `<priority>${u.priority}</priority>` +
    `url>`
  ).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
});
