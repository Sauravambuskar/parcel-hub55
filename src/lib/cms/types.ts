export type CmsContentType = 'post' | 'page' | 'faq' | 'partner';
export type CmsContentStatus = 'draft' | 'published' | 'scheduled';

export interface CmsContent {
  id: string;
  type: CmsContentType;
  title: string;
  slug: string;
  body_html: string;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyphrase: string | null;
  canonical_url: string | null;
  schema_type: string | null;
  schema_json: Record<string, unknown> | null;
  og_image_url: string | null;
  robots: string | null;
  status: CmsContentStatus;
  published_at: string | null;
  author_id: string | null;
  category_id: string | null;
  tags: string[];
  seo_score: number;
  view_count: number;
  faq_order: number | null;
  partner_code: string | null;
  created_at: string;
  updated_at: string;
}

export const CONTENT_TYPE_LABELS: Record<CmsContentType, string> = {
  post: 'Blog Post',
  page: 'Landing Page',
  faq: 'FAQ',
  partner: 'Courier Partner',
};

export const CONTENT_TYPE_PATHS: Record<CmsContentType, string> = {
  post: '/blog',
  page: '/p',
  faq: '/faq',
  partner: '/courier',
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
