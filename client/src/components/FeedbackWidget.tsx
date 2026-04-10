import { useState } from "react";
import { MessageSquarePlus, Send, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const { toast } = useToast();

  async function captureScreenshot() {
    setCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.documentElement, {
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      setScreenshot(canvas.toDataURL("image/jpeg", 0.8));
    } catch {
      setScreenshot(null);
    } finally {
      setCapturing(false);
    }
  }

  async function handleOpen() {
    setOpen(true);
    await captureScreenshot();
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Feedback
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base">Send Feedback</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Screenshot preview */}
            <div className="rounded-lg overflow-hidden border border-border bg-muted/30 h-32 flex items-center justify-center relative">
              {capturing ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Capturing screenshot…</span>
                </div>
              ) : screenshot ? (
                <>
                  <img src={screenshot} alt="Screenshot" className="w-full h-full object-cover" />
                  <button
                    onClick={captureScreenshot}
                    className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Camera className="h-3 w-3" /> Retake
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Camera className="h-5 w-5" />
                  <span className="text-xs">No screenshot</span>
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
