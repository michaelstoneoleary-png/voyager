import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MapPin,
  Plus,
  Wallet,
  ArrowRight,
  CheckCircle2,
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
    {
      id: "destination",
      label: "Choose a destination",
      done: !!(journey.destinations?.length > 0 || journey.finalDestination),
    },
    {
      id: "dates",
      label: "Set travel dates",
      done: !!(journey.dates && journey.dates !== "TBD"),
    },
    {
      id: "travelMode",
      label: "Set travel mode",
      done: !!journey.travelMode,
    },
    {
      id: "itinerary",
      label: "Build your itinerary",
      done: !!journey.itinerary,
    },
    {
      id: "firmDates",
      label: "Firm up your dates",
      done: isSpecificDateRange(journey.dates),
    },
    ...(needsFlights
      ? [{ id: "flights", label: "Book flights", done: !!logistics.flightsBooked, selfReport: true }]
      : []),
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

  const { pct, currentStep, nextStep } =
    activeTrip && activeTrip.status !== "Completed"
      ? computeTripSteps(activeTrip, packingSummary)
      : { pct: 100, currentStep: undefined, nextStep: undefined };

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold" data-testid="text-welcome">
                Welcome back, {firstName}
              </h1>
              <p className="text-muted-foreground text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              onClick={() => setIsMarcoEntryOpen(true)}
              data-testid="button-new-journey"
            >
              <Plus className="mr-2 h-5 w-5" /> Plan a Journey
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Active Trip Hero (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />{" "}
                  {planningTrip ? "Current Focus" : "Recent Journey"}
                </h3>
              </div>

              {activeTrip ? (
                <Card className="overflow-hidden border-sidebar-border shadow-md group relative">
                  <div className="absolute top-0 right-0 w-1/2 h-full hidden md:block">
                    <img
                      src={activeTrip.image || heroTravel}
                      alt="Travel"
                      className="w-full h-full object-cover opacity-60 mask-image-linear-to-l"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background" />
                  </div>

                  <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-5">
                      <div>
                        <Badge
                          className={`mb-2 border-0 ${
                            activeTrip.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {activeTrip.status === "Completed"
                            ? "Completed Journey"
                            : activeTrip.status === "Upcoming"
                            ? "Upcoming Trip"
                            : "In Planning Phase"}
                        </Badge>
                        <h2
                          className="font-serif text-4xl font-bold text-foreground mb-2"
                          data-testid="text-active-trip-title"
                        >
                          {activeTrip.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> {activeTrip.dates}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet className="h-4 w-4" /> {activeTrip.cost} Est.
                          </span>
                        </div>
                      </div>

                      {/* Trip progress steps */}
                      {activeTrip.status !== "Completed" ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{pct}% complete</span>
                            {daysUntil !== null && (
                              <span className="text-primary font-medium flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {daysUntil} days away
                              </span>
                            )}
                          </div>
                          <Progress value={pct} className="h-1.5" />
                          {currentStep ? (
                            <div className="pt-0.5 space-y-1">
                              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                {currentStep.label}
                                {currentStep.selfReport && (
                                  <button
                                    onClick={() =>
                                      bookingMutation.mutate(
                                        currentStep.id as "flightsBooked" | "hotelsBooked"
                                      )
                                    }
                                    disabled={bookingMutation.isPending}
                                    className="ml-auto text-[10px] text-primary hover:underline font-medium disabled:opacity-50"
                                  >
                                    Mark done →
                                  </button>
                                )}
                              </div>
                              {nextStep && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="h-1.5 w-1.5 rounded-full bg-border flex-shrink-0" />
                                  Next: {nextStep.label}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-600 font-medium pt-0.5 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Ready to go!
                            </p>
                          )}
                        </div>
                      ) : null}

                      <div className="flex gap-3">
                        <Link href={`/planner/${activeTrip.id}`}>
                          <Button className="shadow-sm" data-testid="button-open-itinerary">
                            {activeTrip.status === "Completed" ? "View Itinerary" : "Open Itinerary"}
                          </Button>
                        </Link>
                        {activeTrip.status === "Completed" ? (
                          <Button
                            variant="outline"
                            onClick={() => setIsNewTripOpen(true)}
                            data-testid="button-plan-new"
                          >
                            Plan New Trip
                          </Button>
                        ) : (
                          <Link href={`/packing?journeyId=${activeTrip.id}`}>
                            <Button variant="outline" data-testid="button-view-packing">
                              View Packing List
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center border-sidebar-border border-dashed">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">No Active Journeys</h3>
                      <p className="text-muted-foreground">Start planning your next adventure today.</p>
                    </div>
                    <Button onClick={() => setIsNewTripOpen(true)} data-testid="button-create-journey">
                      Create New Journey
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Your Journeys (1/3 width) */}
            <div className="space-y-6">
              {trips.length > 0 ? (
                <Card className="bg-sidebar border-sidebar-border">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Your Journeys</CardTitle>
                    <CardDescription>Quick overview of your plans</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {trips
                      .filter((t) => t.status !== "Archived")
                      .slice(0, 5)
                      .map((trip) => (
                        <Link key={trip.id} href={`/planner/${trip.id}`}>
                          <div className="p-3 bg-background rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-primary leading-tight">
                                {trip.title}
                              </span>
                              <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                                {trip.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {trip.dates} &middot; {trip.days} days
                            </p>
                          </div>
                        </Link>
                      ))}
                  </CardContent>
                  <div className="px-6 pb-4">
                    <Link href="/journeys">
                      <span className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer">
                        View All Journeys <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </div>
                </Card>
              ) : (
                <Card className="bg-sidebar border-sidebar-border">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Getting Started</CardTitle>
                    <CardDescription>Begin your travel planning journey</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Create your first journey to start seeing travel insights, packing lists, and more.
                    </p>
                    <Button
                      onClick={() => setIsNewTripOpen(true)}
                      variant="outline"
                      className="w-full"
                      data-testid="button-get-started"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Plan Your First Trip
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </div>
      </Layout>
    </>
  );
}
