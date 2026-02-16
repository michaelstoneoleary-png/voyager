import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useParams } from "wouter";
import { useState } from "react";
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
  Footprints,
  UtensilsCrossed,
  Star,
  ChevronRight
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
}

interface ItineraryDay {
  day: number;
  date_label: string;
  location: string;
  activities: Activity[];
}

interface Itinerary {
  days: ItineraryDay[];
  summary?: string;
}

interface HighlightItem {
  title: string;
  description: string;
  tip?: string;
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
  dates?: string;
  days?: number;
  cost?: string;
  status: string;
  destinations?: string[];
  itinerary?: Itinerary;
  highlights?: Highlights;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

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

  const [activeHighlightDest, setActiveHighlightDest] = useState(0);
  const [showHighlights, setShowHighlights] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journeys/${journeyId}/generate-itinerary`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/journeys/${journeyId}`], data);
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      toast({ title: "Itinerary generated", description: "Your AI-powered itinerary is ready." });
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

  const itinerary = journey?.itinerary as Itinerary | undefined;
  const highlights = journey?.highlights as Highlights | undefined;
  const currentDayData = itinerary?.days?.[selectedDay];

  const allMarkers: { lat: number; lng: number; title: string }[] = [];
  if (currentDayData?.activities) {
    currentDayData.activities.forEach(a => {
      if (a.lat && a.lng && typeof a.lat === "number" && typeof a.lng === "number") {
        allMarkers.push({ lat: a.lat, lng: a.lng, title: a.title || "Activity" });
      }
    });
  }

  const mapCenter: [number, number] = allMarkers.length > 0
    ? [allMarkers[0].lat, allMarkers[0].lng]
    : [48.8566, 2.3522];

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
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 max-w-lg mx-auto text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">{journey.title}</h1>
            <p className="text-muted-foreground">
              {journey.destinations?.join(" → ") || "No destinations set"} 
              {journey.days ? ` • ${journey.days} days` : ""}
              {journey.cost && journey.cost !== "TBD" ? ` • ${journey.cost}` : ""}
            </p>
          </div>
          <p className="text-muted-foreground">
            Let our AI create a personalized day-by-day itinerary with real places, local recommendations, and insider tips.
          </p>
          <Button 
            size="lg" 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
            data-testid="button-generate-itinerary"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating your itinerary...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Generate AI Itinerary</>
            )}
          </Button>
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
                {journey.destinations?.join(" → ") || ""}
                {journey.days ? ` • ${journey.days} days` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-1 flex flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <Tabs value={`day${selectedDay}`} onValueChange={(v) => { setSelectedDay(parseInt(v.replace("day", ""))); setSelectedActivity(null); }} className="w-full">
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

                {currentDayData?.activities.map((activity, idx) => (
                  <div 
                    key={idx} 
                    className="relative z-10 flex gap-4 group cursor-pointer"
                    onClick={() => setSelectedActivity(activity)}
                    data-testid={`activity-card-${idx}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold shadow-sm mt-1 ${selectedActivity === activity ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground"}`}>
                      {idx + 1}
                    </div>
                    <Card className={`flex-1 hover:shadow-md transition-all border-l-4 ${selectedActivity === activity ? "border-l-primary shadow-md bg-primary/5" : "border-l-primary/30"}`}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {activity.time}
                          </span>
                          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${TYPE_COLORS[activity.type] || ""}`}>
                            {activity.type}
                          </Badge>
                        </div>
                        <h4 className="font-serif font-medium text-base leading-tight mb-1">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {activity.duration && `${activity.duration}`}
                          {activity.cost && activity.cost !== "Free" && ` • ${activity.cost}`}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
             {!showHighlights ? (
               <>
                 <div className="flex-1 bg-muted rounded-xl border border-border relative overflow-hidden group min-h-[300px]">
                   <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} className="h-full w-full z-0">
                      <ChangeView center={mapCenter} zoom={allMarkers.length > 1 ? 12 : 14} />
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      {allMarkers.map((m, idx) => (
                        <Marker key={idx} position={[m.lat, m.lng]}>
                          <Popup>
                            <div className="font-serif font-bold">{m.title}</div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                    
                   <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow text-xs z-[400]">
                     <div className="font-bold">{currentDayData?.location || ""}</div>
                     <div className="text-muted-foreground">Day {(currentDayData?.day || selectedDay + 1)} Route</div>
                   </div>
                 </div>

                 {selectedActivity ? (
                   <Card className="min-h-[200px]" data-testid="activity-detail-panel">
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
                     </CardContent>
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
                       
                       <div>
                         <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                           <Eye className="h-4 w-4 text-violet-500" /> Must See
                         </h4>
                         <div className="space-y-3">
                           {highlights.destinations[activeHighlightDest].must_see?.map((item, idx) => (
                             <div key={idx} className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3" data-testid={`highlight-see-${idx}`}>
                               <h5 className="font-serif font-medium text-sm">{item.title}</h5>
                               <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                               {item.tip && (
                                 <p className="text-xs text-violet-600 dark:text-violet-400 mt-1.5 flex items-start gap-1">
                                   <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" /> {item.tip}
                                 </p>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>

                       <div>
                         <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                           <Footprints className="h-4 w-4 text-emerald-500" /> Must Do
                         </h4>
                         <div className="space-y-3">
                           {highlights.destinations[activeHighlightDest].must_do?.map((item, idx) => (
                             <div key={idx} className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3" data-testid={`highlight-do-${idx}`}>
                               <h5 className="font-serif font-medium text-sm">{item.title}</h5>
                               <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                               {item.tip && (
                                 <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-start gap-1">
                                   <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" /> {item.tip}
                                 </p>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>

                       <div>
                         <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                           <UtensilsCrossed className="h-4 w-4 text-amber-500" /> Must Eat
                         </h4>
                         <div className="space-y-3">
                           {highlights.destinations[activeHighlightDest].must_eat?.map((item, idx) => (
                             <div key={idx} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3" data-testid={`highlight-eat-${idx}`}>
                               <h5 className="font-serif font-medium text-sm">{item.title}</h5>
                               <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                               {item.tip && (
                                 <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-start gap-1">
                                   <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" /> {item.tip}
                                 </p>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
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
      </div>
    </Layout>
  );
}
