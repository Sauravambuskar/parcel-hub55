CREATE OR REPLACE FUNCTION public.generate_canonical_url(content_type text, content_slug text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE content_type
    WHEN 'post'    THEN 'https://www.viasetu.com/blog/' || content_slug
    WHEN 'page'    THEN 'https://www.viasetu.com/p/' || content_slug
    WHEN 'partner' THEN 'https://www.viasetu.com/courier/' || content_slug
    WHEN 'faq'     THEN 'https://www.viasetu.com/faq'
    ELSE               'https://www.viasetu.com/' || content_slug
  END;
$$;

CREATE OR REPLACE FUNCTION public.auto_set_canonical_url()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.canonical_url := public.generate_canonical_url(NEW.type::text, NEW.slug);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_canonical_url ON public.cms_content;
CREATE TRIGGER auto_canonical_url
  BEFORE INSERT OR UPDATE OF type, slug ON public.cms_content
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_canonical_url();

UPDATE public.cms_content
SET canonical_url = public.generate_canonical_url(type::text, slug)
WHERE canonical_url IS DISTINCT FROM public.generate_canonical_url(type::text, slug);