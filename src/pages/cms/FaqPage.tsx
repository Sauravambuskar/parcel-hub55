import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';
import type { CmsContent } from '@/lib/cms/types';
import PublicSiteLayout from '@/components/site/PublicSiteLayout';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('cms_content')
      .select('*')
      .eq('type', 'faq').eq('status', 'published')
      .order('faq_order', { ascending: true, nullsFirst: false });
    setFaqs((data || []) as unknown as CmsContent[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('public:cms_content:faq')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cms_content', filter: 'type=eq.faq' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.title,
      acceptedAnswer: { '@type': 'Answer', text: (f.body_html || '').replace(/<[^>]+>/g, ' ') },
    })),
  };

  return (
    <PublicSiteLayout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Helmet>
          <title>FAQ — Frequently Asked Questions | ViaSetu</title>
          <meta name="description" content="Answers to common questions about ViaSetu courier booking, pricing, tracking and more." />
          <link rel="canonical" href="https://viasetu.lovable.app/faq" />
          <script type="application/ld+json">{JSON.stringify(schema)}</script>
        </Helmet>
        <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#0B1220' }}>Frequently Asked Questions</h1>
        {loading ? <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          : faqs.length === 0 ? <p className="text-muted-foreground">No FAQs yet.</p>
          : (
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map(f => (
                <AccordionItem key={f.id} value={f.id} className="border rounded-md px-4">
                  <AccordionTrigger className="text-left">{f.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: f.body_html || '' }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
      </div>
    </PublicSiteLayout>
  );
}
