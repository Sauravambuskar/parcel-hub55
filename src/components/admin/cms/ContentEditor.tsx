import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/admin/cms/RichTextEditor';
import MediaUpload, { uploadCmsImage } from '@/components/admin/cms/MediaUpload';
import SEOPanel from '@/components/admin/cms/SEOPanel';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_PATHS, slugify, type CmsContent, type CmsContentType } from '@/lib/cms/types';
import { analyzeSeo } from '@/lib/cms/seo-score';
import { Loader2, Save, ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  type: CmsContentType;
}

export default function ContentEditor({ type }: Props) {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Partial<CmsContent>>({
    type, title: '', slug: '', body_html: '', status: 'draft',
    schema_type: type === 'faq' ? 'FAQPage' : 'Article',
    robots: 'index,follow', tags: [],
  });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [authors, setAuthors] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    supabase.from('cms_categories').select('id,name').order('name').then(({ data }) => setCategories(data || []));
    supabase.from('cms_authors').select('id,name').order('name').then(({ data }) => setAuthors(data || []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    supabase.from('cms_content').select('*').eq('id', id!).single().then(({ data, error }) => {
      if (error) { toast.error(error.message); navigate(-1); return; }
      setData(data as unknown as CmsContent);
      setLoading(false);
    });
  }, [id, isNew, navigate]);

  const patch = (p: Partial<CmsContent>) => setData((d) => ({ ...d, ...p }));

  const handleTitleChange = (title: string) => {
    const auto = isNew && (!data.slug || data.slug === slugify(data.title || ''));
    patch({ title, ...(auto ? { slug: slugify(title) } : {}) });
  };

  const save = async (publish?: boolean) => {
    if (!data.title?.trim()) { toast.error('Title required'); return; }
    if (!data.slug?.trim()) { toast.error('Slug required'); return; }
    setSaving(true);
    const seo = analyzeSeo(data);
    const payload: Record<string, unknown> = {
      ...data,
      type,
      seo_score: seo.score,
      ...(publish !== undefined ? { status: publish ? 'published' : 'draft' } : {}),
      ...(publish && !data.published_at ? { published_at: new Date().toISOString() } : {}),
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    if (isNew) {
      const { data: row, error } = await supabase.from('cms_content').insert(payload as never).select('id').single();
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success('Created');
      navigate(`/admin/cms/${type}s/${row.id}`, { replace: true });
    } else {
      const { error } = await supabase.from('cms_content').update(payload as never).eq('id', id!);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success(publish ? 'Published' : 'Saved');
      if (publish !== undefined) patch({ status: publish ? 'published' : 'draft' });
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const publicUrl = `${CONTENT_TYPE_PATHS[type]}/${data.slug}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/cms/${type}s`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-semibold">{isNew ? `New ${CONTENT_TYPE_LABELS[type]}` : `Edit ${CONTENT_TYPE_LABELS[type]}`}</h1>
        </div>
        <div className="flex gap-2">
          {!isNew && data.status === 'published' && (
            <Button variant="outline" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" /> View</a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => save(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Save Draft
          </Button>
          <Button size="sm" onClick={() => save(true)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : data.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={data.title || ''} onChange={(e) => handleTitleChange(e.target.value)} className="text-lg" />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">{CONTENT_TYPE_PATHS[type]}/</span>
                  <Input id="slug" value={data.slug || ''} onChange={(e) => patch({ slug: slugify(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" value={data.excerpt || ''} onChange={(e) => patch({ excerpt: e.target.value })} rows={2} />
              </div>
            </CardContent>
          </Card>

          {type === 'faq' ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Answer</CardTitle></CardHeader>
              <CardContent>
                <RichTextEditor value={data.body_html || ''} onChange={(html) => patch({ body_html: html })}
                  onInsertImage={async () => {
                    const f = await pickFile(); return f ? uploadCmsImage(f) : null;
                  }} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
              <CardContent>
                <RichTextEditor value={data.body_html || ''} onChange={(html) => patch({ body_html: html })}
                  onInsertImage={async () => {
                    const f = await pickFile(); return f ? uploadCmsImage(f) : null;
                  }} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Publish</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{data.status}</span>
              </div>
              {type === 'post' && (
                <>
                  <div>
                    <Label>Category</Label>
                    <Select value={data.category_id || 'none'} onValueChange={(v) => patch({ category_id: v === 'none' ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Author</Label>
                    <Select value={data.author_id || 'none'} onValueChange={(v) => patch({ author_id: v === 'none' ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {authors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input value={(data.tags || []).join(', ')}
                      onChange={(e) => patch({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
                  </div>
                </>
              )}
              {type === 'partner' && (
                <div>
                  <Label>Partner Code</Label>
                  <Input value={data.partner_code || ''} onChange={(e) => patch({ partner_code: e.target.value })} placeholder="dhl, delhivery..." />
                </div>
              )}
              {type === 'faq' && (
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" value={data.faq_order ?? ''} onChange={(e) => patch({ faq_order: e.target.value ? Number(e.target.value) : null })} />
                </div>
              )}
            </CardContent>
          </Card>

          {type !== 'faq' && (
            <Card>
              <CardContent className="pt-6 space-y-2">
                <MediaUpload value={data.featured_image_url} onChange={(url) => patch({ featured_image_url: url })} />
                {data.featured_image_url && (
                  <div>
                    <Label htmlFor="alt">Alt Text</Label>
                    <Input id="alt" value={data.featured_image_alt || ''} onChange={(e) => patch({ featured_image_alt: e.target.value })} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">SEO (Yoast)</CardTitle></CardHeader>
            <CardContent><SEOPanel content={data} onChange={patch} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}
