import { useRef, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, ImagePlus, CheckCircle2, AlertCircle } from "lucide-react";

interface PreviewFile {
  file: File;
  objectUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface PhotoUploadProps {
  journeyId: string;
  onDone?: () => void;
}

export function PhotoUpload({ journeyId, onDone }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    const newPreviews = images.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const uploadAll = async () => {
    if (previews.length === 0) return;
    setUploading(true);

    // Upload in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < previews.length; i += batchSize) {
      const batch = previews.slice(i, i + batchSize);
      const formData = new FormData();
      batch.forEach((p) => formData.append("photos", p.file));

      // Mark batch as uploading
      setPreviews((prev) =>
        prev.map((p, idx) =>
          idx >= i && idx < i + batchSize ? { ...p, status: "uploading" } : p
        )
      );

      try {
        const res = await fetch(`/api/journeys/${journeyId}/photos`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Upload failed" }));
          setPreviews((prev) =>
            prev.map((p, idx) =>
              idx >= i && idx < i + batchSize ? { ...p, status: "error", error: err.message } : p
            )
          );
        } else {
          setPreviews((prev) =>
            prev.map((p, idx) =>
              idx >= i && idx < i + batchSize ? { ...p, status: "done" } : p
            )
          );
        }
      } catch {
        setPreviews((prev) =>
          prev.map((p, idx) =>
            idx >= i && idx < i + batchSize ? { ...p, status: "error", error: "Network error" } : p
          )
        );
      }
    }

    queryClient.invalidateQueries({ queryKey: [`/api/journeys/${journeyId}/photos`] });
    setUploading(false);
    onDone?.();
  };

  const doneCount = previews.filter((p) => p.status === "done").length;
  const errorCount = previews.filter((p) => p.status === "error").length;
  const progress = previews.length > 0 ? Math.round((doneCount / previews.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors
          ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"}`}
      >
        <ImagePlus className="w-10 h-10 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">Drop photos here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">JPEG, PNG, HEIC — up to 20 MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {/* Preview grid */}
      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {previews.map((p, i) => (
              <div key={p.objectUrl} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                <img
                  src={p.objectUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {/* Status overlay */}
                {p.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white animate-pulse" />
                  </div>
                )}
                {p.status === "done" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                )}
                {p.status === "error" && (
                  <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-300" />
                  </div>
                )}
                {/* Remove button */}
                {p.status === "pending" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {doneCount} / {previews.length} uploaded{errorCount > 0 ? ` · ${errorCount} failed` : ""}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={uploadAll} disabled={uploading || previews.every((p) => p.status !== "pending")}>
              <Upload className="w-4 h-4 mr-2" />
              Upload {previews.filter((p) => p.status === "pending").length} photo{previews.filter((p) => p.status === "pending").length !== 1 ? "s" : ""}
            </Button>
            {!uploading && (
              <Button variant="ghost" onClick={() => setPreviews([])}>
                Clear
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
