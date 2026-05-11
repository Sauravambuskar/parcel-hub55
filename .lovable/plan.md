## ViaSetu CMS — SEO-First Content Management

A WordPress/Yoast-style CMS built into the existing `/admin` panel, backed by Supabase. Editors (super admins) can create blog posts, landing pages, FAQs, and courier partner pages — each with full SEO controls (meta title, meta description, focus keyphrase, slug, schema, featured image, alt text, author, category, tags, publish date).

### 1. Content Types

All four types share the same SEO fields but have different bodies:

| Type | Public route | Body fields |
|------|-------------|-------------|
| Blog post | `/blog/:slug` | Rich text, excerpt, category, tags, author, reading time |
| Landing/SEO page | `/p/:slug` (e.g. `/p/courier-delhi-to-mumbai`) | Rich text + custom JSON-LD |
| FAQ | feeds `/faq` and JSON-LD on Landing | Question, answer, order |
| Courier partner page | `/courier/:slug` (e.g. `/courier/dhl`) | Linked partner, rich text, pros/cons |

### 2. SEO Fields (Yoast-style, on every content type)

- **Meta title** (≤60 chars, live counter + Google preview)
- **Meta description** (≤160 chars, live counter)
- **Focus keyphrase** + automated checks (in title? in slug? in first paragraph? in H2? density?)
- **Slug** (auto-generated from title, editable, uniqueness check)
- **Canonical URL** (optional override)
- **Schema type** (Article / FAQPage / WebPage / Product) — auto-generates JSON-LD
- **Featured image** + **Alt text** (required)
- **Open Graph image** (defaults to featured)
- **Robots** (index/noindex, follow/nofollow)
- **Publish date**, **Author**, **Category**, **Tags**
- **SEO score** (red/orange/green like Yoast) computed client-side from the checks above

### 3. Editor UI (under `/admin/cms`)

```
/admin/cms              → Dashboard: counts, recent edits, draft list
/admin/cms/posts        → List + filters (status, category, author)
/admin/cms/posts/new    → Editor
/admin/cms/posts/:id    → Editor
/admin/cms/pages        → Landing pages list + editor
/admin/cms/faqs         → FAQ list + editor
/admin/cms/partners     → Partner pages list + editor
/admin/cms/categories   → Manage categories & tags
/admin/cms/media        → Browse uploaded images
```

Editor screen layout:
- Left: title, slug, rich text body (TipTap), featured image picker
- Right sidebar (collapsible panels): Publish, SEO (Yoast-style), Schema, Categories/Tags, Social preview

### 4. Public-facing Pages

- `/blog` — paginated list, filter by category/tag
- `/blog/:slug` — article, with JSON-LD Article schema, breadcrumbs, related posts
- `/p/:slug` — landing pages
- `/courier/:slug` — partner pages
- `/faq` — grouped FAQs with FAQPage JSON-LD

Each page uses **react-helmet-async** to inject `<title>`, meta tags, OG/Twitter tags, canonical, and JSON-LD into `<head>` at runtime. Sitemap (`/sitemap.xml`) regenerated dynamically from published content.

### 5. Database (Supabase)

New tables (all with RLS — public can SELECT only `status='published'`; super admins full access):

- `cms_content` — unified table for all 4 types (`type`, `title`, `slug`, `body_html`, `excerpt`, `featured_image_url`, `featured_image_alt`, `meta_title`, `meta_description`, `focus_keyphrase`, `canonical_url`, `schema_type`, `schema_json`, `og_image_url`, `robots`, `status` [draft/published/scheduled], `published_at`, `author_id`, `category_id`, `tags[]`, `seo_score`, `view_count`)
- `cms_categories` — `name`, `slug`, `description`
- `cms_authors` — `name`, `slug`, `bio`, `avatar_url`, `linked_admin_user_id`
- `cms_media` — uploaded image references with alt text

Storage: new Supabase bucket `cms-media` (public read, super-admin write).

### 6. Tech Choices

- **Rich text editor**: TipTap (headings, lists, links, images, code, embeds, table) — outputs clean HTML
- **Image uploads**: direct to Supabase Storage from the admin
- **SEO checks**: client-side utility module computing the Yoast-style score
- **Public meta tags**: `react-helmet-async`
- **Sitemap**: edge function `generate-sitemap` queries published content and returns XML; route `/sitemap.xml` rewritten in `vercel.json` to call it
- **Caching**: public pages fetch via Supabase anon key with `useQuery` (5-min stale time)

### 7. Indexing & Discoverability

- Auto-add new URLs to `sitemap.xml` (regenerated on publish)
- Internal linking: blog posts surface on landing pages and partner pages
- Breadcrumb JSON-LD on all CMS pages
- RSS feed at `/rss.xml` (edge function)
- Update `robots.txt` to reference dynamic sitemap

### 8. Build Phases

1. **Schema & storage**: migration for tables, RLS, `cms-media` bucket
2. **Admin CMS shell**: routes, list views, navigation entry in `AdminLayout`
3. **Editor + TipTap + image upload + Yoast-style SEO panel**
4. **Public routes**: `/blog`, `/blog/:slug`, `/p/:slug`, `/courier/:slug`, `/faq` with helmet
5. **Sitemap + RSS edge functions, `vercel.json` rewrites**
6. **Seed initial content** (a few SEO landing pages for top routes + partner pages)

### Note on SEO rendering

You chose client-side rendering. Google does index JS, but for maximum SEO impact (especially for social previews and faster indexing), prerendering would help. We can add it later as a phase 7 if needed without changing the CMS itself.
