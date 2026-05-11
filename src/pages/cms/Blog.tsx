import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import type { CmsContent } from '@/lib/cms/types';
import { Loader2 } from 'lucide-react';

export default function Blog() {
  const [posts, setPosts] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('cms_content')
      .select('*')
      .eq('type', 'post').eq('status', 'published')
      .order('published_at', { ascending: false })
      .then(({ data }) => { setPosts((data || []) as unknown as CmsContent[]); setLoading(false); });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Helmet>
        <title>ViaSetu Blog — Courier Tips, Guides & News</title>
        <meta name="description" content="Read the latest courier tips, shipping guides, and logistics news from ViaSetu." />
        <link rel="canonical" href="https://www.viasetu.com/blog" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      {loading ? <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : posts.length === 0 ? <p className="text-muted-foreground">No posts yet.</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`}>
                <Card className="overflow-hidden hover:border-primary transition-colors h-full">
                  {p.featured_image_url && (
                    <img src={p.featured_image_url} alt={p.featured_image_alt || p.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <h2 className="font-semibold text-lg mb-2">{p.title}</h2>
                    {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>}
                    {p.published_at && <p className="text-xs text-muted-foreground mt-2">{new Date(p.published_at).toLocaleDateString()}</p>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
