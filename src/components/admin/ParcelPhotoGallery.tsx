import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Download, Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  path: string;
  uploaded_at: string;
  url?: string | null;
}

interface Props {
  bookingId: string;
}

const ParcelPhotoGallery = ({ bookingId }: Props) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Admin auth flows via Supabase JWT (already attached by the client).
        const { data, error } = await supabase.functions.invoke("parcel-photos", {
          body: { action: "list", booking_id: bookingId },
        });
        if (error) throw error;
        if (!cancelled) setPhotos(data?.photos || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const downloadOne = async (p: Photo) => {
    if (!p.url) return;
    try {
      const res = await fetch(p.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = p.path.split("/").pop() || "parcel.jpg";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadAll = async () => {
    if (!photos.length) return;
    setZip(true);
    try {
      for (const p of photos) {
        // Sequential downloads avoid popup blockers.
        // eslint-disable-next-line no-await-in-loop
        await downloadOne(p);
      }
    } finally {
      setZip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading parcel photos…
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border border-dashed p-4">
        <ImageOff className="h-4 w-4" /> Customer has not uploaded any parcel photos yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4" />
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </div>
        <Button size="sm" variant="outline" onClick={downloadAll} disabled={zip}>
          {zip ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
          Download all
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((p) => (
          <div key={p.path} className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
            {p.url ? (
              <>
                <img
                  src={p.url}
                  alt="Parcel"
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setPreview(p.url!)}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => downloadOne(p)}
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                No URL
              </div>
            )}
            <div className="absolute top-1 left-1 text-[10px] bg-background/80 px-1.5 py-0.5 rounded">
              {new Date(p.uploaded_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="Parcel full" className="max-h-full max-w-full rounded shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default ParcelPhotoGallery;
