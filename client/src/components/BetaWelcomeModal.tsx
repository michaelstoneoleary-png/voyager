import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bonvoyager_beta_v1";

export function BetaWelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
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

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <h2 className="font-serif text-2xl font-bold leading-snug">
            You made it in.<br />Now break things.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            bon VOYAGER is still finding its wings — and that's exactly why you're here.
            Plan a trip, push every button, find the rough edges. We want you to explore
            it like you own the place.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The <strong className="text-foreground">Feedback</strong> button lives at the top of every page.
            When something delights you (or breaks), hit it. We read every single one.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button className="w-full" onClick={dismiss}>
            Let's explore →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
