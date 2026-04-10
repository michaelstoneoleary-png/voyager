import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { MapPin, Calendar, Clock, DollarSign, Compass, ArrowLeft, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Activity {
  time?: string;
  title: string;
  type?: string;
  duration?: string;
  description?: string;
  cost?: string;
  tip?: string;
  travel_to_next?: { mode: string; duration: string; distance: string; note?: string };
}

interface ItineraryDay {
  day: number;
  date_label?: string;
  location: string;
  activities: Activity[];
}

interface SharedJourneyData {
  id: string;
  title: string;
  origin?: string;
  finalDestination?: string;
  dates?: string;
  days?: number;
  itinerary?: { days: ItineraryDay[]; summary?: string };
}

const TYPE_COLORS: Record<string, string> = {
  culture:     "bg-violet-100 text-violet-700 border-violet-200",
  food:        "bg-amber-100 text-amber-700 border-amber-200",
  nature:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  shopping:    "bg-pink-100 text-pink-700 border-pink-200",
  nightlife:   "bg-indigo-100 text-indigo-700 border-indigo-200",
  logistics:   "bg-slate-100 text-slate-700 border-slate-200",
  relaxation:  "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export default function SharedJourney() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { data: journey, isLoading, error } = useQuery<SharedJourneyData>({
    queryKey: ["/api/public/journey", id],
    queryFn: async () => {
      const res = await fetch(`/api/public/journey/${id}`);
      if (!res.ok) throw new Error("Journey not found");
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-transparent border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Loading itinerary…</p>
        </div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Compass className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Journey not found</h2>
          <p className="text-muted-foreground mb-6">This itinerary link may be invalid or the journey may have been removed.</p>
          <Link href="/">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to bon VOYAGER</Button>
          </Link>
        </div>
      </div>
    );
  }

  const itin = journey.itinerary;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-sidebar/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-serif text-xl font-bold tracking-tight text-primary">bon VOYAGER</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? <Check className="mr-2 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Link href="/register">
              <Button size="sm">Plan your own trip →</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Title block */}
        <div>
          <h1 className="font-serif text-4xl font-bold mb-3">{journey.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {(journey.origin || journey.finalDestination) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {journey.origin && journey.finalDestination
                  ? `${journey.origin} → ${journey.finalDestination}`
                  : journey.origin || journey.finalDestination}
              </span>
            )}
            {journey.dates && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {journey.dates}
              </span>
            )}
            {journey.days && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {journey.days === 1 ? "Day Trip" : `${journey.days} days`}
              </span>
            )}
          </div>
        </div>

        {/* Marco's write-up */}
        {itin?.summary && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs font-serif">M</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Marco's Write-Up</span>
            </div>
            <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed font-serif space-y-4">
              {itin.summary.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}

        {/* Day-by-day */}
        {itin?.days && itin.days.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-bold mb-6">Itinerary</h2>
            <div className="space-y-8">
              {itin.days.map((day) => (
                <div key={day.day}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {day.day}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {day.date_label || `Day ${day.day}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {day.location}
                      </div>
                    </div>
                  </div>

                  <div className="ml-11 space-y-3">
                    {day.activities.map((act, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {act.time && (
                              <span className="text-xs font-mono text-muted-foreground w-10 flex-shrink-0">{act.time}</span>
                            )}
                            <span className="font-medium text-sm">{act.title}</span>
                          </div>
                          {act.type && (
                            <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${TYPE_COLORS[act.type] || ""}`}>
                              {act.type}
                            </Badge>
                          )}
                        </div>
                        {act.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed ml-12">{act.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 ml-12 text-[11px] text-muted-foreground">
                          {act.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{act.duration}</span>}
                          {act.cost && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{act.cost}</span>}
                        </div>
                        {act.tip && (
                          <p className="text-[11px] text-primary/80 italic ml-12 mt-1.5">Tip: {act.tip}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground mb-4 font-serif">Want to plan your own adventure?</p>
          <Link href="/register">
            <Button size="lg">Start your journey with bon VOYAGER →</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
