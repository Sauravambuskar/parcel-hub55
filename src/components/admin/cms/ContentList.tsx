import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { CONTENT_TYPE_LABELS, type CmsContent, type CmsContentType } from '@/lib/cms/types';
import { toast } from 'sonner';

interface Props {
  type: CmsContentType;
}

export default function ContentList({ type }: Props) {
  const [rows, setRows] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cms_content').select('*').eq('type', type).order('updated_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows((data || []) as unknown as CmsContent[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [type]);

  const del = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const { error } = await supabase.from('cms_content').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{CONTENT_TYPE_LABELS[type]}s</h1>
        <Button asChild>
          <Link to={`/admin/cms/${type}s/new`}><Plus className="h-4 w-4 mr-1" /> New {CONTENT_TYPE_LABELS[type]}</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No {type}s yet. Create your first one.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <Card key={r.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/admin/cms/${type}s/${r.id}`} className="font-medium hover:underline truncate">{r.title}</Link>
                  <Badge variant={r.status === 'published' ? 'default' : 'secondary'}>{r.status}</Badge>
                  <Badge variant="outline">SEO {r.seo_score}</Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">/{r.slug} · updated {new Date(r.updated_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-1">
                <Button asChild size="icon" variant="ghost"><Link to={`/admin/cms/${type}s/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
