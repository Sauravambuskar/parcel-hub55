import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SeoHead from '@/components/cms/SeoHead';
import type { CmsContent, CmsContentType } from '@/lib/cms/types';
import { CONTENT_TYPE_PATHS } from '@/lib/cms/types';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/NotFound';
import PublicSiteLayout from '@/components/site/PublicSiteLayout';

interface Props { type: CmsContentType }

export default function CmsArticle({ type }: Props) {
  const { slug } = useParams();
  const [post, setPost] = useState<CmsContent & { cms_authors?: { name: string } | null }>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!slug) return;
    const { data } = await supabase.from('cms_content')
      .select('*, cms_authors(name)')
      .eq('type', type).eq('slug', slug).eq('status', 'published')
      .maybeSingle();
    setPost(data as unknown as (CmsContent & { cms_authors?: { name: string } | null }) | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`public:cms_content:${type}:${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cms_content', filter: `type=eq.${type}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, type]);

  if (loading) return (
    <PublicSiteLayout>
      <div className="flex justify-center p-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
    </PublicSiteLayout>
  );
  if (!post) return <NotFound />;

  return (
    <PublicSiteLayout>
      <article className="container mx-auto px-4 py-10 max-w-3xl">
        <SeoHead content={post} url={`${CONTENT_TYPE_PATHS[type]}/${post.slug}`} />
        <nav className="text-sm mb-4" style={{ color: '#5A6B80' }}>
          <Link to="/" className="hover:underline">Home</Link> /{' '}
          <Link to={CONTENT_TYPE_PATHS[type]} className="hover:underline capitalize">{type === 'post' ? 'blog' : type}</Link> /{' '}
          <span>{post.title}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#0B1220' }}>{post.title}</h1>
        {post.published_at && (
          <p className="text-sm mb-6" style={{ color: '#5A6B80' }}>
            {new Date(post.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
        {post.featured_image_url && (
          <img src={post.featured_image_url} alt={post.featured_image_alt || post.title} className="w-full rounded-xl mb-8" />
        )}
        <div className="cms-content prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: post.body_html || '' }} />
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t flex flex-wrap gap-2">
            {post.tags.map(t => <span key={t} className="text-xs px-2 py-1 rounded bg-muted">#{t}</span>)}
          </div>
        )}
      </article>
    </PublicSiteLayout>
  );
}
