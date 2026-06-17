import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2, Upload, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthSession } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ParcelPhoto {
  path: string;
  uploaded_at: string;
  url?: string | null;
}

interface ParcelPhotoUploadProps {
  bookingId: string;
  maxPhotos?: number;
  compact?: boolean;
}

const MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.82;

async function compressImage(file: File): Promise<{ blob: Blob; type: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files allowed");
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("compress failed"))),
      "image/jpeg",
      COMPRESS_QUALITY,
    ),
  );
  return { blob, type: "image/jpeg" };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

const ParcelPhotoUpload = ({ bookingId, maxPhotos = 5, compact }: ParcelPhotoUploadProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<ParcelPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const auth = getAuthSession();

  const refresh = async () => {
    if (!bookingId || !auth) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parcel-photos", {
        body: { action: "list", booking_id: bookingId },
        headers: { "x-prayog-auth": JSON.stringify(auth) },
      });
      if (error) throw error;
      setPhotos(data?.photos || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!auth) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    const available = maxPhotos - photos.length;
    if (available <= 0) {
      toast({ title: `Limit reached (${maxPhotos} photos)`, variant: "destructive" });
      return;
    }
    const toUpload = Array.from(files).slice(0, available);
    setUploading(true);
    try {
      for (const f of toUpload) {
        if (!f.type.startsWith("image/")) {
          toast({ title: `Skipped ${f.name}`, description: "Not an image", variant: "destructive" });
          continue;
        }
        const { blob, type } = await compressImage(f);
        const b64 = await blobToBase64(blob);
        const { data, error } = await supabase.functions.invoke("parcel-photos", {
          body: {
            action: "upload",
            booking_id: bookingId,
            file: { data: b64, content_type: type },
          },
          headers: { "x-prayog-auth": JSON.stringify(auth) },
        });
        if (error || data?.error) throw new Error(error?.message || data?.error);
        if (data?.photo) setPhotos((p) => [...p, data.photo]);
      }
      toast({ title: "Photos uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (path: string) => {
    if (!auth) return;
    setDeleting(path);
    try {
      const { error, data } = await supabase.functions.invoke("parcel-photos", {
        body: { action: "delete", booking_id: bookingId, path },
        headers: { "x-prayog-auth": JSON.stringify(auth) },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setPhotos((p) => p.filter((x) => x.path !== path));
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const remaining = maxPhotos - photos.length;
  const hasNone = !loading && photos.length === 0;

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">Required before pickup:</span> Upload up to {maxPhotos} clear photos of your packed parcel (all sides + label). This helps us verify the parcel condition at pickup and at delivery.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {photos.map((p) => (
          <div key={p.path} className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
            {p.url ? (
              <img src={p.url} alt="Parcel" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">…</div>
            )}
            <button
              type="button"
              onClick={() => handleDelete(p.path)}
              disabled={deleting === p.path}
              className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-100"
              aria-label="Delete photo"
            >
              {deleting === p.path ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-md border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center text-primary text-xs font-medium gap-1 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Camera className="h-5 w-5" />
                <span>Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading ? "Loading…" : `${photos.length} / ${maxPhotos} uploaded`}
        </span>
        {hasNone && (
          <span className="text-warning font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> No photos yet
          </span>
        )}
      </div>

      {remaining > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading…" : photos.length === 0 ? "Upload parcel photos" : "Add more photos"}
        </Button>
      )}
    </div>
  );
};

export default ParcelPhotoUpload;
