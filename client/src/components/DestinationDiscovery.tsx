import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { TripFormData } from "./NewTripDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Plus,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  Maximize2,
  Loader2,
  Plane,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Coords { lat: number; lng: number; countryCode?: string }

interface NearbySuggestion {
  name: string;
  description: string;
  lat: number | null;
  lng: number | null;
  topAttraction: string | null;
  photoUrl: string | null;
}

interface Props {
  formData: TripFormData;
  setFormData: React.Dispatch<React.SetStateAction<TripFormData>>;
}

// ── Continent lookup (ISO 3166-1 alpha-2 → continent code) ───────────────────
// Used to detect intercontinental travel — same-continent international trips
// (e.g. intra-EU, US↔Canada) don't require a flight.

const COUNTRY_CONTINENT: Record<string, string> = {
  // Europe
  AD:"EU",AL:"EU",AT:"EU",BA:"EU",BE:"EU",BG:"EU",BY:"EU",CH:"EU",CY:"EU",
  CZ:"EU",DE:"EU",DK:"EU",EE:"EU",ES:"EU",FI:"EU",FR:"EU",GB:"EU",GR:"EU",
  HR:"EU",HU:"EU",IE:"EU",IS:"EU",IT:"EU",LI:"EU",LT:"EU",LU:"EU",LV:"EU",
  MC:"EU",MD:"EU",ME:"EU",MK:"EU",MT:"EU",NL:"EU",NO:"EU",PL:"EU",PT:"EU",
  RO:"EU",RS:"EU",RU:"EU",SE:"EU",SI:"EU",SK:"EU",SM:"EU",TR:"EU",UA:"EU",
  VA:"EU",XK:"EU",
  // North America (inc. Central America & Caribbean — all reachable by land/sea)
  AG:"NA",BB:"NA",BL:"NA",BM:"NA",BS:"NA",BZ:"NA",CA:"NA",CR:"NA",CU:"NA",
  DM:"NA",DO:"NA",GD:"NA",GL:"NA",GP:"NA",GT:"NA",HN:"NA",HT:"NA",JM:"NA",
  KN:"NA",KY:"NA",LC:"NA",MF:"NA",MQ:"NA",MS:"NA",MX:"NA",NI:"NA",PA:"NA",
  PM:"NA",PR:"NA",SV:"NA",TC:"NA",TT:"NA",US:"NA",VC:"NA",VI:"NA",VG:"NA",
  // South America
  AR:"SA",BO:"SA",BR:"SA",CL:"SA",CO:"SA",EC:"SA",FK:"SA",GF:"SA",GY:"SA",
  PE:"SA",PY:"SA",SR:"SA",UY:"SA",VE:"SA",
  // Asia
  AE:"AS",AF:"AS",AM:"AS",AZ:"AS",BD:"AS",BH:"AS",BN:"AS",BT:"AS",CN:"AS",
  GE:"AS",HK:"AS",ID:"AS",IL:"AS",IN:"AS",IQ:"AS",IR:"AS",JO:"AS",JP:"AS",
  KG:"AS",KH:"AS",KP:"AS",KR:"AS",KW:"AS",KZ:"AS",LA:"AS",LB:"AS",LK:"AS",
  MM:"AS",MN:"AS",MO:"AS",MV:"AS",MY:"AS",NP:"AS",OM:"AS",PH:"AS",PK:"AS",
  PS:"AS",QA:"AS",SA:"AS",SG:"AS",SY:"AS",TH:"AS",TJ:"AS",TL:"AS",TM:"AS",
  TW:"AS",UZ:"AS",VN:"AS",YE:"AS",
  // Africa
  AO:"AF",BF:"AF",BI:"AF",BJ:"AF",BW:"AF",CD:"AF",CF:"AF",CG:"AF",CI:"AF",
  CM:"AF",CV:"AF",DJ:"AF",DZ:"AF",EG:"AF",ER:"AF",ET:"AF",GA:"AF",GH:"AF",
  GM:"AF",GN:"AF",GQ:"AF",GW:"AF",KE:"AF",KM:"AF",LR:"AF",LS:"AF",LY:"AF",
  MA:"AF",MG:"AF",ML:"AF",MR:"AF",MU:"AF",MW:"AF",MZ:"AF",NA:"AF",NE:"AF",
  NG:"AF",RE:"AF",RW:"AF",SC:"AF",SD:"AF",SL:"AF",SN:"AF",SO:"AF",SS:"AF",
  ST:"AF",SZ:"AF",TD:"AF",TG:"AF",TN:"AF",TZ:"AF",UG:"AF",ZA:"AF",ZM:"AF",
  ZW:"AF",
  // Oceania
  AU:"OC",CK:"OC",FJ:"OC",FM:"OC",GU:"OC",KI:"OC",MH:"OC",MP:"OC",NC:"OC",
  NR:"OC",NU:"OC",NZ:"OC",PF:"OC",PG:"OC",PW:"OC",SB:"OC",TK:"OC",TO:"OC",
  TV:"OC",VU:"OC",WF:"OC",WS:"OC",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function estimateTravelMinutes(coords: Coords[], travelModes: string[]): number {
  if (coords.length < 2) return 0;
  const hasFly = travelModes.includes("fly");
  const hasTrain = travelModes.includes("train");
  const hasDrive = travelModes.includes("drive");
  const speedKph = hasFly ? 800 : hasTrain ? 120 : hasDrive ? 80 : 100;
  const overheadPerLeg = hasFly ? 150 : 0; // airport logistics

  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const km = haversineKm(coords[i], coords[i + 1]);
    total += (km / speedKph) * 60 + overheadPerLeg;
  }
  return Math.round(total);
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── MapViewController ────────────────────────────────────────────────────────
// Controls map position. flyTo fires when a new stop is selected (zooms to it).
// Initial fit runs once when the first route points appear — suggestions never
// trigger a re-fit so they can't zoom the map back out.

function MapViewController({
  routePoints,
  flyTo,
}: {
  routePoints: [number, number][];
  flyTo: [number, number] | null;
}) {
  const map = useMap();
  const flyToKey = useRef<string>("");
  const initialized = useRef(false);

  // Fly to a newly added point (triggered by user selecting a stop)
  useEffect(() => {
    if (!flyTo) return;
    const key = `${flyTo[0]},${flyTo[1]}`;
    if (key === flyToKey.current) return;
    flyToKey.current = key;
    initialized.current = true;
    map.flyTo(flyTo, 9, { animate: true, duration: 0.8 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.[0], flyTo?.[1]]);

  // One-time initial fit to route points (only before any flyTo has fired)
  useEffect(() => {
    if (initialized.current || routePoints.length === 0) return;
    initialized.current = true;
    if (routePoints.length > 1) {
      map.fitBounds(routePoints, { padding: [48, 48], maxZoom: 10 });
    } else {
      map.setView(routePoints[0], 8);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePoints.length]);

  return null;
}

// ── RouteMap ──────────────────────────────────────────────────────────────────

function RouteMap({
  orderedPoints,
  labels,
  suggestions = [],
  onAddSuggestion,
  onExpand,
  height = "100%",
  flyTo = null,
  routePolyline = null,
}: {
  orderedPoints: [number, number][];
  labels: string[];
  suggestions?: NearbySuggestion[];
  onAddSuggestion?: (name: string) => void;
  onExpand?: () => void;
  height?: string;
  flyTo?: [number, number] | null;
  routePolyline?: [number, number][] | null;
}) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={orderedPoints[0] ?? [20, 0]}
        zoom={orderedPoints.length === 0 ? 2 : 5}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {/* Road route (Google Directions) or straight-line fallback */}
        {routePolyline && routePolyline.length > 1 ? (
          <Polyline
            positions={routePolyline}
            pathOptions={{ color: "var(--primary)", weight: 3, opacity: 0.8 }}
          />
        ) : orderedPoints.length > 1 ? (
          <Polyline
            positions={orderedPoints}
            pathOptions={{ color: "var(--primary)", weight: 2, dashArray: "6 4", opacity: 0.8 }}
          />
        ) : null}

        {/* Route pins (added stops) */}
        {orderedPoints.map((pt, idx) => (
          <CircleMarker
            key={`stop-${pt[0]}-${pt[1]}-${idx}`}
            center={pt}
            radius={8}
            pathOptions={{
              color: "white",
              fillColor: idx === 0 || idx === orderedPoints.length - 1 ? "#1e293b" : "var(--primary)",
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>
              <span className="text-sm font-medium">{labels[idx] ?? ""}</span>
            </Popup>
          </CircleMarker>
        ))}

        {/* Suggestion pins (lighter, dashed outline) */}
        {suggestions.map((s) => {
          if (s.lat === null || s.lng === null) return null;
          return (
            <CircleMarker
              key={`sug-${s.name}`}
              center={[s.lat, s.lng]}
              radius={7}
              pathOptions={{
                color: "var(--primary)",
                fillColor: "white",
                fillOpacity: 0.9,
                weight: 2,
                dashArray: "3 2",
              }}
            >
              <Popup maxWidth={220} className="destination-suggestion-popup">
                <div className="font-sans text-sm space-y-1.5 min-w-[180px]">
                  {s.photoUrl && (
                    <img
                      src={s.photoUrl}
                      alt={s.topAttraction ?? s.name}
                      className="w-full h-28 object-cover rounded-sm"
                      loading="lazy"
                    />
                  )}
                  <p className="font-semibold text-foreground leading-tight">{s.name}</p>
                  {s.topAttraction && (
                    <p className="text-xs text-primary font-medium">{s.topAttraction}</p>
                  )}
                  <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                  {onAddSuggestion && (
                    <button
                      type="button"
                      onClick={() => onAddSuggestion(s.name)}
                      className="mt-1 w-full text-xs font-medium bg-primary text-primary-foreground rounded px-2 py-1 hover:bg-primary/90 transition-colors"
                    >
                      + Add to route
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <MapViewController routePoints={orderedPoints} flyTo={flyTo} />
      </MapContainer>

      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute bottom-2 right-2 z-[400] bg-white/90 hover:bg-white border border-border rounded-lg p-1.5 shadow-sm transition-colors"
          title="Expand map"
        >
          <Maximize2 className="h-4 w-4 text-foreground" />
        </button>
      )}
    </div>
  );
}

// ── DestinationDiscovery (main) ───────────────────────────────────────────────

export function DestinationDiscovery({ formData, setFormData }: Props) {
  const [coordsCache, setCoordsCache] = useState<Record<string, Coords>>({});
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<{ description: string; placeId: string }[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<NearbySuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapFlyTo, setMapFlyTo] = useState<[number, number] | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Geocode a name and store in cache
  const geocode = useCallback(async (name: string): Promise<Coords | null> => {
    if (coordsCache[name]) return coordsCache[name];
    try {
      const res = await fetch("/api/places/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: name }),
      });
      const data: { lat: number | null; lng: number | null; countryCode?: string } = await res.json();
      if (data.lat !== null && data.lng !== null) {
        const coords: Coords = { lat: data.lat, lng: data.lng, countryCode: data.countryCode };
        setCoordsCache((prev) => ({ ...prev, [name]: coords }));
        return coords;
      }
    } catch {}
    return null;
  }, [coordsCache]);

  // Fetch nearby suggestions from Claude
  const fetchSuggestions = useCallback(async (destinations: string[]) => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/places/nearby-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentDestinations: destinations,
          origin: formData.origin,
          travelModes: formData.travelModes,
          duration: formData.duration,
          partyType: formData.partyType,
          budgetType: formData.budgetType,
        }),
      });
      const data: { suggestions: NearbySuggestion[] } = await res.json();
      setSuggestions(data.suggestions || []);
      // Pre-populate coords cache from suggestions that already have coords
      data.suggestions.forEach((s) => {
        if (s.lat !== null && s.lng !== null) {
          setCoordsCache((prev) => ({ ...prev, [s.name]: { lat: s.lat!, lng: s.lng! } }));
        }
      });
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [formData.origin, formData.travelModes, formData.duration, formData.partyType, formData.budgetType]);

  // Geocode origin and fly to it; also auto-fill finalDestination as round-trip default
  const prevOriginRef = useRef<string>("");
  useEffect(() => {
    if (!formData.origin) return;
    // Auto-fill finalDestination with origin (round trip) if it's empty or still the old origin
    if (!formData.finalDestination || formData.finalDestination === prevOriginRef.current) {
      setFormData((prev) => ({ ...prev, finalDestination: formData.origin }));
    }
    prevOriginRef.current = formData.origin;
    geocode(formData.origin).then((coords) => {
      if (coords) setMapFlyTo([coords.lat, coords.lng]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.origin]);

  // Autocomplete debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setPredictions([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(async () => {
      setAutocompleteLoading(true);
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}`);
        const data: { predictions: { description: string; placeId: string }[] } = await res.json();
        setPredictions(data.predictions || []);
        setShowDropdown(true);
      } catch {
        setPredictions([]);
      } finally {
        setAutocompleteLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addDestination = async (name: string) => {
    if (!name.trim() || formData.destinations.includes(name)) return;
    const newDests = [...formData.destinations, name];
    setFormData((prev) => ({ ...prev, destinations: newDests, newDestination: "" }));
    setQuery("");
    setPredictions([]);
    setShowDropdown(false);
    const coords = await geocode(name);
    if (coords) setMapFlyTo([coords.lat, coords.lng]);
    fetchSuggestions(newDests);
  };

  const removeDestination = (idx: number) => {
    const newDests = formData.destinations.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, destinations: newDests }));
    if (newDests.length > 0) fetchSuggestions(newDests);
    else setSuggestions([]);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const d = [...formData.destinations];
    [d[idx - 1], d[idx]] = [d[idx], d[idx - 1]];
    setFormData((prev) => ({ ...prev, destinations: d }));
  };

  const moveDown = (idx: number) => {
    if (idx === formData.destinations.length - 1) return;
    const d = [...formData.destinations];
    [d[idx], d[idx + 1]] = [d[idx + 1], d[idx]];
    setFormData((prev) => ({ ...prev, destinations: d }));
  };

  // Build ordered points for the map (origin → stops → finalDestination)
  const allNames: string[] = [
    ...(formData.origin ? [formData.origin] : []),
    ...formData.destinations,
    ...(formData.finalDestination ? [formData.finalDestination] : []),
  ];
  const orderedPoints: [number, number][] = allNames
    .map((n) => coordsCache[n])
    .filter((c): c is Coords => !!c)
    .map((c) => [c.lat, c.lng]);
  const orderedLabels = allNames.filter((n) => !!coordsCache[n]);

  // Travel time estimate
  const coordsList = orderedPoints.map(([lat, lng]) => ({ lat, lng }));
  const travelMinutes = estimateTravelMinutes(coordsList, formData.travelModes);
  const tripMinutes = formData.duration * 24 * 60;
  const travelRatio = tripMinutes > 0 ? travelMinutes / tripMinutes : 0;
  const barColor = travelRatio > 0.4 ? (travelRatio > 0.7 ? "bg-red-500" : "bg-amber-500") : "bg-primary";

  // Intercontinental detection — fly required only when crossing continents
  // (intra-EU, US↔Canada, etc. don't need a forced flight)
  const originCountry = formData.origin ? coordsCache[formData.origin]?.countryCode : undefined;
  const originContinent = originCountry ? COUNTRY_CONTINENT[originCountry] : undefined;
  const isInternational = !!(originContinent && formData.destinations.some(dest => {
    const dc = coordsCache[dest]?.countryCode;
    const destContinent = dc ? COUNTRY_CONTINENT[dc] : undefined;
    return destContinent && destContinent !== originContinent;
  }));

  // Auto-add fly when international trip detected
  useEffect(() => {
    if (isInternational && !formData.travelModes.includes("fly")) {
      setFormData(prev => ({ ...prev, travelModes: [...prev.travelModes, "fly"] }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInternational]);

  // Fetch actual road route from Google Directions when drive mode is selected
  useEffect(() => {
    const isDriving = formData.travelModes.includes("drive");
    if (!isDriving || orderedPoints.length < 2) {
      setRoutePolyline(null);
      return;
    }
    const waypoints = orderedPoints.map(([lat, lng]) => ({ lat, lng }));
    fetch("/api/places/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ waypoints }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.points?.length > 1) setRoutePolyline(data.points);
        else setRoutePolyline(null);
      })
      .catch(() => setRoutePolyline(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedPoints.length, formData.travelModes.join(",")]);

  // Fetch initial suggestions if origin is set and we have no suggestions yet
  useEffect(() => {
    if (formData.origin && suggestions.length === 0 && !suggestionsLoading) {
      fetchSuggestions(formData.destinations);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.origin]);

  return (
    <div className="py-2">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 h-full">

        {/* ── Left: Map + suggestions ─────────────────────────────── */}
        <div className="sm:col-span-2 flex flex-col gap-3">
          <div className={`transition-all duration-300 ${formData.origin ? "h-[180px] sm:h-[200px]" : "h-[210px] sm:h-[240px]"}`}>
            <RouteMap
              orderedPoints={orderedPoints}
              labels={orderedLabels}
              suggestions={suggestions}
              onAddSuggestion={addDestination}
              onExpand={() => setMapExpanded(true)}
              height="100%"
              flyTo={mapFlyTo}
              routePolyline={routePolyline}
            />
          </div>

          {/* International trip notice */}
          {isInternational && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary">
              <Plane className="h-3.5 w-3.5 shrink-0" />
              <span>International trip — <strong>fly</strong> added to your travel modes. Cruise support coming soon.</span>
            </div>
          )}

          {/* Nearby suggestions */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {formData.destinations.length === 0 && formData.origin
                ? `Destinations from ${formData.origin}`
                : formData.destinations.length > 0
                ? `Places to visit from ${formData.destinations[formData.destinations.length - 1]}`
                : "Add a starting point to see suggestions"}
            </p>
            {suggestionsLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border p-2.5 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="overflow-y-auto pr-1 -mr-1">
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.slice(0, 8).map((s) => {
                    const alreadyAdded = formData.destinations.includes(s.name);
                    return (
                      <div
                        key={s.name}
                        onClick={() => { if (s.lat !== null && s.lng !== null) setMapFlyTo([s.lat!, s.lng!]); }}
                        className="rounded-lg border border-border bg-card overflow-hidden flex flex-col cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                      >
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt={s.topAttraction ?? s.name}
                            className="w-full h-20 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-20 bg-muted/40 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="p-2 flex flex-col gap-0.5 flex-1">
                          <span className="text-xs font-semibold text-foreground leading-tight">{s.name}</span>
                          {s.topAttraction && (
                            <span className="text-[10px] text-primary font-medium leading-tight truncate">{s.topAttraction}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground leading-snug flex-1 line-clamp-2">{s.description}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); addDestination(s.name); }}
                            disabled={alreadyAdded}
                            className="mt-1.5 w-full text-[11px] font-medium bg-primary text-primary-foreground rounded px-2 py-1 hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-1 transition-colors"
                          >
                            {alreadyAdded
                              ? <><Check className="h-3 w-3" /> Added</>
                              : <><Plus className="h-3 w-3" /> Add to route</>
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : formData.origin ? (
              <p className="text-xs text-muted-foreground italic">No suggestions yet — add a stop to get ideas.</p>
            ) : null}
          </div>
        </div>

        {/* ── Right: unified journey chain ────────────────────── */}
        <div className="sm:col-span-3 flex flex-col gap-3">

          {/* Starting Point */}
          <div className="space-y-1">
            <Label className="text-xs">Starting Point</Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Your starting city"
                value={formData.origin}
                onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value }))}
                onBlur={() => { if (formData.origin) geocode(formData.origin); }}
                data-testid="input-origin"
              />
            </div>
          </div>

          {/* Stops + Add Stop — sandwiched between start and return */}
          <div className="flex gap-2 min-h-0">
            {/* Vertical connector line */}
            <div className="flex flex-col items-center mt-1 mb-1 ml-[13px] shrink-0">
              <div className="w-px flex-1 bg-border" />
            </div>

            <div className="flex-1 space-y-1 min-h-0">
              {/* Existing stops */}
              {formData.destinations.map((dest, idx) => (
                <div
                  key={dest + idx}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-card text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate">{dest}</span>
                  <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} className="p-0.5 hover:bg-muted rounded disabled:opacity-30">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => moveDown(idx)} disabled={idx === formData.destinations.length - 1} className="p-0.5 hover:bg-muted rounded disabled:opacity-30">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => removeDestination(idx)} className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add a Stop input */}
              <div className="space-y-0.5" ref={dropdownRef}>
                <div className="relative">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        className="h-8 text-sm pr-8"
                        placeholder="Add a stop…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && query.trim()) {
                            addDestination(predictions[0]?.description ?? query.trim());
                          }
                          if (e.key === "Escape") { setShowDropdown(false); }
                        }}
                        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                        data-testid="input-add-stop"
                      />
                      {autocompleteLoading && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => addDestination(predictions[0]?.description ?? query.trim())}
                      data-testid="button-add-stop"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Autocomplete dropdown */}
                  {showDropdown && predictions.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                      {predictions.map((p) => (
                        <button
                          key={p.placeId}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addDestination(p.description)}
                        >
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {p.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Return-flight indicator (round trip with stops) */}
              {formData.finalDestination &&
               formData.destinations.length > 0 &&
               formData.finalDestination.trim().toLowerCase() === formData.origin?.trim().toLowerCase() && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground border border-dashed border-border/60 rounded-lg bg-background/60">
                  <span className="shrink-0">✈️</span>
                  <span>Return from {formData.destinations[formData.destinations.length - 1]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Return to */}
          <div className="space-y-1">
            <Label className="text-xs">Return to</Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Where your trip ends"
                value={formData.finalDestination}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, finalDestination: e.target.value }));
                }}
                onBlur={() => { if (formData.finalDestination) geocode(formData.finalDestination); }}
                data-testid="input-final-destination"
              />
            </div>
            {/* Open-jaw warning */}
            {formData.finalDestination && formData.origin &&
             formData.finalDestination.trim().toLowerCase() !== formData.origin.trim().toLowerCase() ? (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                ⚠️ Open-jaw trip — return to {formData.origin} not included in travel time.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Defaults to your starting point (round trip).
              </p>
            )}
          </div>

          {/* Travel time bar */}
          {travelMinutes > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>~{formatMinutes(travelMinutes)} travel time</span>
                <span>{formData.duration} day{formData.duration !== 1 ? "s" : ""} total</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.min(100, Math.round(travelRatio * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded map dialog */}
      <Dialog open={mapExpanded} onOpenChange={setMapExpanded}>
        <DialogContent className="sm:max-w-[95vw] h-[90vh] flex flex-col p-4 gap-3">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-serif text-lg">Your Route</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <RouteMap
              orderedPoints={orderedPoints}
              labels={orderedLabels}
              suggestions={suggestions}
              onAddSuggestion={addDestination}
              height="100%"
              flyTo={mapFlyTo}
              routePolyline={routePolyline}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
