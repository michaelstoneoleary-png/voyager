import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Compass, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJourneyBuilder: () => void;
}

export function MarcoEntryDialog({ open, onOpenChange, onJourneyBuilder }: Props) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
        {/* Marco header */}
        <div className="bg-primary/5 border-b border-border px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-base font-serif">M</span>
          </div>
          <div>
            <p className="font-semibold text-sm">Marco</p>
            <p className="text-xs text-muted-foreground">Your travel companion</p>
          </div>
        </div>

        {/* Opening question */}
        <div className="px-6 pt-6 pb-2">
          <p className="font-serif text-xl leading-snug text-foreground">
            Where are we headed? Got somewhere in mind, or should we find it together?
          </p>
        </div>

        {/* Two large route buttons */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => { onOpenChange(false); onJourneyBuilder(); }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background px-4 py-6 text-center hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">I know where I'm going</p>
              <p className="text-xs text-muted-foreground mt-0.5">Build my itinerary</p>
            </div>
          </button>

          <button
            onClick={() => { onOpenChange(false); setLocation("/inspire"); }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background px-4 py-6 text-center hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Inspire Me</p>
              <p className="text-xs text-muted-foreground mt-0.5">Inspire my next adventure</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
