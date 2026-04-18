import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Masthead, Kicker, EditorialCard } from "@/components/ui/editorial";
import {
  Calendar,
  MapPin,
  Plus,
  Wallet,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTrips } from "@/lib/TripContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import heroTravel from "@/assets/hero-travel.png";
import { NewTripDialog } from "@/components/NewTripDialog";
import { MarcoEntryDialog } from "@/components/MarcoEntryDialog";
import { TravelCheckInDialog } from "@/components/TravelCheckInDialog";
import { useState } from "react";
import { Link } from "wouter";

function parseDaysUntil(dates: string): number | null {
  if (!dates) return null;
  const yearMatch = dates.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : null;
  const raw = dates.split(/[–—]|(?<!\d)-(?!\d)|\bto\b/i)[0].trim();
  const candidate = year && !raw.includes(year) ? `${raw}, ${year}` : raw;
  const parsed = new Date(candidate);
  if (isNaN(parsed.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  const days = Math.round((parsed.getTime() - today.getTime()) / 86_400_000);
  return days > 0 ? days : null;
}

function isSpecificDateRange(dates: string | null | undefined): boolean {
  if (!dates || dates === "TBD" || dates.startsWith("Flexible")) return false;
  return /\d{4}/.test(dates) && /[–\-]/.test(dates);
}

interface TripStep {
  id: string;
  label: string;
  done: boolean;
  selfReport?: boolean;
}

function computeTripSteps(
  journey: any,
  packingSummary: { totalItems: number; packedItems: number; percentComplete: number; exists: boolean } | undefined
): { pct: number; currentStep: TripStep | undefined; nextStep: TripStep | undefined; steps: TripStep[] } {
  const needsFlights = journey.travelMode === "fly" || journey.travelMode === "mixed";
  const logistics = (journey.logistics as any) || {};

  const steps: TripStep[] = [
    { id: "destination", label: "Choose a destination", done: !!(journey.destinations?.length > 0 || journey.finalDestination) },
    { id: "dates", label: "Set travel dates", done: !!(journey.dates && journey.dates !== "TBD") },
    { id: "travelMode", label: "Set travel mode", done: !!journey.travelMode },
    { id: "itinerary", label: "Build your itinerary", done: !!journey.itinerary },
    { id: "firmDates", label: "Firm up your dates", done: isSpecificDateRange(journey.dates) },
    ...(needsFlights ? [{ id: "flights", label: "Book flights", done: !!logistics.flightsBooked, selfReport: true }] : []),
    { id: "hotels", label: "Book accommodation", done: !!logistics.hotelsBooked, selfReport: true },
    {
      id: "packing",
      label: "Pack for the trip",
      done: !!(packingSummary?.exists && packingSummary.percentComplete === 100 && packingSummary.totalItems > 0),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const pct = Math.round((completedCount / steps.length) * 100);
  const currentStep = steps.find((s) => !s.done);
  const currentIdx = currentStep ? steps.indexOf(currentStep) : -1;
  const nextStep = currentIdx >= 0 ? steps.slice(currentIdx + 1).find((s) => !s.done) : undefined;

  return { pct, currentStep, nextStep, steps };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [isMarcoEntryOpen, setIsMarcoEntryOpen] = useState(false);
  const { trips } = useTrips();
  const queryClient = useQueryClient();

  const firstName = user?.firstName || "Traveler";
  const planningTrip = trips.find((t) => t.status === "Upcoming" || t.status === "Planning");
  const activeTrip = planningTrip || trips[0];
  const daysUntil = activeTrip ? parseDaysUntil(activeTrip.dates) : null;

  const dayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const completedTrips = trips.filter((t) => t.status === "Completed");
  const totalDays = trips.reduce((sum, t) => sum + (Number(t.days) || 0), 0);
  const otherTrips = trips.filter((t) => t.id !== activeTrip?.id).slice(0, 3);

  const { data: packingSummary } = useQuery({
    queryKey: [`/api/journeys/${activeTrip?.id}/packing-summary`],
    queryFn: async () => {
      const res = await fetch(`/api/journeys/${activeTrip!.id}/packing-summary`, { credentials: "include" });
      if (!res.ok) return { totalItems: 0, packedItems: 0, percentComplete: 0, exists: false };
      return res.json();
    },
    enabled: !!activeTrip && activeTrip.status !== "Completed",
  });

  const bookingMutation = useMutation({
    mutationFn: async (flag: "flightsBooked" | "hotelsBooked") => {
      const current = (activeTrip?.logistics as any) || {};
      const res = await apiRequest("PATCH", `/api/journeys/${activeTrip!.id}`, {
        logistics: { ...current, [flag]: true },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
    },
  });

  const { pct, currentStep } =
    activeTrip && activeTrip.status !== "Completed"
      ? computeTripSteps(activeTrip, packingSummary)
      : { pct: 100, currentStep: undefined };

  return (
    <>
      <NewTripDialog open={isNewTripOpen} onOpenChange={setIsNewTripOpen} />
      <MarcoEntryDialog
        open={isMarcoEntryOpen}
        onOpenChange={setIsMarcoEntryOpen}
        onJourneyBuilder={() => setIsNewTripOpen(true)}
      />
      {user && (
        <TravelCheckInDialog
          userId={user.id}
          firstName={user.firstName || "Traveler"}
          passportCountry={user.passportCountry}
          journeys={trips}
        />
      )}

      <Layout>
        <div className="space-y-10 animate-in fade-in duration-500">

          {/* Masthead */}
          <Masthead
            eyebrow={`TODAY · ${dayStr.toUpperCase()}`}
            meta="bon VOYAGER"
            title={`Good morning, ${firstName}`}
            data-testid="text-welcome"
          />

          {/* Hero journey card */}
          {activeTrip ? (
            <div className="space-y-5">
              {/* 16:9 full-bleed image with overlay */}
              <div
                className="relative overflow-hidden rounded-[14px] w-full shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                style={{ aspectRatio: "16/9" }}
              >
                <img
                  src={activeTrip.image || heroTravel}
                  alt={activeTrip.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f2722]/85 via-[#1f2722]/25 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  <Kicker className="text-[color:var(--sand)] mb-2">
                    {activeTrip.status === "Completed"
                      ? "COMPLETED JOURNEY"
                      : activeTrip.status === "Upcoming"
                      ? "UPCOMING TRIP"
                      : "IN PLANNING"}
                  </Kicker>
                  <h2
                    className="[font-family:var(--serif)] text-[28px] md:text-[40px] font-medium tracking-[-0.02em] leading-[1.1] text-white mb-3"
                    data-testid="text-active-trip-title"
                  >
                    {activeTrip.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {activeTrip.dates && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[12px] [font-family:var(--mono)] tracking-[0.05em]">
                        <Calendar className="h-3 w-3" /> {activeTrip.dates}
                      </span>
                    )}
                    {activeTrip.cost && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[12px] [font-family:var(--mono)] tracking-[0.05em]">
                        <Wallet className="h-3 w-3" /> {activeTrip.cost}
                      </span>
                    )}
                    {daysUntil !== null && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--clay)]/90 text-white text-[12px] [font-family:var(--mono)] tracking-[0.05em]">
                        <MapPin className="h-3 w-3" /> {daysUntil} days away
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress + actions row */}
              {activeTrip.status !== "Completed" ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-1">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] [font-family:var(--mono)] tracking-[0.1em] uppercase text-[color:var(--ink-muted)]">
                        {pct}% complete
                      </span>
                    </div>
                    <Progress value={pct} className="h-px bg-[color:var(--rule)]" />
                    {currentStep ? (
                      <div className="flex items-center gap-2 text-[13px] text-[color:var(--ink-soft)]">
                        <div className="h-1 w-1 rounded-full bg-[color:var(--clay)] flex-shrink-0" />
                        {currentStep.label}
                        {currentStep.selfReport && (
                          <button
                            onClick={() => bookingMutation.mutate(currentStep.id as "flightsBooked" | "hotelsBooked")}
                            disabled={bookingMutation.isPending}
                            className="ml-auto text-[12px] text-[color:var(--clay)] hover:underline font-medium disabled:opacity-50"
                          >
                            Mark done →
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[13px] text-emerald-600 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ready to go!
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <Link href={`/planner/${activeTrip.id}`}>
                      <Button
                        className="rounded-full bg-[var(--ink)] text-[var(--cream)] hover:bg-[var(--forest-deep)] border-0 text-[13px] font-medium transition-colors duration-150 px-5"
                        data-testid="button-open-itinerary"
                      >
                        Open in Planner →
                      </Button>
                    </Link>
                    <Link href={`/packing?journeyId=${activeTrip.id}`}>
                      <Button
                        variant="outline"
                        className="rounded-full border-[color:var(--rule)] text-[color:var(--ink)] hover:bg-[color:var(--sand)] text-[13px] transition-colors duration-150 px-5"
                        data-testid="button-view-packing"
                      >
                        Packing List
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 px-1">
                  <Link href={`/planner/${activeTrip.id}`}>
                    <Button
                      className="rounded-full bg-[var(--ink)] text-[var(--cream)] hover:bg-[var(--forest-deep)] border-0 text-[13px] font-medium transition-colors duration-150 px-5"
                      data-testid="button-open-itinerary"
                    >
                      View Itinerary →
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="rounded-full border-[color:var(--rule)] text-[color:var(--ink)] hover:bg-[color:var(--sand)] text-[13px] transition-colors duration-150 px-5"
                    onClick={() => setIsNewTripOpen(true)}
                    data-testid="button-plan-new"
                  >
                    Plan New Trip
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-[14px] border border-dashed border-[color:var(--rule)] p-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-[color:var(--sand)] flex items-center justify-center mx-auto">
                <Plus className="h-6 w-6 text-[color:var(--ink-muted)]" />
              </div>
              <div>
                <h3 className="[font-family:var(--serif)] text-[22px] font-medium text-[color:var(--ink)]">
                  No Active Journeys
                </h3>
                <p className="text-[color:var(--ink-muted)] text-[15px] mt-1">
                  Start planning your next adventure today.
                </p>
              </div>
              <Button
                className="rounded-full bg-[var(--ink)] text-[var(--cream)] hover:bg-[var(--forest-deep)] border-0 text-[13px] font-medium transition-colors duration-150 px-5"
                onClick={() => setIsNewTripOpen(true)}
                data-testid="button-create-journey"
              >
                <Plus className="mr-2 h-4 w-4" /> Create New Journey
              </Button>
            </div>
          )}

          {/* Atlas strip — stats across all journeys */}
          {trips.length > 0 && (
            <div className="border-y border-[color:var(--rule)] py-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-[color:var(--rule)]">
              {[
                { label: "JOURNEYS", value: String(trips.length) },
                { label: "COMPLETED", value: String(completedTrips.length) },
                { label: "DAYS", value: totalDays > 0 ? String(totalDays) : "—" },
                { label: "IN PROGRESS", value: String(trips.filter((t) => t.status !== "Completed").length) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1 px-4 py-2">
                  <Kicker>{label}</Kicker>
                  <span className="[font-family:var(--serif)] text-[36px] font-medium tracking-[-0.02em] text-[color:var(--ink)] leading-none mt-1">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Related journeys — editorial card grid */}
          {otherTrips.length > 0 && (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="[font-family:var(--serif)] text-[22px] font-medium tracking-[-0.02em] text-[color:var(--ink)]">
                  From your library
                </h2>
                <Link href="/journeys">
                  <span className="flex items-center gap-1 text-[13px] text-[color:var(--clay)] hover:underline font-medium cursor-pointer">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherTrips.map((trip, i) => (
                  <Link key={trip.id} href={`/planner/${trip.id}`}>
                    <EditorialCard
                      image={trip.image || heroTravel}
                      number={i + 1}
                      category={trip.status}
                      title={trip.title}
                      dek={trip.dates || undefined}
                      ratio="3/4"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Plan a new journey CTA */}
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              className="rounded-full border-[color:var(--rule)] text-[color:var(--ink)] hover:bg-[color:var(--sand)] text-[13px] transition-colors duration-150 px-5"
              onClick={() => setIsMarcoEntryOpen(true)}
              data-testid="button-new-journey"
            >
              <Plus className="mr-2 h-4 w-4" /> Plan a New Journey
            </Button>
          </div>

        </div>
      </Layout>
    </>
  );
}
