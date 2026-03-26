import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const [wishlist, setWishlist] = useState("");
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [activityMenu, setActivityMenu] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [replaceMode, setReplaceMode] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [modifyingActivity, setModifyingActivity] = useState<{ dayIndex: number; activityIndex: number; action: string } | null>(null);
  const wishlistInputRef = useRef<HTMLInputElement>(null);

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
      const wishlistText = wishlistItems.length > 0 ? wishlistItems.join("\n- ") : "";
      const res = await apiRequest("POST", `/api/journeys/${journeyId}/generate-itinerary`, {
        wishlist: wishlistText ? `- ${wishlistText}` : "",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/journeys/${journeyId}`], data);
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      toast({ title: "Itinerary generated", description: "Your personalized itinerary from Marco is ready." });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

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
    mutationFn: async (params: { dayIndex: number; activityIndex: number; action: string; replaceType?: string }) => {
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
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Journeys</Button>
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
                Add places you want to visit, restaurants to try, activities you're interested in, or anything else you'd like included in your itinerary. Marco will weave these into your plan.
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

          <div className="flex flex-col items-center gap-3 w-full">
            <Button 
              size="lg" 
              className="w-full max-w-sm"
              onClick={() => generateMutation.mutate()} 
              disabled={generateMutation.isPending}
              data-testid="button-generate-itinerary"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating your itinerary...</>
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

          <Link href="/journeys">
            <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Journeys</Button>
          </Link>
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
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-3xl font-bold" data-testid="text-planner-title">{journey.title}</h1>
              <p className="text-muted-foreground">
                {[journey.origin, ...(journey.destinations || []), journey.finalDestination].filter(Boolean).join(" → ") || ""}
                {journey.days ? ` • ${journey.days} days` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
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

        {viewMode === "itinerary" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-1 flex flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <Tabs value={`day${selectedDay}`} onValueChange={(v) => { setSelectedDay(parseInt(v.replace("day", ""))); setSelectedActivity(null); setSelectedHotel(null); setActivityMenu(null); setReplaceMode(null); }} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1">
                  {itinerary.days.map((d, idx) => (
                    <TabsTrigger key={idx} value={`day${idx}`} className="text-xs">
                      Day {d.day}
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
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-primary" /> What type of experience would you like instead?
                          </p>
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
                          <button
                            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplaceMode(null);
                              setActivityMenu(null);
                            }}
                            data-testid={`button-cancel-replace-${idx}`}
                          >
                            <ArrowLeft className="h-3 w-3" /> Back
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
                              <span className="text-[11px]">{activity.travel_to_next.distance}</span>
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
              {currentDayData?.hotels && currentDayData.hotels.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5 px-1">
                    <BedDouble className="h-3.5 w-3.5" /> Where to Stay
                  </h3>
                  <div className="space-y-2">
                    {currentDayData.hotels.map((hotel, idx) => (
                      <div
                        key={idx}
                        className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${selectedHotel === hotel ? "border-amber-400 bg-amber-50/50 shadow-md" : "border-border hover:border-amber-200"}`}
                        onClick={() => { setSelectedHotel(hotel); setSelectedActivity(null); }}
                        data-testid={`hotel-card-${idx}`}
                      >
                        <div className="flex gap-3">
                          {hotel.image_url && (
                            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                              <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-serif font-medium text-sm leading-tight">{hotel.name}</h4>
                              <Badge variant="outline" className={`text-[9px] uppercase tracking-wider border flex-shrink-0 ${HOTEL_CATEGORY_COLORS[hotel.category] || ""}`}>
                                {hotel.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {hotel.rating}
                              </span>
                              <span className="text-xs font-medium text-emerald-700">{hotel.price_per_night}/night</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{hotel.neighborhood}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
    </Layout>
  );
}
