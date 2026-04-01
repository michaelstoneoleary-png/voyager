import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/lib/UserContext";
import { useParams } from "wouter";
import { useState, useRef, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Car,
  Info,
  Plus,
  Loader2,
  Sparkles,
  Clock,
  DollarSign,
  Lightbulb,
  ArrowLeft,
  Eye,
  UtensilsCrossed,
  Star,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  ListPlus,
  X,
  Building2,
  BedDouble,
  Bike,
  Bus,
  Train,
  Ship,
  Plane,
  Footprints as Walk,
  Trash2,
  RefreshCw,
  TimerReset,
  MoreVertical,
  Replace,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Send,
  Compass,
  Heart,
  Sun,
  Coffee,
  Navigation,
  Luggage,
  BookOpen,
  Download,
  Share2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "wouter";

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Convert a distance string (from AI, may be km or miles) to the user's preferred unit
function formatDistance(raw: string, preferMiles: boolean): string {
  if (!raw) return raw;
  // Already in miles — leave it
  if (/\bmi(les?)?\b/i.test(raw)) return raw;
  // Meters → convert to ft or m
  const mMatch = raw.match(/^([\d.,]+)\s*m\b(?!i)/i);
  if (mMatch) {
    const m = parseFloat(mMatch[1].replace(",", "."));
    if (preferMiles) return `${Math.round(m * 3.281)} ft`;
    return raw;
  }
  // Kilometres
  const kmMatch = raw.match(/([\d.,]+)\s*km/i);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1].replace(",", "."));
    if (preferMiles) {
      const mi = km * 0.6214;
      return mi < 0.1 ? `${Math.round(mi * 5280)} ft` : `${mi.toFixed(1)} mi`;
    }
  }
  return raw;
}

interface TravelToNext {
  mode: string;
  duration: string;
  distance?: string;
  note?: string;
}

interface Activity {
  time: string;
  title: string;
  type: string;
  duration?: string;
  description?: string;
  cost?: string;
  tip?: string;
  lat?: number;
  lng?: number;
  image_url?: string;
  image_query?: string;
  travel_to_next?: TravelToNext;
  place_url?: string;
  place_rating?: number;
  place_review_count?: number;
  place_price?: string;
}

interface Hotel {
  name: string;
  category: string;
  price_per_night: string;
  rating: number;
  review_summary: string;
  why_this_hotel: string;
  neighborhood: string;
  lat?: number;
  lng?: number;
  image_url?: string;
  image_query?: string;
}

interface ItineraryDay {
  day: number;
  date_label: string;
  location: string;
  activities: Activity[];
  hotels?: Hotel[];
}

interface Itinerary {
  days: ItineraryDay[];
  summary?: string;
}

interface HighlightItem {
  title: string;
  description: string;
  tip?: string;
  confidence?: number;
  review_query?: string;
}

interface DestinationHighlights {
  name: string;
  must_see: HighlightItem[];
  must_do: HighlightItem[];
  must_eat: HighlightItem[];
}

interface Highlights {
  destinations: DestinationHighlights[];
}

interface Journey {
  id: string;
  title: string;
  origin?: string;
  finalDestination?: string;
  dates?: string;
  days?: number;
  cost?: string;
  status: string;
  destinations?: string[];
  itinerary?: Itinerary;
  highlights?: Highlights;
  travelMode?: string;
}

const TRAVEL_MODE_LABELS: Record<string, string> = {
  drive: "Road Trip",
  fly: "Flying",
  train: "Train",
  bus: "Bus",
  ferry: "Ferry",
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center[0], center[1], zoom]);
  return null;
}

function createNumberedIcon(num: number, isSelected: boolean) {
  return L.divIcon({
    className: "custom-numbered-marker",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${isSelected ? "#7c3aed" : "#1e293b"};
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? "0.4" : "0.2"});
      transform: ${isSelected ? "scale(1.3)" : "scale(1)"};
      transition: transform 0.2s, background 0.2s;
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createHotelIcon(isSelected: boolean) {
  return L.divIcon({
    className: "custom-hotel-marker",
    html: `<div style="
      width: 30px; height: 30px; border-radius: 6px;
      background: ${isSelected ? "#d97706" : "#f59e0b"};
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 14px; border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? "0.4" : "0.2"});
      transform: ${isSelected ? "scale(1.3)" : "scale(1)"};
      transition: transform 0.2s, background 0.2s;
    ">🏨</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function getTravelIcon(mode: string) {
  const m = mode.toLowerCase();
  if (m === "walk" || m === "walking") return <Walk className="h-3 w-3" />;
  if (m === "drive" || m === "driving" || m === "car") return <Car className="h-3 w-3" />;
  if (m === "taxi" || m === "rideshare" || m === "uber") return <Car className="h-3 w-3" />;
  if (m === "bus") return <Bus className="h-3 w-3" />;
  if (m === "transit" || m === "metro" || m === "subway") return <Train className="h-3 w-3" />;
  if (m === "train" || m === "rail") return <Train className="h-3 w-3" />;
  if (m === "ferry" || m === "boat") return <Ship className="h-3 w-3" />;
  if (m === "flight" || m === "fly" || m === "plane") return <Plane className="h-3 w-3" />;
  if (m === "bike" || m === "bicycle" || m === "cycling") return <Bike className="h-3 w-3" />;
  return <Car className="h-3 w-3" />;
}

const HOTEL_CATEGORY_COLORS: Record<string, string> = {
  luxury: "bg-yellow-100 text-yellow-800 border-yellow-300",
  upscale: "bg-orange-100 text-orange-800 border-orange-300",
  "mid-range": "bg-blue-100 text-blue-700 border-blue-300",
  budget: "bg-green-100 text-green-700 border-green-300",
  boutique: "bg-purple-100 text-purple-700 border-purple-300",
  hostel: "bg-teal-100 text-teal-700 border-teal-300",
};

const TYPE_COLORS: Record<string, string> = {
  culture: "bg-violet-100 text-violet-700 border-violet-200",
  food: "bg-amber-100 text-amber-700 border-amber-200",
  logistics: "bg-slate-100 text-slate-700 border-slate-200",
  nature: "bg-emerald-100 text-emerald-700 border-emerald-200",
  shopping: "bg-pink-100 text-pink-700 border-pink-200",
  nightlife: "bg-indigo-100 text-indigo-700 border-indigo-200",
  relaxation: "bg-sky-100 text-sky-700 border-sky-200",
};

export default function TripPlanner() {
  const params = useParams<{ id: string }>();
  const journeyId = params.id;
  const { settings } = useUser();
  const preferMiles = settings.distanceUnit !== "km";
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journey, isLoading, error } = useQuery<Journey>({
    queryKey: [`/api/journeys/${journeyId}`],
    queryFn: async () => {
      const res = await fetch(`/api/journeys/${journeyId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load journey");
      return res.json();
    },
    enabled: !!journeyId,
  });

  const [viewMode, setViewMode] = useState<"itinerary" | "photos">("itinerary");
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [activeHighlightDest, setActiveHighlightDest] = useState(0);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);
  const [wishlist, setWishlist] = useState("");
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [inspireContext, setInspireContext] = useState<{ destination: string } | null>(null);
  const [marcoParagraphs, setMarcoParagraphs] = useState<string[]>([]);
  const marcoLiveRef = useRef<HTMLParagraphElement | null>(null);
  const marcoBufferRef = useRef<string>("");
  const marcoScrollRef = useRef<HTMLDivElement | null>(null);
  const [activityMenu, setActivityMenu] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [replaceMode, setReplaceMode] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [modifyingActivity, setModifyingActivity] = useState<{ dayIndex: number; activityIndex: number; action: string } | null>(null);
  const [likedActivities, setLikedActivities] = useState<Set<string>>(new Set());
  const [replaceIsHardReject, setReplaceIsHardReject] = useState(false);
  const [customReplaceText, setCustomReplaceText] = useState("");
  const [selectedHotelsPerCity, setSelectedHotelsPerCity] = useState<Record<string, Hotel>>({});
  const [hotelModalCity, setHotelModalCity] = useState<string | null>(null);
  const wishlistInputRef = useRef<HTMLInputElement>(null);

  // Travel dates — derive startDate from journey.dates if it contains an ISO date
  const parsedStartDate = useMemo(() => {
    const raw = (journey as any)?.dates as string | undefined;
    if (!raw) return "";
    // Try to find a parseable date: "Mar 15–22, 2026" → try first date
    const isoMatch = raw.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    return "";
  }, [(journey as any)?.dates]);

  const [startDate, setStartDate] = useState<string>("");
  useEffect(() => { if (parsedStartDate) setStartDate(parsedStartDate); }, [parsedStartDate]);

  // Pre-populate wishlist from Inspire context (stored by Inspire page on journey creation)
  useEffect(() => {
    if (!journeyId) return;
    const raw = localStorage.getItem(`inspire_context_${journeyId}`);
    if (!raw) return;
    try {
      const ctx = JSON.parse(raw) as { tags: string[]; destination: string };
      if (ctx.tags?.length) setWishlistItems(ctx.tags);
      setInspireContext({ destination: ctx.destination });
    } catch {}
    localStorage.removeItem(`inspire_context_${journeyId}`);
  }, [journeyId]);

  // Compute end date and formatted range from startDate + journey.days
  const tripDays = (journey as any)?.days as number | undefined;
  const endDate = useMemo(() => {
    if (!startDate || !tripDays) return "";
    const d = new Date(startDate + "T00:00:00");
    d.setDate(d.getDate() + tripDays - 1);
    return d.toISOString().split("T")[0];
  }, [startDate, tripDays]);

  const formattedDateRange = useMemo(() => {
    if (!startDate) return "";
    const start = new Date(startDate + "T00:00:00");
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!endDate) return fmt(start);
    const end = new Date(endDate + "T00:00:00");
    const sameYear = start.getFullYear() === end.getFullYear();
    return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
  }, [startDate, endDate]);

  const dateSaveMutation = useMutation({
    mutationFn: async (iso: string) => {
      const d = new Date(iso + "T00:00:00");
      const endD = tripDays ? new Date(iso + "T00:00:00") : null;
      if (endD && tripDays) endD.setDate(endD.getDate() + tripDays - 1);
      const fmt = (dt: Date) => dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const label = endD
        ? `${fmt(d)} – ${fmt(endD)}, ${endD.getFullYear()}`
        : fmt(d);
      const res = await apiRequest("PATCH", `/api/journeys/${journeyId}`, { dates: label });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/journeys/${journeyId}`], data);
    },
  });

  // Parse a cost string like "$20-30", "$50", "Free", "~$100 per person" → [min, max] or null
  function parseCostRange(raw: string | undefined): [number, number] | null {
    if (!raw) return null;
    const s = raw.trim();
    if (/^free$/i.test(s)) return [0, 0];
    const rangeMatch = s.match(/\$\s*([\d,]+)\s*[-–]\s*([\d,]+)/);
    if (rangeMatch) return [parseFloat(rangeMatch[1].replace(/,/g, "")), parseFloat(rangeMatch[2].replace(/,/g, ""))];
    const singleMatch = s.match(/~?\$\s*([\d,]+)/);
    if (singleMatch) { const v = parseFloat(singleMatch[1].replace(/,/g, "")); return [v, v]; }
    return null;
  }

  // Tally estimated trip costs from the generated itinerary
  const expenseTally = useMemo(() => {
    const itin = (journey as any)?.itinerary as { days: ItineraryDay[] } | undefined;
    if (!itin?.days) return null;
    let actMin = 0, actMax = 0, hotelMin = 0, hotelMax = 0;
    for (const day of itin.days) {
      for (const a of day.activities || []) {
        const r = parseCostRange(a.cost);
        if (r) { actMin += r[0]; actMax += r[1]; }
      }
      if (journey?.days !== 1) {
        const city = day.location;
        const hotel = selectedHotelsPerCity[city] ?? day.hotels?.[0];
        if (hotel?.price_per_night) {
          const r = parseCostRange(hotel.price_per_night);
          if (r) { hotelMin += r[0]; hotelMax += r[1]; }
        }
      }
    }
    const totalMin = actMin + hotelMin;
    const totalMax = actMax + hotelMax;
    if (totalMin === 0 && totalMax === 0) return null;
    const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
    return {
      activities: actMin === actMax ? fmt(actMin) : `${fmt(actMin)}–${fmt(actMax)}`,
      accommodation: hotelMin === hotelMax ? fmt(hotelMin) : `${fmt(hotelMin)}–${fmt(hotelMax)}`,
      total: totalMin === totalMax ? fmt(totalMin) : `${fmt(totalMin)}–${fmt(totalMax)}`,
    };
  }, [journey, selectedHotelsPerCity]);

  // Map city → hotel options from first day in that city
  const hotelsByCity = useMemo(() => {
    const map: Record<string, Hotel[]> = {};
    const itinerary = (journey as any)?.itinerary as { days: ItineraryDay[] } | undefined;
    if (itinerary?.days) {
      for (const day of itinerary.days) {
        if (day.hotels?.length && !map[day.location]) {
          map[day.location] = day.hotels;
        }
      }
    }
    return map;
  }, [journey]);

  const downloadItinerary = () => {
    if (!journey) return;
    const itin = (journey as any)?.itinerary as Itinerary | undefined;
    if (!itin) return;
    const lines: string[] = [];
    lines.push(journey.title);
    if (journey.dates) lines.push(journey.dates);
    const route = [journey.origin, ...(journey.destinations || []), journey.finalDestination].filter(Boolean).join(" → ");
    if (route) lines.push(route);
    if (journey.days) lines.push(`${journey.days} days`);
    lines.push("");
    if (itin.summary) {
      lines.push("─── Marco's Write-Up ────────────────────────────────────────────────");
      lines.push("");
      lines.push(itin.summary);
      lines.push("");
      lines.push("─────────────────────────────────────────────────────────────────────");
      lines.push("");
    }
    for (const day of itin.days) {
      const dayLabel = day.date_label && day.date_label !== `Day ${day.day}` ? day.date_label : `Day ${day.day}`;
      lines.push(`${dayLabel.toUpperCase()} — ${day.location}`);
      lines.push("═".repeat(60));
      lines.push("");
      for (const act of day.activities) {
        lines.push(`${act.time || ""}  ${act.title}${act.duration ? ` (${act.duration})` : ""}${act.type ? ` [${act.type}]` : ""}`);
        if (act.description) lines.push(`       ${act.description}`);
        if (act.cost && act.cost.toLowerCase() !== "free") lines.push(`       Cost: ${act.cost}`);
        if (act.tip) lines.push(`       Tip: ${act.tip}`);
        if (act.travel_to_next) {
          lines.push(`       → Next: ${act.travel_to_next.mode} · ${act.travel_to_next.duration} · ${act.travel_to_next.distance}`);
          if (act.travel_to_next.note) lines.push(`         ${act.travel_to_next.note}`);
        }
        lines.push("");
      }
      if (journey.days !== 1 && day.hotels && day.hotels.length > 0) {
        lines.push("  WHERE TO STAY:");
        for (const hotel of day.hotels) {
          lines.push(`  · ${hotel.name} (${hotel.category}) — ${hotel.price_per_night}/night  ★ ${hotel.rating}`);
          if (hotel.neighborhood) lines.push(`    ${hotel.neighborhood}`);
          if (hotel.why_this_hotel) lines.push(`    ${hotel.why_this_hotel}`);
        }
        lines.push("");
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${journey.title.replace(/[^a-z0-9]/gi, "_")}_itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addWishlistItem = () => {
    const item = wishlist.trim();
    if (item && !wishlistItems.includes(item)) {
      setWishlistItems(prev => [...prev, item]);
      setWishlist("");
      wishlistInputRef.current?.focus();
    }
  };

  const removeWishlistItem = (index: number) => {
    setWishlistItems(prev => prev.filter((_, i) => i !== index));
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      setMarcoParagraphs([]);
      marcoBufferRef.current = "";
      if (marcoLiveRef.current) marcoLiveRef.current.textContent = "";

      // Stream Marco's prose thinking concurrently with itinerary generation
      const thinkingFetch = fetch(`/api/journeys/${journeyId}/marco-thinking`, { credentials: "include" });
      thinkingFetch.then(async (thinkRes) => {
        if (!thinkRes.body) return;
        const reader = thinkRes.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line === "data: [DONE]") {
              const remaining = marcoBufferRef.current.trim();
              if (remaining) setMarcoParagraphs(prev => [...prev, remaining]);
              marcoBufferRef.current = "";
            } else if (line.startsWith("data: ")) {
              try {
                const { chunk } = JSON.parse(line.slice(6));
                if (chunk) {
                  marcoBufferRef.current += chunk;
                  const parts = marcoBufferRef.current.split(/\n\n+/);
                  if (parts.length > 1) {
                    const complete = parts.slice(0, -1).map((p: string) => p.trim()).filter(Boolean);
                    if (complete.length) setMarcoParagraphs(prev => [...prev, ...complete]);
                    marcoBufferRef.current = parts[parts.length - 1];
                  }
                  if (marcoLiveRef.current) marcoLiveRef.current.textContent = marcoBufferRef.current;
                }
              } catch {}
            }
          }
        }
      }).catch(() => {});

      const wishlistText = wishlistItems.length > 0 ? wishlistItems.join("\n- ") : "";
      const res = await apiRequest("POST", `/api/journeys/${journeyId}/generate-itinerary`, {
        wishlist: wishlistText ? `- ${wishlistText}` : "",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/journeys/${journeyId}`], data);
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      setMarcoParagraphs([]);
      toast({ title: "Itinerary generated", description: "Your personalized itinerary from Marco is ready." });
    },
    onError: (err: any) => {
      setMarcoParagraphs([]);
      marcoBufferRef.current = "";
      toast({ title: "Generation failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  // Scroll to bottom of Marco prose panel when a new paragraph commits
  useEffect(() => {
    if (marcoParagraphs.length > 0 && marcoScrollRef.current) {
      marcoScrollRef.current.scrollTo({ top: marcoScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [marcoParagraphs.length]);

  const highlightsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journeys/${journeyId}/generate-highlights`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/journeys/${journeyId}`], data);
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      setShowHighlights(true);
      toast({ title: "Highlights ready", description: "Must See, Must Do, and Must Eat recommendations are ready." });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const activityMutation = useMutation({
    mutationFn: async (params: { dayIndex: number; activityIndex: number; action: string; replaceType?: string; customRequest?: string }) => {
      const res = await apiRequest("POST", `/api/journeys/${journeyId}/remove-activity`, params);
      return res.json();
    },
    onMutate: (params) => {
      setModifyingActivity({ dayIndex: params.dayIndex, activityIndex: params.activityIndex, action: params.action });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData([`/api/journeys/${journeyId}`], data);
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      setModifyingActivity(null);
      setActivityMenu(null);
      setReplaceMode(null);
      setSelectedActivity(null);
      setCustomReplaceText("");
      const actionLabel = variables.action === "replace" ? "replaced" : variables.action === "extend_previous" ? "removed (previous extended)" : "removed";
      toast({ title: "Activity updated", description: `Activity has been ${actionLabel}.` });
    },
    onError: (err: any) => {
      setModifyingActivity(null);
      toast({ title: "Failed to modify activity", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const ACTIVITY_TYPES = [
    { value: "culture", label: "Culture", color: "bg-violet-100 text-violet-700 hover:bg-violet-200" },
    { value: "food", label: "Food", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
    { value: "nature", label: "Nature", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
    { value: "shopping", label: "Shopping", color: "bg-pink-100 text-pink-700 hover:bg-pink-200" },
    { value: "nightlife", label: "Nightlife", color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
    { value: "relaxation", label: "Relaxation", color: "bg-sky-100 text-sky-700 hover:bg-sky-200" },
  ];

  const itinerary = journey?.itinerary as Itinerary | undefined;
  const highlights = journey?.highlights as Highlights | undefined;
  const currentDayData = itinerary?.days?.[selectedDay];

  const allMarkers = useMemo(() => {
    const markers: { lat: number; lng: number; title: string; index: number; activity: Activity }[] = [];
    if (currentDayData?.activities) {
      currentDayData.activities.forEach((a, idx) => {
        if (a.lat && a.lng && typeof a.lat === "number" && typeof a.lng === "number") {
          markers.push({ lat: a.lat, lng: a.lng, title: a.title || "Activity", index: idx, activity: a });
        }
      });
    }
    return markers;
  }, [currentDayData]);

  const hotelMarkers = useMemo(() => {
    const markers: { lat: number; lng: number; name: string; hotel: Hotel }[] = [];
    if (currentDayData?.hotels) {
      currentDayData.hotels.forEach((h) => {
        if (h.lat && h.lng && typeof h.lat === "number" && typeof h.lng === "number") {
          markers.push({ lat: h.lat, lng: h.lng, name: h.name, hotel: h });
        }
      });
    }
    return markers;
  }, [currentDayData]);

  const routePath = useMemo(() => {
    return allMarkers.map(m => [m.lat, m.lng] as [number, number]);
  }, [allMarkers]);

  const mapCenter: [number, number] = selectedHotel?.lat && selectedHotel?.lng
    ? [selectedHotel.lat, selectedHotel.lng]
    : selectedActivity?.lat && selectedActivity?.lng
      ? [selectedActivity.lat, selectedActivity.lng]
      : allMarkers.length > 0
        ? [allMarkers[0].lat, allMarkers[0].lng]
        : [48.8566, 2.3522];

  const mapZoom = (selectedHotel?.lat || selectedActivity?.lat) ? 15 : allMarkers.length > 1 ? 12 : 14;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !journey) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground" data-testid="text-journey-error">Journey not found</p>
          <Link href="/journeys">
            <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Journeys</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-xl mx-auto py-8">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold mb-2">{journey.title}</h1>
            <p className="text-muted-foreground">
              {[journey.origin, ...(journey.destinations || []), journey.finalDestination].filter(Boolean).join(" → ") || "No destinations set"} 
              {journey.days ? ` • ${journey.days} days` : ""}
              {journey.cost && journey.cost !== "TBD" ? ` • ${journey.cost}` : ""}
              {journey.travelMode && journey.travelMode !== "mixed" ? ` • ${TRAVEL_MODE_LABELS[journey.travelMode] || journey.travelMode}` : ""}
            </p>
          </div>

          <Card className="w-full" data-testid="wishlist-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListPlus className="h-5 w-5 text-primary" />
                Your Travel Wishlist
              </CardTitle>
              <CardDescription>
                {inspireContext
                  ? `Marco pre-loaded highlights from your Inspire pick — edit freely or add your own. Everything here shapes the itinerary.`
                  : `Add places you want to visit, restaurants to try, activities you're interested in, or anything else you'd like included in your itinerary. Marco will weave these into your plan.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  ref={wishlistInputRef}
                  type="text"
                  value={wishlist}
                  onChange={(e) => setWishlist(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWishlistItem(); } }}
                  placeholder="e.g. Visit the Rila Monastery, Try shopska salad, Walk through Vitosha park..."
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  data-testid="input-wishlist"
                />
                <Button size="sm" variant="outline" onClick={addWishlistItem} disabled={!wishlist.trim()} data-testid="button-add-wishlist">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {wishlistItems.length > 0 && (
                <div className="flex flex-wrap gap-2" data-testid="wishlist-items">
                  {wishlistItems.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="py-1 px-3 flex items-center gap-1.5 text-sm" data-testid={`wishlist-item-${idx}`}>
                      {item}
                      <button onClick={() => removeWishlistItem(idx)} className="ml-0.5 hover:text-destructive transition-colors" data-testid={`button-remove-wishlist-${idx}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {wishlistItems.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No items yet — add what matters to you, or skip ahead and let Marco choose for you.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Travel dates picker */}
          {!generateMutation.isPending && (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  When are you traveling?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value) dateSaveMutation.mutate(e.target.value);
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  {endDate && (
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1.5 block">End date</label>
                      <div className="flex h-9 items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                        {new Date(endDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  )}
                </div>
                {formattedDateRange ? (
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formattedDateRange}{tripDays ? ` · ${tripDays} day${tripDays !== 1 ? "s" : ""}` : ""}
                    {dateSaveMutation.isPending && <span className="text-muted-foreground font-normal ml-1">Saving…</span>}
                    {dateSaveMutation.isSuccess && !dateSaveMutation.isPending && <span className="text-emerald-600 font-normal ml-1">Saved</span>}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Setting a start date lets Marco plan around real days, weather, and seasonal events.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {generateMutation.isPending ? (
            <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-md overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-primary/10">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm font-serif">M</span>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Marco is planning your trip</p>
                    <p className="text-xs text-muted-foreground">Working through every detail…</p>
                  </div>
                  <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary/50" />
                </div>
                <div ref={marcoScrollRef} className="px-6 py-6 max-h-80 overflow-y-auto space-y-3 scroll-smooth">
                  {marcoParagraphs.map((p, i) => (
                    <p key={i} className="text-base text-foreground/80 leading-relaxed font-serif">{p}</p>
                  ))}
                  <p ref={marcoLiveRef} className="text-base text-foreground/80 leading-relaxed font-serif min-h-[1.5rem]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <Button
                size="lg"
                className="w-full max-w-sm"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                data-testid="button-generate-itinerary"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Marco is thinking...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Let Marco Plan It{wishlistItems.length > 0 ? ` with ${wishlistItems.length} request${wishlistItems.length > 1 ? "s" : ""}` : ""}</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                {wishlistItems.length > 0
                  ? "Marco will prioritize your requests alongside curated local recommendations."
                  : "Marco will create a complete day-by-day itinerary with real places, local gems, and insider tips."}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Link href="/journeys">
              <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Journeys</Button>
            </Link>
            <Link href={`/packing?journeyId=${journeyId}`}>
              <Button variant="outline" size="sm"><Luggage className="mr-2 h-4 w-4" /> Pack for this trip</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/journeys">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Journeys
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold" data-testid="text-planner-title">{journey.title}</h1>
                {journey.origin && journey.finalDestination &&
                  journey.finalDestination.trim().toLowerCase() !== journey.origin.trim().toLowerCase() && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-primary/30 text-primary bg-primary/5">
                    Open-jaw
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-muted-foreground text-sm">
                  {[journey.origin, ...(journey.destinations || []), journey.finalDestination].filter(Boolean).join(" → ") || ""}
                  {journey.days ? ` • ${journey.days} days` : ""}
                </p>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    title="Set travel start date"
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value) dateSaveMutation.mutate(e.target.value);
                    }}
                    className="h-6 text-xs rounded border border-dashed border-primary/40 bg-transparent px-2 text-primary cursor-pointer hover:border-primary transition-colors focus:outline-none focus:border-primary"
                  />
                  {formattedDateRange && (
                    <span className="text-xs text-primary/70">{formattedDateRange}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/packing?journeyId=${journeyId}`}>
              <Button variant="outline" size="sm">
                <Luggage className="mr-2 h-4 w-4" />
                Pack
              </Button>
            </Link>
            {(journey as any)?.itinerary?.summary && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNarrative(true)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Story
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/share/${journey.id}`;
                const dest = journey.finalDestination || (journey as any).destinations?.[0] || "an amazing destination";
                const subject = encodeURIComponent(`Check out my trip to ${dest}!`);
                const rawSummary = (journey as any).itinerary?.summary as string | undefined;
                const teaser = rawSummary
                  ? rawSummary.match(/[^.!?]+[.!?]+/g)?.slice(0, 4).join(" ").trim() ?? ""
                  : "";
                const body = encodeURIComponent(
                  `Hey!\n\nI'm planning a trip to ${dest} and wanted to share my itinerary with you.\n\n${teaser ? `${teaser}\n\n` : ""}Check out the full day-by-day plan here:\n${url}\n\nHope you can join me!`
                );
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              variant={viewMode === "photos" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode((m) => m === "photos" ? "itinerary" : "photos")}
            >
              <Camera className="mr-2 h-4 w-4" />
              Photos
            </Button>
            {viewMode === "itinerary" && (
              <>
                <Button
                  variant={showHighlights ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (highlights && highlights.destinations?.length > 0) {
                      setShowHighlights(!showHighlights);
                    } else {
                      highlightsMutation.mutate();
                    }
                  }}
                  disabled={highlightsMutation.isPending}
                  data-testid="button-highlights"
                >
                  {highlightsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Star className="mr-2 h-4 w-4" />
                  )}
                  {highlightsMutation.isPending ? "Generating..." : highlights ? (showHighlights ? "Show Map" : "Highlights") : "Get Highlights"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  data-testid="button-regenerate"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              </>
            )}
          </div>
        </div>

        {viewMode === "photos" && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-2">
              <PhotoGallery journeyId={journeyId!} />
            </div>
          </div>
        )}

        {viewMode === "itinerary" && expenseTally && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 pb-3 text-xs" data-testid="expense-tally">
            <span className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Activities <span className="font-semibold text-foreground ml-0.5">{expenseTally.activities}</span>
            </span>
            {journey?.days !== 1 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <BedDouble className="h-3 w-3" />
              Stays <span className="font-semibold text-foreground ml-0.5">{expenseTally.accommodation}</span>
            </span>
            )}
            <span className="flex items-center gap-1 font-semibold">
              <span className="text-muted-foreground font-normal">Est. total</span>
              <span className="text-foreground">{expenseTally.total}</span>
            </span>
            <span className="text-[10px] text-muted-foreground/60 italic">based on AI estimates</span>
          </div>
        )}

        {viewMode === "itinerary" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-1 flex flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <Tabs value={`day${selectedDay}`} onValueChange={(v) => { setSelectedDay(parseInt(v.replace("day", ""))); setSelectedActivity(null); setSelectedHotel(null); setActivityMenu(null); setReplaceMode(null); }} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1">
                  {itinerary.days.map((d, idx) => (
                    <TabsTrigger key={idx} value={`day${idx}`} className="text-xs">
                      {d.date_label && d.date_label !== `Day ${d.day}` ? d.date_label : `Day ${d.day}`}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {currentDayData && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {currentDayData.location}
                </p>
              )}
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border z-0"></div>

                {currentDayData?.activities.map((activity, idx) => {
                  const isBeingModified = modifyingActivity?.dayIndex === selectedDay && modifyingActivity?.activityIndex === idx;
                  const isMenuOpen = activityMenu?.dayIndex === selectedDay && activityMenu?.activityIndex === idx;
                  const isReplacing = replaceMode?.dayIndex === selectedDay && replaceMode?.activityIndex === idx;
                  return (
                  <div key={`${selectedDay}-${idx}-${activity.title}`}>
                    <div 
                      className={`relative z-10 flex gap-4 group cursor-pointer ${isBeingModified ? "opacity-60 pointer-events-none" : ""}`}
                      onClick={() => { if (!isMenuOpen && !isReplacing) { setSelectedActivity(activity); setSelectedHotel(null); } }}
                      data-testid={`activity-card-${idx}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold shadow-sm mt-1 ${selectedActivity === activity ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground"}`}>
                        {isBeingModified ? <Loader2 className="h-3 w-3 animate-spin" /> : idx + 1}
                      </div>
                      <Card className={`flex-1 hover:shadow-md transition-all border-l-4 overflow-hidden ${selectedActivity === activity ? "border-l-primary shadow-md bg-primary/5" : "border-l-primary/30"}`}>
                        <div className="flex">
                          {activity.image_url && (
                            <div className="w-20 h-20 flex-shrink-0">
                              <img
                                src={activity.image_url}
                                alt={activity.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                data-testid={`activity-image-${idx}`}
                              />
                            </div>
                          )}
                          <CardContent className="p-3 flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {activity.time}
                              </span>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${TYPE_COLORS[activity.type] || ""}`}>
                                  {activity.type}
                                </Badge>
                                {/* Thumbs up */}
                                <button
                                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md ${likedActivities.has(`${selectedDay}-${idx}`) ? "opacity-100 text-emerald-500" : "hover:bg-muted text-muted-foreground"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const key = `${selectedDay}-${idx}`;
                                    const alreadyLiked = likedActivities.has(key);
                                    setLikedActivities(prev => {
                                      const next = new Set(prev);
                                      alreadyLiked ? next.delete(key) : next.add(key);
                                      return next;
                                    });
                                    if (!alreadyLiked) {
                                      fetch(`/api/journeys/${journeyId}/activity-feedback`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          activityTitle: activity.title,
                                          activityType: activity.type,
                                          location: currentDayData?.location,
                                          signal: "liked",
                                        }),
                                      }).catch(() => {});
                                    }
                                    setReplaceMode(null);
                                    setActivityMenu(null);
                                  }}
                                  title="Love this"
                                  data-testid={`button-thumbsup-${idx}`}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </button>
                                {/* Thumbs down → hard reject + replace flow */}
                                <button
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isReplacing && replaceIsHardReject) {
                                      setReplaceMode(null);
                                      setReplaceIsHardReject(false);
                                    } else {
                                      fetch(`/api/journeys/${journeyId}/activity-feedback`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          activityTitle: activity.title,
                                          activityType: activity.type,
                                          location: currentDayData?.location,
                                          signal: "hard_reject",
                                        }),
                                      }).catch(() => {});
                                      setReplaceMode({ dayIndex: selectedDay, activityIndex: idx });
                                      setReplaceIsHardReject(true);
                                    }
                                    setActivityMenu(null);
                                    setCustomReplaceText("");
                                  }}
                                  title="Not for me"
                                  data-testid={`button-thumbsdown-${idx}`}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                </button>
                                {/* Overflow menu (remove / extend) */}
                                <button
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isMenuOpen) {
                                      setActivityMenu(null);
                                      setReplaceMode(null);
                                    } else {
                                      setActivityMenu({ dayIndex: selectedDay, activityIndex: idx });
                                      setReplaceMode(null);
                                    }
                                  }}
                                  data-testid={`button-activity-menu-${idx}`}
                                >
                                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-serif font-medium text-base leading-tight mb-1">{activity.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {activity.duration && `${activity.duration}`}
                              {activity.cost && activity.cost !== "Free" && ` • ${activity.cost}`}
                              {activity.place_rating && ` • ⭐ ${activity.place_rating} on Google`}
                            </p>
                          </CardContent>
                        </div>
                      </Card>
                    </div>

                    {isMenuOpen && !isReplacing && (
                      <div className="relative z-20 ml-12 mt-1 mb-1 animate-in fade-in slide-in-from-top-1 duration-200" data-testid={`activity-action-menu-${idx}`}>
                        <div className="bg-background border rounded-lg shadow-lg p-2 space-y-1">
                          {idx > 0 && (
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                activityMutation.mutate({ dayIndex: selectedDay, activityIndex: idx, action: "extend_previous" });
                              }}
                              disabled={activityMutation.isPending}
                              data-testid={`button-extend-previous-${idx}`}
                            >
                              <TimerReset className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <div>
                                <p className="font-medium">Extend previous activity</p>
                                <p className="text-[11px] text-muted-foreground">Remove this and add its time to "{currentDayData?.activities[idx - 1]?.title}"</p>
                              </div>
                            </button>
                          )}
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplaceMode({ dayIndex: selectedDay, activityIndex: idx });
                              setReplaceIsHardReject(false);
                              setCustomReplaceText("");
                            }}
                            data-testid={`button-replace-${idx}`}
                          >
                            <Replace className="h-4 w-4 text-primary flex-shrink-0" />
                            <div>
                              <p className="font-medium">Replace with something else</p>
                              <p className="text-[11px] text-muted-foreground">Marco will suggest a new activity of your chosen type</p>
                            </div>
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-red-50 text-red-600 transition-colors text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              activityMutation.mutate({ dayIndex: selectedDay, activityIndex: idx, action: "remove" });
                            }}
                            disabled={activityMutation.isPending}
                            data-testid={`button-remove-activity-${idx}`}
                          >
                            <Trash2 className="h-4 w-4 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Remove activity</p>
                              <p className="text-[11px] text-red-400">Remove from itinerary without replacement</p>
                            </div>
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-muted transition-colors text-muted-foreground text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivityMenu(null);
                            }}
                            data-testid={`button-cancel-menu-${idx}`}
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {isReplacing && (
                      <div className="relative z-20 ml-12 mt-1 mb-1 animate-in fade-in slide-in-from-top-1 duration-200" data-testid={`replace-type-picker-${idx}`}>
                        <div className="bg-background border rounded-xl shadow-lg p-4 space-y-3">
                          {replaceIsHardReject ? (
                            <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                              <ThumbsDown className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-red-700 dark:text-red-400">
                                Got it — <span className="font-medium">"{activity.title}"</span> won't be suggested to you again.
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                              <Replace className="h-3 w-3 text-muted-foreground" /> Swap for something different:
                            </p>
                          )}
                          {/* Quick type chips */}
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1.5">Swap for a different type of experience:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ACTIVITY_TYPES.map((type) => (
                                <button
                                  key={type.value}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${type.color} ${activityMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    activityMutation.mutate({ dayIndex: selectedDay, activityIndex: idx, action: "replace", replaceType: type.value });
                                  }}
                                  disabled={activityMutation.isPending}
                                  data-testid={`button-replace-type-${type.value}-${idx}`}
                                >
                                  {type.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Divider */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[11px] text-muted-foreground">or</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          {/* Free-text request */}
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1.5">Tell Marco what you'd prefer:</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customReplaceText}
                                onChange={e => setCustomReplaceText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter" && customReplaceText.trim() && !activityMutation.isPending) {
                                    activityMutation.mutate({ dayIndex: selectedDay, activityIndex: idx, action: "replace", customRequest: customReplaceText.trim() });
                                  }
                                }}
                                placeholder="e.g. something outdoors, a local market, less touristy…"
                                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                disabled={activityMutation.isPending}
                                onClick={e => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (customReplaceText.trim()) {
                                    activityMutation.mutate({ dayIndex: selectedDay, activityIndex: idx, action: "replace", customRequest: customReplaceText.trim() });
                                  }
                                }}
                                disabled={!customReplaceText.trim() || activityMutation.isPending}
                                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                                data-testid={`button-custom-replace-${idx}`}
                              >
                                {activityMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <button
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => { e.stopPropagation(); setReplaceMode(null); setReplaceIsHardReject(false); setCustomReplaceText(""); }}
                            data-testid={`button-cancel-replace-${idx}`}
                          >
                            <X className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {activity.travel_to_next && idx < (currentDayData?.activities.length || 0) - 1 && (
                      <div className="relative z-10 flex gap-4 my-1" data-testid={`travel-connector-${idx}`}>
                        <div className="flex-shrink-0 w-8 flex items-center justify-center">
                          <div className="w-0.5 h-full bg-border"></div>
                        </div>
                        <div className="flex-1 flex items-center gap-2 py-1.5 px-3 rounded-full bg-muted/60 border border-dashed border-border text-muted-foreground">
                          <span className="flex items-center gap-1 text-[11px] font-medium capitalize">
                            {getTravelIcon(activity.travel_to_next.mode)}
                            {activity.travel_to_next.mode}
                          </span>
                          <span className="text-[10px]">•</span>
                          <span className="text-[11px] font-mono">{activity.travel_to_next.duration}</span>
                          {activity.travel_to_next.distance && (
                            <>
                              <span className="text-[10px]">•</span>
                              <span className="text-[11px]">{formatDistance(activity.travel_to_next.distance, preferMiles)}</span>
                            </>
                          )}
                          {activity.travel_to_next.note && (
                            <span className="text-[10px] italic ml-auto truncate max-w-[140px]" title={activity.travel_to_next.note}>
                              {activity.travel_to_next.note}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              {/* Hotel section — persists per city (hidden for day trips) */}
              {journey?.days !== 1 && currentDayData?.location && hotelsByCity[currentDayData.location]?.length > 0 && (() => {
                const city = currentDayData.location;
                const cityHotels = hotelsByCity[city];
                const picked = selectedHotelsPerCity[city] ?? cityHotels[0];
                return (
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between px-1 mb-3">
                      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                        <BedDouble className="h-3.5 w-3.5" /> Where to Stay in {city}
                      </h3>
                      {cityHotels.length > 1 && (
                        <button
                          onClick={() => setHotelModalCity(city)}
                          className="text-[11px] text-primary hover:underline"
                        >
                          {cityHotels.length - 1} other{cityHotels.length > 2 ? "s" : ""} →
                        </button>
                      )}
                    </div>
                    {/* Selected/default hotel */}
                    <div
                      className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50/40 p-3 shadow-sm hover:shadow-md transition-all"
                      onClick={() => { setSelectedHotel(picked); setSelectedActivity(null); }}
                    >
                      <div className="flex gap-3">
                        {picked.image_url && (
                          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <img src={picked.image_url} alt={picked.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-serif font-medium text-sm leading-tight">{picked.name}</h4>
                            <Badge variant="outline" className={`text-[9px] uppercase tracking-wider border flex-shrink-0 ${HOTEL_CATEGORY_COLORS[picked.category] || ""}`}>
                              {picked.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {picked.rating}
                            </span>
                            <span className="text-xs font-medium text-emerald-700">{picked.price_per_night}/night</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{picked.neighborhood}</p>
                        </div>
                      </div>
                      {cityHotels.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setHotelModalCity(city); }}
                          className="mt-2 w-full text-[11px] text-muted-foreground hover:text-primary text-center border-t pt-2 transition-colors"
                        >
                          Not this one? See {cityHotels.length - 1} alternative{cityHotels.length > 2 ? "s" : ""}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
              </div>
            </ScrollArea>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
             {!showHighlights ? (
               <>
                 <div className="flex-1 bg-muted rounded-xl border border-border relative overflow-hidden group min-h-[300px]">
                   <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
                      <ChangeView center={mapCenter} zoom={mapZoom} />
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      {routePath.length > 1 && (
                        <Polyline
                          positions={routePath}
                          pathOptions={{ color: "#7c3aed", weight: 3, opacity: 0.6, dashArray: "8, 8" }}
                        />
                      )}
                      {allMarkers.map((m) => (
                        <Marker
                          key={m.index}
                          position={[m.lat, m.lng]}
                          icon={createNumberedIcon(m.index + 1, selectedActivity === m.activity)}
                          eventHandlers={{ click: () => { setSelectedActivity(m.activity); setSelectedHotel(null); } }}
                        >
                          <Popup>
                            <div style={{ fontFamily: "serif", fontWeight: "bold" }}>{m.index + 1}. {m.title}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>{m.activity.time}{m.activity.duration ? ` (${m.activity.duration})` : ""}</div>
                          </Popup>
                        </Marker>
                      ))}
                      {hotelMarkers.map((m, idx) => (
                        <Marker
                          key={`hotel-${idx}`}
                          position={[m.lat, m.lng]}
                          icon={createHotelIcon(selectedHotel === m.hotel)}
                          eventHandlers={{ click: () => { setSelectedHotel(m.hotel); setSelectedActivity(null); } }}
                        >
                          <Popup>
                            <div style={{ fontFamily: "serif", fontWeight: "bold" }}>{m.name}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>{m.hotel.price_per_night}/night • ⭐ {m.hotel.rating}</div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                    
                   <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow text-xs z-[400]">
                     <div className="font-bold">{currentDayData?.location || ""}</div>
                     <div className="text-muted-foreground">Day {(currentDayData?.day || selectedDay + 1)} Route</div>
                   </div>
                 </div>

                 {selectedHotel ? (
                   <Card className="min-h-[200px] overflow-hidden" data-testid="hotel-detail-panel">
                     <div className="flex flex-col md:flex-row">
                       {selectedHotel.image_url && (
                         <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                           <img src={selectedHotel.image_url} alt={selectedHotel.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} data-testid="hotel-detail-image" />
                         </div>
                       )}
                       <div className="flex-1">
                         <CardHeader className="pb-2">
                           <div className="flex justify-between items-start">
                             <div>
                               <CardTitle className="text-xl font-serif flex items-center gap-2">
                                 <Building2 className="h-5 w-5 text-amber-500" /> {selectedHotel.name}
                               </CardTitle>
                               <CardDescription className="mt-1">{selectedHotel.neighborhood}</CardDescription>
                             </div>
                             <Badge variant="outline" className={`${HOTEL_CATEGORY_COLORS[selectedHotel.category] || ""}`}>
                               {selectedHotel.category}
                             </Badge>
                           </div>
                         </CardHeader>
                         <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                             <div className="space-y-1">
                               <span className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Rating</span>
                               <p className="font-medium text-amber-700">{selectedHotel.rating} / 5</p>
                             </div>
                             <div className="space-y-1">
                               <span className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><DollarSign className="h-3 w-3" /> Price</span>
                               <p className="font-medium text-emerald-700">{selectedHotel.price_per_night} per night</p>
                             </div>
                           </div>
                           {selectedHotel.review_summary && (
                             <div className="mb-3 p-2 bg-amber-50 rounded-md border border-amber-100">
                               <p className="text-xs text-amber-800 flex items-start gap-1.5">
                                 <Star className="h-3 w-3 mt-0.5 flex-shrink-0 fill-amber-400 text-amber-400" />
                                 {selectedHotel.review_summary}
                               </p>
                             </div>
                           )}
                           {selectedHotel.why_this_hotel && (
                             <div className="p-2 bg-blue-50 rounded-md border border-blue-100">
                               <p className="text-xs text-blue-800 flex items-start gap-1.5">
                                 <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500" />
                                 {selectedHotel.why_this_hotel}
                               </p>
                             </div>
                           )}
                           <div className="mt-3">
                             <a
                               href={`https://www.google.com/maps/search/${encodeURIComponent(selectedHotel.name + " " + (currentDayData?.location || ""))}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-xs font-medium text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
                               data-testid="hotel-google-maps-link"
                             >
                               View on Google Maps <ExternalLink className="h-3 w-3" />
                             </a>
                           </div>
                         </CardContent>
                       </div>
                     </div>
                   </Card>
                 ) : selectedActivity ? (
                   <Card className="min-h-[200px] overflow-hidden" data-testid="activity-detail-panel">
                     <div className="flex flex-col md:flex-row">
                       {selectedActivity.image_url && (
                         <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                           <img
                             src={selectedActivity.image_url}
                             alt={selectedActivity.title}
                             className="w-full h-full object-cover"
                             onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                             data-testid="activity-detail-image"
                           />
                         </div>
                       )}
                       <div className="flex-1">
                         <CardHeader className="pb-3">
                           <div className="flex justify-between items-start">
                             <div>
                               <CardTitle className="text-xl font-serif">{selectedActivity.title}</CardTitle>
                               {selectedActivity.description && (
                                 <CardDescription className="mt-1">
                                   {selectedActivity.description}
                                 </CardDescription>
                               )}
                             </div>
                             <Badge variant="outline" className={`${TYPE_COLORS[selectedActivity.type] || ""}`}>
                               {selectedActivity.type}
                             </Badge>
                           </div>
                         </CardHeader>
                         <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" /> Time</span>
                                <p className="font-medium">{selectedActivity.time}{selectedActivity.duration ? ` (${selectedActivity.duration})` : ""}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><DollarSign className="h-3 w-3" /> Cost</span>
                                <p className="font-medium">{selectedActivity.cost || "Free"}</p>
                              </div>
                              {selectedActivity.tip && (
                                <div className="space-y-1">
                                  <span className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Insider Tip</span>
                                  <p className="font-medium text-primary">{selectedActivity.tip}</p>
                                </div>
                              )}
                           </div>
                           {selectedActivity.place_url && (
                             <div className="mt-4 pt-3 border-t flex items-center justify-between">
                               <div className="flex items-center gap-2 text-sm">
                                 <span className="font-semibold text-[#4285F4]">Google</span>
                                 <span className="text-muted-foreground">
                                   ⭐ {selectedActivity.place_rating}
                                   {selectedActivity.place_review_count && ` (${selectedActivity.place_review_count.toLocaleString()} reviews)`}
                                   {selectedActivity.place_price && ` · ${selectedActivity.place_price}`}
                                 </span>
                               </div>
                               <a
                                 href={selectedActivity.place_url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-xs text-[#4285F4] hover:underline font-medium"
                               >
                                 View on Google Maps →
                               </a>
                             </div>
                           )}
                         </CardContent>
                       </div>
                     </div>
                   </Card>
                 ) : (
                   <Card className="min-h-[200px] flex items-center justify-center">
                     <div className="text-center text-muted-foreground">
                       <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                       <p className="text-sm">Select an activity to see details</p>
                     </div>
                   </Card>
                 )}
               </>
             ) : (
               <Card className="flex-1 min-h-0 flex flex-col" data-testid="highlights-panel">
                 <CardHeader className="pb-3">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-lg font-serif flex items-center gap-2">
                       <Star className="h-5 w-5 text-amber-500" /> Destination Highlights
                     </CardTitle>
                     <Button variant="ghost" size="sm" onClick={() => setShowHighlights(false)} data-testid="button-back-to-map">
                       <ArrowLeft className="mr-1 h-4 w-4" /> Back to Map
                     </Button>
                   </div>
                   {highlights && highlights.destinations.length > 1 && (
                     <div className="flex gap-2 flex-wrap mt-2">
                       {highlights.destinations.map((dest, idx) => (
                         <Button
                           key={idx}
                           variant={activeHighlightDest === idx ? "default" : "outline"}
                           size="sm"
                           className="text-xs"
                           onClick={() => setActiveHighlightDest(idx)}
                           data-testid={`button-highlight-dest-${idx}`}
                         >
                           {dest.name}
                         </Button>
                       ))}
                     </div>
                   )}
                 </CardHeader>
                 <CardContent className="flex-1 overflow-y-auto">
                   {highlights && highlights.destinations[activeHighlightDest] ? (
                     <div className="space-y-6">
                       {highlights.destinations.length <= 1 && (
                         <h3 className="font-serif text-xl font-bold">{highlights.destinations[activeHighlightDest].name}</h3>
                       )}
                       
                       {[
                         { key: "must_see", label: "Must See", icon: <Eye className="h-4 w-4 text-violet-500" />, items: highlights.destinations[activeHighlightDest].must_see, colors: { bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200 dark:border-violet-800", accent: "text-violet-600 dark:text-violet-400", confidence: "text-violet-700", link: "text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300" }, testPrefix: "see" },
                         { key: "must_do", label: "Must Do", icon: <Walk className="h-4 w-4 text-emerald-500" />, items: highlights.destinations[activeHighlightDest].must_do, colors: { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", accent: "text-emerald-600 dark:text-emerald-400", confidence: "text-emerald-700", link: "text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300" }, testPrefix: "do" },
                         { key: "must_eat", label: "Must Eat", icon: <UtensilsCrossed className="h-4 w-4 text-amber-500" />, items: highlights.destinations[activeHighlightDest].must_eat, colors: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800", accent: "text-amber-600 dark:text-amber-400", confidence: "text-amber-700", link: "text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300" }, testPrefix: "eat" },
                       ].map(({ key, label, icon, items, colors, testPrefix }) => (
                         <div key={key}>
                           <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                             {icon} {label}
                           </h4>
                           <div className="space-y-3">
                             {items?.map((item, idx) => (
                               <div key={idx} className={`${colors.bg} border ${colors.border} rounded-lg p-3`} data-testid={`highlight-${testPrefix}-${idx}`}>
                                 <div className="flex items-start justify-between gap-2">
                                   <h5 className="font-serif font-medium text-sm">{item.title}</h5>
                                   <div className="flex items-center gap-1.5 flex-shrink-0">
                                     {item.confidence != null && (
                                       <span className={`text-[10px] font-medium ${colors.confidence} flex items-center gap-0.5`} title={`${item.confidence}% confidence`} data-testid={`confidence-${testPrefix}-${idx}`}>
                                         <ShieldCheck className="h-3 w-3" />
                                         {item.confidence}%
                                       </span>
                                     )}
                                     {item.review_query && (
                                       <a
                                         href={`https://www.google.com/maps/search/${encodeURIComponent(item.review_query)}`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className={`text-[10px] font-medium ${colors.link} flex items-center gap-0.5 transition-colors`}
                                         title="View reviews and details on Google Maps"
                                         data-testid={`review-link-${testPrefix}-${idx}`}
                                       >
                                         Reviews <ExternalLink className="h-2.5 w-2.5" />
                                       </a>
                                     )}
                                   </div>
                                 </div>
                                 <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                 {item.tip && (
                                   <p className={`text-xs ${colors.accent} mt-1.5 flex items-start gap-1`}>
                                     <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" /> {item.tip}
                                   </p>
                                 )}
                               </div>
                             ))}
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center py-12">
                       <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
                       <p className="text-muted-foreground text-sm">Generating highlights...</p>
                     </div>
                   )}
                 </CardContent>
               </Card>
             )}
          </div>
        </div>
        )}
      </div>
      {/* Hotel alternatives modal */}
      {hotelModalCity && (() => {
        const cityHotels = hotelsByCity[hotelModalCity] ?? [];
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setHotelModalCity(null)}
          >
            <div
              className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-semibold text-base">Hotels in {hotelModalCity}</h2>
                  <p className="text-xs text-muted-foreground">Select your preferred stay</p>
                </div>
                <button onClick={() => setHotelModalCity(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3">
                {cityHotels.map((hotel, idx) => {
                  const isSelected = (selectedHotelsPerCity[hotelModalCity] ?? cityHotels[0]) === hotel;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedHotelsPerCity(prev => ({ ...prev, [hotelModalCity]: hotel }));
                        setSelectedHotel(hotel);
                        setHotelModalCity(null);
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-md ${isSelected ? "border-amber-400 bg-amber-50/40" : "border-border hover:border-amber-200"}`}
                    >
                      <div className="flex gap-3">
                        {hotel.image_url && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-serif font-semibold text-sm leading-tight">{hotel.name}</h3>
                            {isSelected && <span className="text-[10px] text-emerald-600 font-medium flex-shrink-0">✓ Selected</span>}
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${HOTEL_CATEGORY_COLORS[hotel.category] || ""}`}>{hotel.category}</Badge>
                            <span className="flex items-center gap-0.5 text-xs text-amber-600"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{hotel.rating}</span>
                            <span className="text-xs font-semibold text-emerald-700">{hotel.price_per_night}/night</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{hotel.review_summary || hotel.why_this_hotel}</p>
                          {hotel.neighborhood && <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{hotel.neighborhood}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Narrative write-up sheet */}
      <Sheet open={showNarrative} onOpenChange={setShowNarrative}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-start justify-between pr-8">
              <div>
                <SheetTitle className="font-serif text-2xl">{journey.title}</SheetTitle>
                {journey.dates && (
                  <p className="text-sm text-muted-foreground mt-1">{journey.dates}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadItinerary}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </SheetHeader>

          {(journey as any)?.itinerary?.summary && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Compass className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">Marco's Write-Up</span>
              </div>
              <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed font-serif">
                {((journey as any).itinerary.summary as string).split(/\n\n+/).map((para: string, i: number) => (
                  <p key={i} className="mb-4 last:mb-0">{para}</p>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Day by Day</span>
            </div>
            {((journey as any)?.itinerary as Itinerary | undefined)?.days?.map((day) => (
              <div key={day.day} className="mb-8">
                <h3 className="font-serif font-bold text-lg mb-1">
                  {day.date_label && day.date_label !== `Day ${day.day}` ? day.date_label : `Day ${day.day}`}
                </h3>
                <p className="text-sm text-primary font-medium mb-3 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {day.location}
                </p>
                <div className="space-y-3">
                  {day.activities.map((act, ai) => (
                    <div key={ai} className="pl-3 border-l-2 border-muted">
                      <div className="flex items-baseline gap-2">
                        {act.time && <span className="text-xs text-muted-foreground font-mono w-10 flex-shrink-0">{act.time}</span>}
                        <span className="text-sm font-semibold">{act.title}</span>
                        {act.duration && <span className="text-xs text-muted-foreground">· {act.duration}</span>}
                      </div>
                      {act.description && <p className="text-xs text-muted-foreground mt-0.5 ml-12 leading-relaxed">{act.description}</p>}
                      {act.tip && <p className="text-xs text-amber-700 mt-0.5 ml-12 italic">Tip: {act.tip}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
