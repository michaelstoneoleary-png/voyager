import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete: (files: File[]) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      // Filter for excel/csv/json if needed, for now accept all
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          onUploadComplete(files);
          setFiles([]);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          uploading && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept=".xlsx,.xls,.csv,.json" 
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">Upload Past Trips</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Drag and drop your Excel, CSV, or JSON files here, or click to browse.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: .xlsx, .csv
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="text-sm font-medium text-muted-foreground">Selected Files ({files.length})</div>
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-md">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                {!uploading && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {uploading && (
                  <div className="h-8 w-8 flex items-center justify-center">
                    {progress === 100 ? <Check className="h-4 w-4 text-green-500" /> : <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {!uploading && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFiles([])}>Clear</Button>
              <Button onClick={handleUpload}>Import Trips</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
