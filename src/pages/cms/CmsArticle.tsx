import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SeoHead from '@/components/cms/SeoHead';
import type { CmsContent, CmsContentType } from '@/lib/cms/types';
import { CONTENT_TYPE_PATHS } from '@/lib/cms/types';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/NotFound';

interface Props { type: CmsContentType }

export default function CmsArticle({ type }: Props) {
  const { slug } = useParams();
  const [post, setPost] = useState<CmsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('cms_content')
      .select('*')
      .eq('type', type).eq('slug', slug).eq('status', 'published')
      .maybeSingle()
      .then(({ data }) => { setPost(data as unknown as CmsContent | null); setLoading(false); });
  }, [slug, type]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!post) return <NotFound />;

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <SeoHead content={post} url={`${CONTENT_TYPE_PATHS[type]}/${post.slug}`} />
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:underline">Home</Link> /{' '}
        <Link to={CONTENT_TYPE_PATHS[type]} className="hover:underline capitalize">{type}</Link> /{' '}
        <span>{post.title}</span>
      </nav>
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      {post.published_at && <p className="text-sm text-muted-foreground mb-6">{new Date(post.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
      {post.featured_image_url && (
        <img src={post.featured_image_url} alt={post.featured_image_alt || post.title} className="w-full rounded-lg mb-6" />
      )}
      <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: post.body_html || '' }} />
      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t flex flex-wrap gap-2">
          {post.tags.map(t => <span key={t} className="text-xs px-2 py-1 rounded bg-muted">#{t}</span>)}
        </div>
      )}
    </article>
  );
}
