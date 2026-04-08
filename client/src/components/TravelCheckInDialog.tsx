import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trip } from "@/lib/TripContext";

interface TravelCheckInDialogProps {
  userId: string;
  firstName: string;
  passportCountry?: string | null;
  journeys: Trip[];
}

function parseJourneyEndDate(dates: string | null | undefined): Date | null {
  if (!dates) return null;
  // Split on en-dash (U+2013) or regular hyphen surrounded by spaces
  const parts = dates.split("–").map((s) => s.trim());
  const endPart = parts[parts.length - 1];
  const parsed = new Date(endPart);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function isJourneyDomestic(finalDestination: string, passportCountry: string | null | undefined): boolean {
  if (!passportCountry) return true; // default to shorter threshold
  return finalDestination.toLowerCase().includes(passportCountry.toLowerCase());
}

const GATE_DAYS = 14;

function getLastShownKey(userId: string): string {
  return `trip_checkin_last_shown_${userId}`;
}

function hasShownWithin14Days(userId: string): boolean {
  const stored = localStorage.getItem(getLastShownKey(userId));
  if (!stored) return false;
  const last = new Date(stored);
  if (isNaN(last.getTime())) return false;
  const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < GATE_DAYS;
}

function markShownNow(userId: string): void {
  localStorage.setItem(getLastShownKey(userId), new Date().toISOString());
}

function getEligibleJourneys(journeys: Trip[], userId: string, passportCountry: string | null | undefined): Trip[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return journeys.filter((j) => {
    if (!j.finalDestination) return false;
    if (j.status === "Completed" || j.status === "Archived") return false;
    if (localStorage.getItem(`trip_checkin_dismissed_${j.id}`)) return false;

    const endDate = parseJourneyEndDate(j.dates);

    if (endDate !== null) {
      // Future end date → never eligible
      if (endDate >= today) return false;
      // Past end date → eligible immediately
      return true;
    }

    // No parseable date → use updatedAt or createdAt + threshold
    const referenceStr = j.updatedAt || j.createdAt;
    if (!referenceStr) return false;

    const reference = new Date(referenceStr);
    if (isNaN(reference.getTime())) return false;

    const thresholdDays = isJourneyDomestic(j.finalDestination, passportCountry) ? 30 : 60;
    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
    return today.getTime() - reference.getTime() >= thresholdMs;
  });
}

type Step = "question" | "log" | "confirmed";

export function TravelCheckInDialog({ userId, firstName, passportCountry, journeys }: TravelCheckInDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<Trip | null>(null);
  const [step, setStep] = useState<Step>("question");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId || journeys.length === 0) return;

    if (hasShownWithin14Days(userId)) return;

    const eligible = getEligibleJourneys(journeys, userId, passportCountry);
    if (eligible.length === 0) return;

    // 50% random chance — feels occasional, not clockwork
    if (Math.random() < 0.5) {
      markShownNow(userId);
      return;
    }

    const journey = eligible[Math.floor(Math.random() * eligible.length)];
    setSelectedJourney(journey);
    setOpen(true);
    markShownNow(userId);
  }, [userId, journeys, passportCountry]);

  function handleClose() {
    setOpen(false);
  }

  function handleAskLater() {
    // 14-day gate already set on mount; just close
    setOpen(false);
  }

  function handleNeverAskAgain() {
    if (selectedJourney) {
      localStorage.setItem(`trip_checkin_dismissed_${selectedJourney.id}`, "1");
    }
    setOpen(false);
  }

  function handleYes() {
    setStep("log");
  }

  async function handleSave() {
    if (!selectedJourney) return;
    setSaving(true);
    try {
      await fetch("/api/past-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          destination: selectedJourney.finalDestination,
          journeyId: selectedJourney.id,
          startDate: startDate || null,
          endDate: endDate || null,
          notes: notes || null,
        }),
      });
      localStorage.setItem(`trip_checkin_dismissed_${selectedJourney.id}`, "1");
      setStep("confirmed");
      setTimeout(() => setOpen(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    if (selectedJourney) {
      localStorage.setItem(`trip_checkin_dismissed_${selectedJourney.id}`, "1");
    }
    setOpen(false);
  }

  if (!selectedJourney) return null;

  const destination = selectedJourney.finalDestination!;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        {step === "question" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Hey {firstName}!</DialogTitle>
              <DialogDescription className="text-base pt-1">
                You planned a trip to <strong className="text-foreground">{destination}</strong> — did you make it?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 pt-2">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleAskLater}>
                  Ask me later
                </Button>
                <Button size="sm" onClick={handleYes}>
                  Yes, I went! ✓
                </Button>
              </div>
              <button
                onClick={handleNeverAskAgain}
                className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
              >
                Maybe someday!
              </button>
            </DialogFooter>
          </>
        )}

        {step === "log" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Wonderful!</DialogTitle>
              <DialogDescription className="text-base pt-1">
                When did you go? <span className="text-muted-foreground text-sm">(optional)</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">How was it?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="A few words... (optional)"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={handleSkip} disabled={saving}>
                Skip
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save to my travel log"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirmed" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Logged!</DialogTitle>
              <DialogDescription className="text-base pt-1">
                We've added <strong>{destination}</strong> to your travel history and won't suggest it again in Inspire.
              </DialogDescription>
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
