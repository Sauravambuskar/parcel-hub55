import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export async function uploadCmsImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('cms-media').upload(path, file, { upsert: false });
  if (error) {
    toast.error(`Upload failed: ${error.message}`);
    return null;
  }
  const { data } = supabase.storage.from('cms-media').getPublicUrl(path);
  await supabase.from('cms_media').insert({
    file_path: path,
    public_url: data.publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
  });
  return data.publicUrl;
}

export default function MediaUpload({ value, onChange, label = 'Featured Image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const url = await uploadCmsImage(file);
    setUploading(false);
    if (url) onChange(url);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {value ? (
        <div className="relative rounded-md border overflow-hidden">
          <img src={value} alt="preview" className="w-full h-48 object-cover" />
          <Button
            type="button" size="icon" variant="destructive"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange(null)}
          ><X className="h-4 w-4" /></Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full h-32 border-dashed" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" /> Upload image</>}
        </Button>
      )}
    </div>
  );
}
