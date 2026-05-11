
-- ============= CMS Authors =============
CREATE TABLE public.cms_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  linked_admin_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view authors" ON public.cms_authors
  FOR SELECT USING (true);
CREATE POLICY "Super admins manage authors" ON public.cms_authors
  FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

-- ============= CMS Categories =============
CREATE TABLE public.cms_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON public.cms_categories
  FOR SELECT USING (true);
CREATE POLICY "Super admins manage categories" ON public.cms_categories
  FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

-- ============= CMS Content =============
CREATE TYPE public.cms_content_type AS ENUM ('post', 'page', 'faq', 'partner');
CREATE TYPE public.cms_content_status AS ENUM ('draft', 'published', 'scheduled');

CREATE TABLE public.cms_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type cms_content_type NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  body_html text DEFAULT '',
  excerpt text,
  featured_image_url text,
  featured_image_alt text,
  meta_title text,
  meta_description text,
  focus_keyphrase text,
  canonical_url text,
  schema_type text DEFAULT 'Article',
  schema_json jsonb,
  og_image_url text,
  robots text DEFAULT 'index,follow',
  status cms_content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  author_id uuid REFERENCES public.cms_authors(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.cms_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  seo_score integer DEFAULT 0,
  view_count integer DEFAULT 0,
  faq_order integer,
  partner_code text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, slug)
);

CREATE INDEX idx_cms_content_type_status ON public.cms_content(type, status);
CREATE INDEX idx_cms_content_slug ON public.cms_content(slug);
CREATE INDEX idx_cms_content_published_at ON public.cms_content(published_at DESC);

ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published content" ON public.cms_content
  FOR SELECT USING (status = 'published');
CREATE POLICY "Super admins view all content" ON public.cms_content
  FOR SELECT USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins manage content" ON public.cms_content
  FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

-- ============= CMS Media =============
CREATE TABLE public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  public_url text NOT NULL,
  alt_text text,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view media" ON public.cms_media
  FOR SELECT USING (true);
CREATE POLICY "Super admins manage media" ON public.cms_media
  FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

-- ============= Triggers =============
CREATE TRIGGER update_cms_authors_updated_at BEFORE UPDATE ON public.cms_authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_categories_updated_at BEFORE UPDATE ON public.cms_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_content_updated_at BEFORE UPDATE ON public.cms_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Storage bucket =============
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-media', 'cms-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read cms-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'cms-media');
CREATE POLICY "Super admins upload cms-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cms-media' AND is_super_admin(auth.uid()));
CREATE POLICY "Super admins update cms-media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cms-media' AND is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete cms-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'cms-media' AND is_super_admin(auth.uid()));
