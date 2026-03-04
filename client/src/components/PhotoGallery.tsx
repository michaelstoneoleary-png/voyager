import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Trash2, Pencil, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PhotoUpload } from "./PhotoUpload";

interface JourneyPhoto {
  id: string;
  journeyId: string;
  url: string;
  thumbnailUrl: string | null;
  lat: number | null;
  lng: number | null;
  takenAt: string | null;
  caption: string | null;
  dayIndex: number | null;
  createdAt: string;
}

interface PhotoGalleryProps {
  journeyId: string;
}

export function PhotoGallery({ journeyId }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery<JourneyPhoto[]>({
    queryKey: [`/api/journeys/${journeyId}/photos`],
    queryFn: () => apiRequest("GET", `/api/journeys/${journeyId}/photos`).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) =>
      apiRequest("DELETE", `/api/journeys/${journeyId}/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journeys/${journeyId}/photos`] });
      if (lightboxIndex !== null && lightboxIndex >= photos.length - 1) {
        setLightboxIndex(null);
      }
      toast({ title: "Photo deleted" });
    },
    onError: () => toast({ title: "Failed to delete photo", variant: "destructive" }),
  });

  const captionMutation = useMutation({
    mutationFn: ({ photoId, caption }: { photoId: string; caption: string }) =>
      apiRequest("PATCH", `/api/journeys/${journeyId}/photos/${photoId}`, { caption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journeys/${journeyId}/photos`] });
      setEditingCaption(null);
    },
    onError: () => toast({ title: "Failed to save caption", variant: "destructive" }),
  });

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  // Group by day taken (date string) or "Undated"
  const grouped = photos.reduce<Record<string, JourneyPhoto[]>>((acc, photo) => {
    const key = photo.takenAt
      ? new Date(photo.takenAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : "Undated";
    (acc[key] ??= []).push(photo);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" onClick={() => setShowUpload((v) => !v)}>
          {showUpload ? "Hide Upload" : "Add Photos"}
        </Button>
      </div>

      {showUpload && (
        <PhotoUpload journeyId={journeyId} onDone={() => setShowUpload(false)} />
      )}

      {photos.length === 0 && !showUpload && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📷</p>
          <p className="font-medium">No photos yet</p>
          <p className="text-sm mt-1">Upload photos to remember this journey</p>
        </div>
      )}

      {/* Gallery grouped by date */}
      {Object.entries(grouped).map(([dateLabel, group]) => (
        <div key={dateLabel}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{dateLabel}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {group.map((photo) => {
              const index = photos.indexOf(photo);
              return (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={photo.thumbnailUrl ?? photo.url}
                    alt={photo.caption ?? ""}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {photo.lat != null && (
                    <div className="absolute bottom-1 left-1 bg-black/50 rounded-full p-0.5">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-1.5">
                      <p className="text-xs text-white line-clamp-1">{photo.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-0">
          <DialogTitle className="sr-only">
            {lightboxPhoto?.caption ?? "Photo"}
          </DialogTitle>
          {lightboxPhoto && (
            <div className="relative">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption ?? ""}
                className="w-full max-h-[80vh] object-contain"
              />

              {/* Nav arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-2 text-white hover:bg-black/80"
                    onClick={() => setLightboxIndex((i) => (i! - 1 + photos.length) % photos.length)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-2 text-white hover:bg-black/80"
                    onClick={() => setLightboxIndex((i) => (i! + 1) % photos.length)}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Bottom bar */}
              <div className="bg-black/80 p-3 flex items-center gap-2">
                {editingCaption === lightboxPhoto.id ? (
                  <>
                    <Input
                      autoFocus
                      value={captionValue}
                      onChange={(e) => setCaptionValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") captionMutation.mutate({ photoId: lightboxPhoto.id, caption: captionValue });
                        if (e.key === "Escape") setEditingCaption(null);
                      }}
                      placeholder="Add a caption…"
                      className="flex-1 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                    <button
                      onClick={() => captionMutation.mutate({ photoId: lightboxPhoto.id, caption: captionValue })}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCaption(null)} className="text-white/60 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-sm text-white/80 truncate">
                      {lightboxPhoto.caption || <span className="text-white/30 italic">No caption</span>}
                    </p>
                    <button
                      onClick={() => { setEditingCaption(lightboxPhoto.id); setCaptionValue(lightboxPhoto.caption ?? ""); }}
                      className="text-white/60 hover:text-white"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </>
                )}

                {lightboxPhoto.lat != null && (
                  <a
                    href={`https://maps.google.com/?q=${lightboxPhoto.lat},${lightboxPhoto.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white"
                    title="View on map"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => {
                    deleteMutation.mutate(lightboxPhoto.id);
                    setLightboxIndex(null);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Date + counter */}
              <div className="absolute top-3 left-3 bg-black/60 rounded-full px-3 py-1 text-xs text-white">
                {lightboxIndex! + 1} / {photos.length}
                {lightboxPhoto.takenAt && (
                  <span className="ml-2 text-white/60">
                    {new Date(lightboxPhoto.takenAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
