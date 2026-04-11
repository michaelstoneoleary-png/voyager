import { useState } from "react";
import { MessageSquarePlus, Send, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

async function takeScreenshot(): Promise<string | null> {
  // Primary: native screen capture — accurate rendering of CSS variables, transforms, etc.
  // getDisplayMedia is called from a click handler so the user-gesture requirement is met.
  if ("getDisplayMedia" in ((navigator as any).mediaDevices || {})) {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: false,
        // Chrome 107+: auto-selects the current tab, skipping the full screen picker
        preferCurrentTab: true,
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => video.play().then(() => resolve()).catch(reject);
        video.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      const scale = 0.5;
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((t) => t.stop());
      return canvas.toDataURL("image/jpeg", 0.75);
    } catch {
      // User denied permission or browser doesn't support — fall through to html2canvas
    }
  }

  // Fallback: html2canvas DOM render (less accurate on CSS-variable-heavy apps)
  try {
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(document.body, {
      scale: 0.5,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      ignoreElements: (el) => el.tagName === "IFRAME",
      onclone: (clonedDoc) => {
        // backdrop-filter crashes html2canvas — strip it from the clone
        clonedDoc.querySelectorAll<HTMLElement>("*").forEach((el) => {
          el.style.backdropFilter = "none";
          (el.style as any).webkitBackdropFilter = "none";
        });
      },
    });
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch (err) {
    console.warn("[FeedbackWidget] Screenshot failed:", err);
    return null;
  }
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const { toast } = useToast();

  async function handleOpen() {
    setCapturing(true);
    try {
      const img = await takeScreenshot();
      setScreenshot(img);
    } finally {
      setCapturing(false);
      setOpen(true);
    }
  }

  async function retake() {
    setCapturing(true);
    try {
      const img = await takeScreenshot();
      setScreenshot(img);
    } finally {
      setCapturing(false);
    }
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/feedback", {
        message,
        screenshot,
        pageUrl: window.location.href,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Feedback sent!", description: "Thanks — we'll take a look." });
      setOpen(false);
      setMessage("");
      setScreenshot(null);
    },
    onError: () => {
      toast({
        title: "Couldn't send feedback",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {/* Floating pill button */}
      <button
        onClick={handleOpen}
        disabled={capturing}
        className="fixed bottom-6 right-[5.5rem] z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200 text-sm font-semibold disabled:opacity-70"
        title="Send feedback"
      >
        {capturing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquarePlus className="h-4 w-4" />
        )}
        <span>{capturing ? "Capturing…" : "Feedback"}</span>
      </button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base">Send Feedback</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Screenshot preview */}
            <div className="rounded-lg overflow-hidden border border-border bg-muted/30 h-44 flex items-center justify-center relative">
              {capturing ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Capturing screenshot…</span>
                </div>
              ) : screenshot ? (
                <>
                  <img src={screenshot} alt="Screenshot" className="w-full h-full object-contain bg-muted/20" />
                  <button
                    onClick={retake}
                    className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Camera className="h-3 w-3" /> Retake
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Camera className="h-5 w-5" />
                  <span className="text-xs">No screenshot captured</span>
                </div>
              )}
            </div>

            <Textarea
              placeholder="What happened? What could be better? What do you love?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none text-sm"
              rows={4}
              autoFocus
            />

            <Button
              className="w-full"
              onClick={() => submitMutation.mutate()}
              disabled={!message.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
