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
  ChevronUp,
  ChevronDown,
  X,
  Maximize2,
  Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Coords { lat: number; lng: number }

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

// ── FitBoundsView ─────────────────────────────────────────────────────────────

function FitBoundsView({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points as [number, number][], { padding: [48, 48], maxZoom: 10 });
    } else if (points.length === 1) {
      map.setView(points[0], 8);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => `${p[0]},${p[1]}`).join("|")]);
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
}: {
  orderedPoints: [number, number][];
  labels: string[];
  suggestions?: NearbySuggestion[];
  onAddSuggestion?: (name: string) => void;
  onExpand?: () => void;
  height?: string;
}) {
  // All geocoded points for fitting bounds (route + suggestions)
  const suggestionPoints: [number, number][] = suggestions
    .filter((s) => s.lat !== null && s.lng !== null)
    .map((s) => [s.lat!, s.lng!]);
  const allPoints = [...orderedPoints, ...suggestionPoints];

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

        {orderedPoints.length > 1 && (
          <Polyline
            positions={orderedPoints}
            pathOptions={{ color: "var(--primary)", weight: 2, dashArray: "6 4", opacity: 0.8 }}
          />
        )}

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

        <FitBoundsView points={allPoints.length ? allPoints : orderedPoints} />
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
      const data: { lat: number | null; lng: number | null } = await res.json();
      if (data.lat !== null && data.lng !== null) {
        const coords = { lat: data.lat, lng: data.lng };
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

  // Geocode origin on mount
  useEffect(() => {
    if (formData.origin) geocode(formData.origin);
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
    await geocode(name);
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
        <div className="sm:col-span-3 flex flex-col gap-3">
          <div className="h-[300px] sm:h-[340px]">
            <RouteMap
              orderedPoints={orderedPoints}
              labels={orderedLabels}
              suggestions={suggestions}
              onAddSuggestion={addDestination}
              onExpand={() => setMapExpanded(true)}
              height="100%"
            />
          </div>

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
              <div className="grid grid-cols-2 gap-2">
                {suggestions.slice(0, 6).map((s) => (
                  <div
                    key={s.name}
                    className="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
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
                        onClick={() => addDestination(s.name)}
                        disabled={formData.destinations.includes(s.name)}
                        className="mt-1.5 self-start text-[11px] font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Add to route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : formData.origin ? (
              <p className="text-xs text-muted-foreground italic">No suggestions yet — add a stop to get ideas.</p>
            ) : null}
          </div>
        </div>

        {/* ── Right: inputs + chain + travel time ─────────────────── */}
        <div className="sm:col-span-2 flex flex-col gap-4">

          {/* Origin / Final destination */}
          <div className="grid grid-cols-1 gap-2">
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
            <div className="space-y-1">
              <Label className="text-xs">Final Destination</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Where your trip ends"
                  value={formData.finalDestination}
                  onChange={(e) => setFormData((prev) => ({ ...prev, finalDestination: e.target.value }))}
                  onBlur={() => { if (formData.finalDestination) geocode(formData.finalDestination); }}
                  data-testid="input-final-destination"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Can be different if you're not returning home.
            </p>
          </div>

          {/* Add a stop — autocomplete */}
          <div className="space-y-1" ref={dropdownRef}>
            <Label className="text-xs">Add a Stop</Label>
            <div className="relative">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    className="h-8 text-sm pr-8"
                    placeholder="City, country or region"
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

          {/* Destination chain */}
          <div className="flex-1 space-y-1 min-h-0">
            <Label className="text-xs">Route</Label>
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
              {/* Origin row */}
              {formData.origin && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-foreground/80 text-white flex items-center justify-center text-[10px] font-bold shrink-0">S</span>
                  <span className="truncate">{formData.origin}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] py-0 px-1.5">Start</Badge>
                </div>
              )}

              {/* Movable stops */}
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

              {/* Final destination row */}
              {formData.finalDestination && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-foreground/80 text-white flex items-center justify-center text-[10px] font-bold shrink-0">E</span>
                  <span className="truncate">{formData.finalDestination}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] py-0 px-1.5">End</Badge>
                </div>
              )}

              {!formData.origin && formData.destinations.length === 0 && !formData.finalDestination && (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-xs">
                  <MapPin className="h-6 w-6 mb-1 opacity-40" />
                  Add stops to build your route
                </div>
              )}
            </div>
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
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
