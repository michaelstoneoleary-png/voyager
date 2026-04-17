import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/lib/UserContext";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import {
  MapPin,
  Plus,
  Search,
  Loader2,
  Sparkles,
  RefreshCw,
  Calendar,
  DollarSign,
  Compass,
  Globe,
  Mountain,
  UtensilsCrossed,
  Palmtree,
  Building2,
  Waves,
  Flower2,
  Plane,
  Car,
  Train,
  Shuffle,
  ChevronRight,
  Clock,
  Star,
  Heart,
  Sun,
  Coffee,
  Navigation,
  Pencil,
  Check,
  User,
  Users,
  Baby,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  title: string;
  country: string;
  category: string;
  description: string;
  best_months: string;
  avg_daily_budget: string;
  tags: string[];
  lat: number;
  lng: number;
  image_url?: string;
  image_query?: string;
  why_for_you: string;
  travel_time_estimate?: string;
  hidden_gem?: boolean;
}

interface InspireData {
  suggestions: Suggestion[];
  generatedAt: string;
}

interface PartySize {
  type: "solo" | "couple" | "family";
  adults: number;
  children: number;
  rooms: number;
}

interface Qualifier {
  days: number;           // 1 = day trip, 2–20 = specific days, 21 = open-ended
  transport: string[];    // one or more of "flying" | "driving" | "train"
  budget: string[];       // one or more of "budget" | "midrange" | "luxury" | "unlimited"
  maxTravelHours: string; // "2" | "4" | "8" | "any"
  homeLocation: string;   // confirmed departure city
  partySize: PartySize;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TRAVEL_TIME_OPTIONS = [
  { value: "2",   label: "≤ 2 hrs",   sub: "Close to home",           icon: <Clock className="h-5 w-5" /> },
  { value: "4",   label: "≤ 4 hrs",   sub: "Half a day of travel OK", icon: <Clock className="h-5 w-5" /> },
  { value: "8",   label: "≤ 8 hrs",   sub: "Full day of travel OK",   icon: <Clock className="h-5 w-5" /> },
  { value: "any", label: "Anywhere",  sub: "No time limit",            icon: <Globe className="h-5 w-5" /> },
];

// Day trips cap at 4 hours door-to-door
const DAY_TRIP_TRAVEL_TIME_OPTIONS = TRAVEL_TIME_OPTIONS.filter(o => o.value === "2" || o.value === "4");

const TRANSPORT_OPTIONS = [
  { value: "flying",  label: "Flying",    sub: "Anywhere in the world",  icon: <Plane className="h-5 w-5" /> },
  { value: "driving", label: "Road Trip", sub: "Drivable from home",     icon: <Car className="h-5 w-5" /> },
  { value: "train",   label: "Rail",      sub: "Train or Amtrak",        icon: <Train className="h-5 w-5" /> },
];

const BUDGET_OPTIONS = [
  { value: "budget",    label: "Budget",          sub: "$50–100/day",   icon: "$" },
  { value: "midrange",  label: "Mid-Range",       sub: "$100–250/day",  icon: "$$" },
  { value: "luxury",    label: "Luxury",           sub: "$300–600/day",  icon: "$$$" },
  { value: "unlimited", label: "Sky's The Limit",  sub: "No constraint", icon: "✦" },
];

const PARTY_OPTIONS: { value: PartySize["type"]; label: string; icon: React.ReactNode }[] = [
  { value: "solo",   label: "Solo",   icon: <User className="h-5 w-5" /> },
  { value: "couple", label: "Couple", icon: <Users className="h-5 w-5" /> },
  { value: "family", label: "Family", icon: <Baby className="h-5 w-5" /> },
];

function totalAdults(p: PartySize): number {
  return p.type === "solo" ? 1 : p.type === "couple" ? 2 : p.adults;
}

function budgetSubLabel(opt: { value: string; sub: string }, n: number): string {
  if (opt.value === "unlimited") return "No constraint";
  if (n <= 1) return opt.sub;
  const m = opt.sub.match(/\$(\d+)[–-](\d+)/);
  if (!m) return opt.sub;
  return `$${parseInt(m[1]) * n}–${parseInt(m[2]) * n}/day total`;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Adventure":   <Mountain className="h-3.5 w-3.5" />,
  "Culture":     <Building2 className="h-3.5 w-3.5" />,
  "Food & Drink":<UtensilsCrossed className="h-3.5 w-3.5" />,
  "Nature":      <Palmtree className="h-3.5 w-3.5" />,
  "Urban":       <Building2 className="h-3.5 w-3.5" />,
  "Beach":       <Waves className="h-3.5 w-3.5" />,
  "Wellness":    <Flower2 className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Adventure":   "bg-orange-100 text-orange-700 border-orange-200",
  "Culture":     "bg-violet-100 text-violet-700 border-violet-200",
  "Food & Drink":"bg-amber-100 text-amber-700 border-amber-200",
  "Nature":      "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Urban":       "bg-slate-100 text-slate-700 border-slate-200",
  "Beach":       "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Wellness":    "bg-pink-100 text-pink-700 border-pink-200",
};


// ── Qualifier UI ──────────────────────────────────────────────────────────────

function daysLabel(days: number): string {
  if (days === 1) return "Day Trip — back by evening";
  if (days === 2) return "2 days";
  if (days === 3) return "Long weekend (3 days)";
  if (days <= 6) return `${days} days`;
  if (days === 7) return "1 week";
  if (days <= 13) return `${days} days`;
  if (days === 14) return "2 weeks";
  if (days <= 20) return `${days} days`;
  return "3+ weeks — open-ended";
}

function QualifierView({ onSubmit, defaultLocation }: { onSubmit: (q: Qualifier) => void; defaultLocation: string }) {
  const [days, setDays] = useState<number>(7);
  const [transport, setTransport] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [partySize, setPartySize] = useState<PartySize>({ type: "solo", adults: 1, children: 0, rooms: 1 });
  const [maxTravelHours, setMaxTravelHours] = useState<string | null>(null);
  const [homeLocation, setHomeLocation] = useState<string>(defaultLocation);

  const isDayTrip = days === 1;
  const travelTimeOptions = isDayTrip ? DAY_TRIP_TRAVEL_TIME_OPTIONS : TRAVEL_TIME_OPTIONS;

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    if (newDays === 1 && (maxTravelHours === "8" || maxTravelHours === "any")) {
      setMaxTravelHours(null);
    }
  };

  const toggleTransport = (value: string) => {
    setTransport(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleBudget = (value: string) => {
    setBudget(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handlePartySelect = (type: PartySize["type"]) => {
    if (type === "solo")   setPartySize({ type: "solo",   adults: 1, children: 0, rooms: 1 });
    if (type === "couple") setPartySize({ type: "couple", adults: 2, children: 0, rooms: 1 });
    if (type === "family") setPartySize({ type: "family", adults: 2, children: 0, rooms: 1 });
  };

  const ready = transport.length > 0 && budget.length > 0 && maxTravelHours && homeLocation.trim();

  const handleSubmit = () => {
    if (!ready) return;
    const q: Qualifier = { days, transport, budget, maxTravelHours, homeLocation: homeLocation.trim(), partySize };
    onSubmit(q);
  };

  // Single-select grid (travel time, budget)
  function OptionGrid({
    title,
    options,
    value,
    onChange,
    cols = 3,
  }: {
    title: string;
    options: { value: string; label: string; sub: string; icon: React.ReactNode }[];
    value: string | null;
    onChange: (v: string) => void;
    cols?: number;
  }) {
    return (
      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 text-foreground">{title}</h3>
        <div className={`grid gap-3 grid-cols-${cols} sm:grid-cols-${cols}`}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`
                flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center
                transition-all duration-150 cursor-pointer
                ${value === opt.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                }
              `}
            >
              <span className="text-2xl leading-none">{opt.icon}</span>
              <span className="font-semibold text-sm text-foreground">{opt.label}</span>
              <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">What kind of adventure?</h1>
          <p className="text-muted-foreground">Tell Marco what you're working with and he'll find the perfect voyage.</p>
        </div>

        {/* Duration slider */}
        <div>
          <h3 className="font-serif text-lg font-semibold mb-1 text-foreground">How long do you have?</h3>
          <div className="text-center mb-4">
            <span className="text-primary font-semibold text-base">{daysLabel(days)}</span>
          </div>
          <input
            type="range"
            min={1}
            max={21}
            value={days}
            onChange={e => handleDaysChange(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
          {/* Labels positioned at their true % along the 1–21 range */}
          <div className="relative h-5 mt-1">
            <span className="absolute left-0 text-[11px] text-muted-foreground">Day Trip</span>
            <span className="absolute text-[11px] text-muted-foreground -translate-x-1/2" style={{ left: "10%" }}>3 days</span>
            <span className="absolute text-[11px] text-muted-foreground -translate-x-1/2" style={{ left: "30%" }}>1 week</span>
            <span className="absolute text-[11px] text-muted-foreground -translate-x-1/2" style={{ left: "65%" }}>2 weeks</span>
            <span className="absolute right-0 text-[11px] text-muted-foreground">3+ weeks</span>
          </div>
        </div>

        <OptionGrid
          title={isDayTrip ? "How far are you willing to go?" : "How much travel time are you comfortable with?"}
          options={travelTimeOptions}
          value={maxTravelHours}
          onChange={setMaxTravelHours}
          cols={isDayTrip ? 2 : 4}
        />

        {/* Transport — multi-select */}
        <div>
          <h3 className="font-serif text-lg font-semibold mb-1 text-foreground">How do you want to travel?</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Select all that apply</p>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-3">
            {TRANSPORT_OPTIONS.map(opt => {
              const selected = transport.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleTransport(opt.value)}
                  className={`
                    flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center
                    transition-all duration-150 cursor-pointer
                    ${selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                    }
                  `}
                >
                  <span className="text-2xl leading-none">{opt.icon}</span>
                  <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trip type — single-select, pre-selected to Solo */}
        <div>
          <h3 className="font-serif text-lg font-semibold mb-3 text-foreground">Trip type</h3>
          <div className="grid gap-3 grid-cols-3">
            {PARTY_OPTIONS.map(opt => {
              const selected = partySize.type === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handlePartySelect(opt.value)}
                  className={`
                    flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center
                    transition-all duration-150 cursor-pointer
                    ${selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                    }
                  `}
                >
                  <span className="text-2xl leading-none">{opt.icon}</span>
                  <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {partySize.type === "family" && (
            <div className="mt-4 flex gap-8 justify-center">
              {([
                { label: "Adults",   key: "adults",   min: 1 },
                { label: "Children", key: "children", min: 0 },
                { label: "Rooms",    key: "rooms",    min: 1 },
              ] as { label: string; key: keyof PartySize; min: number }[]).map(({ label, key, min }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPartySize(prev => ({ ...prev, [key]: Math.max(min, (prev[key] as number) - 1) }))}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted"
                    >−</button>
                    <span className="w-5 text-center text-sm font-medium">{partySize[key]}</span>
                    <button
                      onClick={() => setPartySize(prev => ({ ...prev, [key]: (prev[key] as number) + 1 }))}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget — multi-select */}
        <div>
          <h3 className="font-serif text-lg font-semibold mb-1 text-foreground">What's the budget?</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Select all that apply</p>
          <div className="grid gap-3 grid-cols-4 sm:grid-cols-4">
            {BUDGET_OPTIONS.map(opt => {
              const selected = budget.includes(opt.value);
              const n = totalAdults(partySize);
              const sub = budgetSubLabel(opt, n);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleBudget(opt.value)}
                  className={`
                    flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center
                    transition-all duration-150 cursor-pointer
                    ${selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                    }
                  `}
                >
                  <span className="text-2xl leading-none">{opt.icon}</span>
                  <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Departure location */}
        <div>
          <h3 className="font-serif text-lg font-semibold mb-1 text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Where are you departing from?
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Marco uses this to calculate realistic travel times to each destination.
          </p>
          <input
            type="text"
            value={homeLocation}
            onChange={e => setHomeLocation(e.target.value)}
            placeholder="e.g. Jacksonville, FL"
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold"
          disabled={!ready}
          onClick={handleSubmit}
          data-testid="button-inspire-submit"
        >
          {ready ? (
            <>Inspire Me <ChevronRight className="h-5 w-5 ml-1" /></>
          ) : (
            "Answer all questions to continue"
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Gem Card ──────────────────────────────────────────────────────────────────

function GemCard({ gem, onStartJourney }: { gem: Suggestion; onStartJourney: (gem: Suggestion) => void }) {
  const fallbackBg = "bg-gradient-to-br from-primary/20 to-primary/5";
  const [imageUrl, setImageUrl] = useState<string | null>(gem.image_url || null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (imageUrl || fetchedRef.current) return;
    fetchedRef.current = true;
    const q = gem.image_query || gem.title;
    const type = gem.category?.toLowerCase() || "city";
    fetch(`/api/inspire/image?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.url) setImageUrl(d.url); })
      .catch(() => {});
  }, []);

  return (
    <Card className="group overflow-hidden border-0 shadow-none bg-transparent hover:bg-card hover:shadow-lg transition-all duration-300 rounded-xl" data-testid={`inspire-card-${gem.title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={gem.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.parentElement?.classList.add(fallbackBg);
            }}
          />
        ) : (
          <div className={`absolute inset-0 ${fallbackBg} flex items-center justify-center`}>
            <Globe className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className={`backdrop-blur-md border text-[11px] ${CATEGORY_COLORS[gem.category] || "bg-white/20 text-white border-0"}`}>
                {CATEGORY_ICONS[gem.category]} {gem.category}
              </Badge>
              {gem.hidden_gem && (
                <Badge className="backdrop-blur-md text-[11px] bg-emerald-600/90 text-white border-0">
                  🌿 Off the Beaten Path
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
              <DollarSign className="h-3 w-3" /> {gem.avg_daily_budget}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-5">
        <div className="mb-2">
          <h3 className="font-serif text-xl font-bold group-hover:text-primary transition-colors">{gem.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" /> {gem.country}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {gem.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>Best: {gem.best_months}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{gem.travel_time_estimate || "Travel time varies"}</span>
        </div>

        {gem.why_for_you && (
          <div className="bg-primary/5 border border-primary/10 rounded-md px-3 py-2 mb-3">
            <p className="text-xs text-primary flex items-start gap-1.5">
              <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
              {gem.why_for_you}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {gem.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">#{tag}</span>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full hover:bg-primary/10 hover:text-primary text-xs"
            onClick={() => onStartJourney(gem)}
            data-testid={`button-start-journey-${gem.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Start Journey
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Day Trip Card ─────────────────────────────────────────────────────────────

interface DayTripResult {
  id: string;
  name: string;
  category: string;
  description?: string;
  rating: number;
  review_count: number;
  url: string;
  address: string;
  photo_url?: string;
  coordinates: { latitude: number; longitude: number };
  is_wildcard?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
          {i < full ? (
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          ) : i === full && half ? (
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity={0.5} />
          ) : (
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" className="text-muted-foreground/30" />
          )}
        </svg>
      ))}
    </span>
  );
}

function DayTripCard({ place, onStartJourney }: { place: DayTripResult; onStartJourney: (p: DayTripResult) => void }) {
  const fallbackBg = "bg-gradient-to-br from-amber-100 to-amber-50";

  return (
    <Card className="group overflow-hidden border-0 shadow-none bg-transparent hover:bg-card hover:shadow-lg transition-all duration-300 rounded-xl">
      {/* Photo */}
      <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
        {place.photo_url ? (
          <img
            src={place.photo_url}
            alt={place.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.parentElement?.classList.add(...fallbackBg.split(" "));
            }}
          />
        ) : (
          <div className={`absolute inset-0 ${fallbackBg} flex items-center justify-center`}>
            <Compass className="h-12 w-12 text-amber-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

        {/* Category chip */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <Badge variant="secondary" className="backdrop-blur-md border text-[11px] bg-white/90 text-slate-700 border-0">
            <MapPin className="h-3 w-3 mr-1" />{place.category}
          </Badge>
          {place.is_wildcard && (
            <Badge className="backdrop-blur-md text-[11px] bg-emerald-600/90 text-white border-0">
              🌿 Hidden Gem
            </Badge>
          )}
        </div>

        {/* Google attribution */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-semibold bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full" style={{ color: "#4285F4" }}>
            Google
          </span>
        </div>
      </div>

      <CardContent className="p-4 pt-5">
        <h3 className="font-serif text-xl font-bold group-hover:text-primary transition-colors mb-1">{place.name}</h3>

        {/* Rating */}
        {place.rating > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={place.rating} />
            <span className="text-sm font-semibold text-amber-600">{place.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({place.review_count.toLocaleString()} reviews)</span>
          </div>
        )}

        {/* Description */}
        {place.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{place.description}</p>
        )}

        {/* Address */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-4">
          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{place.address}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <a
            href={place.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#4285F4] hover:underline flex items-center gap-1"
          >
            View on Google Maps →
          </a>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full hover:bg-primary/10 hover:text-primary text-xs flex-shrink-0"
            onClick={() => onStartJourney(place)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Plan Day Trip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Inspire() {
  const { settings } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [qualifier, setQualifier] = useState<Qualifier | null>(null);
  const [marcoParagraphs, setMarcoParagraphs] = useState<string[]>([]);
  const marcoLiveRef = useRef<HTMLParagraphElement | null>(null);
  const marcoBufferRef = useRef<string>("");
  const marcoScrollRef = useRef<HTMLDivElement | null>(null);
  const bufferedRef = useRef<Suggestion[]>([]);
  const [originOverride, setOriginOverride] = useState<string>("");
  const [showOriginEdit, setShowOriginEdit] = useState(false);

  // Streaming suggestions state (replaces useQuery)
  const [streamedSuggestions, setStreamedSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [fetchRevision, setFetchRevision] = useState(0);

  const isDayTrip = qualifier?.days === 1;

  const queryParams = qualifier
    ? `?days=${qualifier.days}`
      + `&transport=${qualifier.transport.join(",")}`
      + `&budget=${qualifier.budget.join(",")}`
      + `&maxTravelHours=${qualifier.maxTravelHours}`
      + `&homeLocation=${encodeURIComponent(qualifier.homeLocation)}`
      + `&partyAdults=${qualifier.partySize.adults}`
      + `&partyChildren=${qualifier.partySize.children}`
      + `&partyRooms=${qualifier.partySize.rooms}`
    : null;

  // Stream suggestions from SSE endpoint whenever qualifier changes or refresh is triggered
  useEffect(() => {
    if (!qualifier || isDayTrip) return;
    setStreamedSuggestions([]);
    setMarcoParagraphs([]);
    marcoBufferRef.current = "";
    bufferedRef.current = [];
    if (marcoLiveRef.current) marcoLiveRef.current.textContent = "";
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/inspire/suggestions${queryParams}`, { credentials: "include", signal: controller.signal });
        if (!res.body || cancelled) { setSuggestionsLoading(false); return; }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line === "data: [DONE]") {
              if (!cancelled) {
                // Flush any remaining prose buffer
                const remaining = marcoBufferRef.current.trim();
                if (remaining) setMarcoParagraphs(prev => [...prev, remaining]);
                marcoBufferRef.current = "";
                // Big reveal: move all buffered destinations to state at once
                setStreamedSuggestions(bufferedRef.current);
                bufferedRef.current = [];
                setSuggestionsLoading(false);
              }
            } else if (line.startsWith("data: ")) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.destination) {
                  // Buffer destination — held back until [DONE]
                  const parsed = JSON.parse(payload.destination);
                  if (!cancelled) bufferedRef.current = [...bufferedRef.current, parsed];
                } else if (payload.chunk) {
                  // Prose hint — stream live to Marco card
                  if (!cancelled) {
                    marcoBufferRef.current += payload.chunk + " ";
                    const parts = marcoBufferRef.current.split(/\n\n+/);
                    if (parts.length > 1) {
                      const complete = parts.slice(0, -1).map((p: string) => p.trim()).filter(Boolean);
                      if (complete.length) setMarcoParagraphs(prev => [...prev, ...complete]);
                      marcoBufferRef.current = parts[parts.length - 1];
                    }
                    if (marcoLiveRef.current) marcoLiveRef.current.textContent = marcoBufferRef.current;
                  }
                }
              } catch {}
            }
          }
        }
      } catch {
        if (!cancelled) {
          setSuggestionsError("Marco had trouble finding destinations. Try again?");
          setSuggestionsLoading(false);
        }
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [qualifier, fetchRevision]);

  const { data: dayTripData, isLoading: isDayTripLoading, error: dayTripError } = useQuery<{ dayTrips: DayTripResult[]; homeLocation: string }>({
    queryKey: ["/api/inspire/day-trips", qualifier?.maxTravelHours],
    queryFn: async () => {
      const params = qualifier?.maxTravelHours && qualifier.maxTravelHours !== "any"
        ? `?maxTravelHours=${qualifier.maxTravelHours}`
        : "";
      const res = await fetch(`/api/inspire/day-trips${params}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load day trips");
      }
      return res.json();
    },
    enabled: !!qualifier && isDayTrip,
    staleTime: 60 * 60 * 1000,
  });


  // Scroll to bottom when a new paragraph commits
  useEffect(() => {
    if (marcoParagraphs.length > 0 && marcoScrollRef.current) {
      marcoScrollRef.current.scrollTo({ top: marcoScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [marcoParagraphs.length]);

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/inspire/refresh");
    },
    onSuccess: () => {
      setFetchRevision(r => r + 1);
      toast({ title: "Fresh inspiration", description: "Marco has curated new dream destinations just for you." });
    },
    onError: () => {
      toast({ title: "Refresh failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const createJourneyMutation = useMutation({
    mutationFn: async (gem: Suggestion) => {
      const res = await apiRequest("POST", "/api/journeys", {
        title: `${gem.title} Adventure`,
        origin: originOverride || settings.homeLocation || "",
        finalDestination: `${gem.title}, ${gem.country}`,
        destinations: [],
        days: qualifier?.days ?? 7,
        cost: gem.avg_daily_budget ? `${gem.avg_daily_budget}/day` : "TBD",
        status: "planning",
      });
      return { journey: await res.json(), gem };
    },
    onSuccess: ({ journey, gem }) => {
      // Store gem context so TripPlanner can pre-populate the wishlist
      if (gem.tags?.length) {
        localStorage.setItem(`inspire_context_${journey.id}`, JSON.stringify({ tags: gem.tags, destination: gem.title }));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      toast({ title: "Journey created!", description: `"${journey.title}" is ready for planning.` });
      setLocation(`/planner/${journey.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create journey", description: "Please try again.", variant: "destructive" });
    },
  });

  const createDayTripJourneyMutation = useMutation({
    mutationFn: async (place: DayTripResult) => {
      const res = await apiRequest("POST", "/api/journeys", {
        title: `Day Trip: ${place.name}`,
        origin: originOverride || settings.homeLocation || "",
        finalDestination: place.name,
        destinations: [],
        days: 1,
        cost: "TBD",
        status: "planning",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      localStorage.setItem("inspire_autostart", data.id);
      toast({ title: "Day trip created!", description: `"${data.title}" is ready for planning.` });
      setLocation(`/planner/${data.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create day trip", description: "Please try again.", variant: "destructive" });
    },
  });

  function handleChangeSearch() {
    setStreamedSuggestions([]);
    setSuggestionsLoading(false);
    setSuggestionsError(null);
    setQualifier(null);
  }

  // ── Step 1: qualifier not yet answered ──────────────────────────────────────
  if (!qualifier) {
    return (
      <Layout>
        <QualifierView
          defaultLocation={settings.homeLocation || ""}
          onSubmit={(q) => {
            setOriginOverride(q.homeLocation);
            setQualifier(q);
          }}
        />
      </Layout>
    );
  }

  // ── Step 2: loading (show until [DONE] — destinations buffered, revealed all at once) ──
  if (suggestionsLoading || isDayTripLoading) {
    const dayTripPhases = [
      "Searching for top-rated spots near you…",
      "Checking distance and drive time…",
      "Finding hidden gems within reach…",
      "Almost there…",
    ];

    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
          {/* Marco avatar + spinner */}
          <div className="relative flex items-center justify-center">
            <div className="h-24 w-24 rounded-full border-4 border-primary/10" />
            <div className="absolute h-24 w-24 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            <div className="absolute w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg font-serif">M</span>
            </div>
          </div>

          {/* Streaming prose deliberation for non-day-trip */}
          {!isDayTrip ? (
            <div
              ref={marcoScrollRef}
              className="w-full max-w-xl rounded-xl bg-background border border-primary/10 px-6 py-6 shadow-sm max-h-[55vh] overflow-y-auto scroll-smooth space-y-3"
            >
              {marcoParagraphs.map((p, i) => (
                <p key={i} className="text-base text-foreground/80 leading-relaxed font-serif">{p}</p>
              ))}
              <p ref={marcoLiveRef} className="text-base text-foreground/80 leading-relaxed font-serif min-h-[1.5rem]" />
            </div>
          ) : (
            <div className="text-center max-w-xs">
              <p className="text-sm text-muted-foreground animate-in fade-in duration-500">
                {dayTripPhases[0]}
              </p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ── Step 3: error ───────────────────────────────────────────────────────────
  const suggestions = streamedSuggestions;
  const dayTrips = dayTripData?.dayTrips || [];
  const activeError = isDayTrip ? dayTripError : (suggestionsError ? new Error(suggestionsError) : null);
  const hasResults = isDayTrip ? dayTrips.length > 0 : suggestions.length > 0;

  if (activeError || (!isDayTrip && !suggestionsLoading && !hasResults)) {
    const errMsg = activeError instanceof Error ? activeError.message : undefined;
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold mb-2">
              {isDayTrip ? "Couldn't find day trips" : "Couldn't load inspiration"}
            </h2>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {errMsg || (isDayTrip ? "Make sure your home location is set in Settings and GOOGLE_PLACES_API_KEY is configured." : "Marco had trouble finding destinations. Try again?")}
            </p>
            <div className="flex gap-3 justify-center">
              {!isDayTrip && (
                <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending} data-testid="button-retry-inspire">
                  {refreshMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Try Again
                </Button>
              )}
              <Button variant="outline" onClick={handleChangeSearch}>Change Preferences</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Day Trips results view ───────────────────────────────────────────────────
  if (isDayTrip) {
    return (
      <Layout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="font-serif text-4xl font-bold mb-2">Day Trips Near You</h1>
              <p className="text-muted-foreground">
                Top-rated attractions within ~2.5 hours of {dayTripData?.homeLocation}.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold" style={{ color: "#4285F4" }}>Powered by Google</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleChangeSearch} className="flex-shrink-0">
              ← Change Trip Type
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayTrips.map((place) => (
              <DayTripCard
                key={place.id}
                place={place}
                onStartJourney={(p) => createDayTripJourneyMutation.mutate(p)}
              />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // ── Step 4: results ─────────────────────────────────────────────────────────
  const filteredBySearch = searchQuery.trim()
    ? suggestions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suggestions;

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
  }

  const filterByCategory = (categorySlug: string) =>
    categorySlug === "all" ? filteredBySearch : filteredBySearch.filter(s => slugify(s.category) === categorySlug);

  const categories = Array.from(new Set(suggestions.map(s => s.category)));
  const hasPreferences = (settings.travelStyles?.length ?? 0) > 0 || !!settings.homeLocation;

  // Friendly labels for the qualifier summary chips
  const durationLabel = daysLabel(qualifier.days);
  const transportLabel = qualifier.transport.map(v => TRANSPORT_OPTIONS.find(o => o.value === v)?.label).filter(Boolean).join(" · ");
  const budgetLabel = qualifier.budget.map(v => BUDGET_OPTIONS.find(b => b.value === v)?.label).filter(Boolean).join(" · ");
  const travelTimeLabel = TRAVEL_TIME_OPTIONS.find(t => t.value === qualifier.maxTravelHours)?.label ?? "";

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold mb-3" data-testid="text-inspire-title">Find Your Dream Voyage</h1>
            <p className="text-muted-foreground text-lg">
              {hasPreferences
                ? "Marco has handpicked destinations that match your travel soul. Your next great adventure starts here."
                : "Let Marco inspire your wanderlust with destinations you didn't know you were dreaming of."}
            </p>
            {!hasPreferences && (
              <p className="text-sm text-primary mt-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <Link href="/settings" className="underline underline-offset-2 hover:text-primary/80">Tell Marco about your travel style</Link> for deeply personal inspiration.
              </p>
            )}
            {/* Qualifier summary + change button */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-3 py-1 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {durationLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-3 py-1 text-muted-foreground">
                <Compass className="h-3 w-3" /> {travelTimeLabel} travel
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-3 py-1 text-muted-foreground">
                {qualifier.transport.includes("flying") && <Plane className="h-3 w-3" />}
                {qualifier.transport.includes("driving") && <Car className="h-3 w-3" />}
                {qualifier.transport.includes("train") && <Train className="h-3 w-3" />}
                {transportLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-3 py-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" /> {budgetLabel}
              </span>
              {/* Departing from chip — always visible; inline edit to override */}
              <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full pl-3 pr-1 py-1 text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {showOriginEdit ? (
                  <>
                    <input
                      autoFocus
                      className="bg-transparent outline-none w-28 text-xs text-foreground"
                      defaultValue={originOverride || settings.homeLocation || ""}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setOriginOverride((e.target as HTMLInputElement).value.trim());
                          setShowOriginEdit(false);
                        }
                        if (e.key === "Escape") setShowOriginEdit(false);
                      }}
                      onBlur={(e) => {
                        setOriginOverride(e.target.value.trim());
                        setShowOriginEdit(false);
                      }}
                    />
                    <Check className="h-3 w-3 text-primary cursor-pointer" onClick={() => setShowOriginEdit(false)} />
                  </>
                ) : (
                  <>
                    <span className={originOverride || settings.homeLocation ? "" : "italic"}>
                      {originOverride || settings.homeLocation || "Set departure city"}
                    </span>
                    <button
                      onClick={() => setShowOriginEdit(true)}
                      className="ml-0.5 p-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      title="Not home? Change your departure city"
                      aria-label="Edit departure city"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </>
                )}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleChangeSearch}
                className="h-7 rounded-full text-xs px-3"
                data-testid="button-change-qualifier"
              >
                ← Change
              </Button>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto items-center">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search dream destinations..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-inspire"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="flex-shrink-0"
              data-testid="button-refresh-inspire"
            >
              {refreshMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b border-border rounded-none mb-6 flex-wrap">
            <TabsTrigger value="all" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-all">
              All
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={slugify(cat)} className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid={`tab-${slugify(cat)}`}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterByCategory("all").map((gem, idx) => (
                <div
                  key={`${gem.title}-${idx}`}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <GemCard gem={gem} onStartJourney={(g) => createJourneyMutation.mutate(g)} />
                </div>
              ))}
            </div>
            {filterByCategory("all").length === 0 && !suggestionsLoading && (
              <div className="py-12 text-center text-muted-foreground">
                <p>No destinations match your search.</p>
              </div>
            )}
          </TabsContent>

          {categories.map(cat => (
            <TabsContent key={cat} value={slugify(cat)} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByCategory(slugify(cat)).map((gem, idx) => (
                  <div
                    key={`${gem.title}-${idx}`}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <GemCard gem={gem} onStartJourney={(g) => createJourneyMutation.mutate(g)} />
                  </div>
                ))}
              </div>
              {filterByCategory(slugify(cat)).length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No {cat.toLowerCase()} destinations found.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
