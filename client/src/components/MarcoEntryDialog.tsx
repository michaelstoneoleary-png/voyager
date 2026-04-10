import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Compass } from "lucide-react";
import { useLocation } from "wouter";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJourneyBuilder: () => void;
}

export function MarcoEntryDialog({ open, onOpenChange, onJourneyBuilder }: Props) {
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setInput("");
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/marco/classify-intent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      onOpenChange(false);
      if (data.intent === "inspire") {
        setLocation("/inspire");
      } else {
        onJourneyBuilder();
      }
    } catch {
      onOpenChange(false);
      onJourneyBuilder();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
        <div className="bg-primary/5 border-b border-border px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-base font-serif">M</span>
          </div>
          <div>
            <p className="font-semibold text-sm">Marco</p>
            <p className="text-xs text-muted-foreground">Your travel companion</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="font-serif text-lg leading-snug text-foreground">
            Where are we headed? Got somewhere in mind, or should we find it together?
          </p>

          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={3}
              placeholder="Tell Marco what you're thinking…"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 pr-12"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-colors"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={loading}
              onClick={() => { onOpenChange(false); onJourneyBuilder(); }}
            >
              <Compass className="h-3.5 w-3.5 mr-1.5" /> I know where I'm going
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={loading}
              onClick={() => { onOpenChange(false); setLocation("/inspire"); }}
            >
              Help me find somewhere
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
