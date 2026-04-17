export interface DayTripResult {
  id: string;
  name: string;
  category: string;           // e.g. "State Park", "Museum", "Amusement Park"
  description?: string;       // editorialSummary from Google
  rating: number;
  review_count: number;
  url: string;                // Google Maps URI
  address: string;
  photo_url?: string;         // First photo from Places API
  coordinates: { latitude: number; longitude: number };
  is_wildcard?: boolean;      // true for hidden gem / road less traveled picks
}

export interface PlaceResult {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  price?: string;           // "$" | "$$" | "$$$" | "$$$$"
  url: string;              // Google Maps URI
  categories: string[];     // primaryType human-readable
  address: string;
  coordinates: { latitude: number; longitude: number };
  is_closed?: boolean;
}

// Maps cuisine preference labels to Google Places types
export const CUISINE_TO_GOOGLE_TYPE: Record<string, string> = {
  Italian: "italian_restaurant",
  Japanese: "japanese_restaurant",
  Mexican: "mexican_restaurant",
  Chinese: "chinese_restaurant",
  Indian: "indian_restaurant",
  French: "french_restaurant",
  Mediterranean: "mediterranean_restaurant",
  American: "american_restaurant",
  Thai: "thai_restaurant",
  Spanish: "spanish_restaurant",
  Greek: "greek_restaurant",
  "Middle Eastern": "middle_eastern_restaurant",
  Seafood: "seafood_restaurant",
  Steakhouse: "steak_house",
  Vietnamese: "vietnamese_restaurant",
  Korean: "korean_restaurant",
  Brazilian: "brazilian_restaurant",
  Vegetarian: "vegetarian_restaurant",
  Vegan: "vegan_restaurant",
};

// Maps dining price range keys ("1","2","3","4") to Google price level strings
const PRICE_MAP: Record<string, string> = {
  "1": "PRICE_LEVEL_INEXPENSIVE",
  "2": "PRICE_LEVEL_MODERATE",
  "3": "PRICE_LEVEL_EXPENSIVE",
  "4": "PRICE_LEVEL_VERY_EXPENSIVE",
};

// Maps Google price level enum back to display symbols
const PRICE_DISPLAY: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

interface SearchParams {
  location: string;
  cuisinePreferences?: string[];
  dietaryRestrictions?: string[];
  priceRange?: string;  // "1,2,3,4" comma-separated
  limit?: number;
}

export async function searchRestaurants(params: SearchParams): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set — skipping restaurant enrichment");
    return [];
  }

  const cuisineTypes = (params.cuisinePreferences || [])
    .map((c) => CUISINE_TO_GOOGLE_TYPE[c])
    .filter(Boolean);

  const dietaryTypes = (params.dietaryRestrictions || [])
    .map((d) => CUISINE_TO_GOOGLE_TYPE[d])
    .filter(Boolean);

  const includedTypes = [...new Set([...cuisineTypes, ...dietaryTypes])];

  // Build text query — use cuisine context if available
  const cuisineLabel =
    params.cuisinePreferences && params.cuisinePreferences.length
      ? params.cuisinePreferences.slice(0, 2).join(" or ") + " "
      : "";
  const textQuery = `${cuisineLabel}restaurants in ${params.location}`;

  const priceLevels = (params.priceRange || "")
    .split(",")
    .filter(Boolean)
    .map((p) => PRICE_MAP[p])
    .filter(Boolean);

  const body: Record<string, any> = {
    textQuery,
    languageCode: "en",
    maxResultCount: params.limit ?? 10,
    rankPreference: "RELEVANCE",
  };

  if (includedTypes.length === 1) {
    // Single type filter is supported as includedType
    body.includedType = includedTypes[0];
  }

  if (priceLevels.length) {
    body.priceLevels = priceLevels;
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.rating",
          "places.userRatingCount",
          "places.priceLevel",
          "places.googleMapsUri",
          "places.formattedAddress",
          "places.location",
          "places.primaryTypeDisplayName",
          "places.regularOpeningHours",
        ].join(","),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("Google Places API error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return (data.places || []).map((p: any): PlaceResult => ({
      id: p.id || "",
      name: p.displayName?.text || "Unknown",
      rating: p.rating || 0,
      review_count: p.userRatingCount || 0,
      price: p.priceLevel ? PRICE_DISPLAY[p.priceLevel] : undefined,
      url: p.googleMapsUri || "",
      categories: p.primaryTypeDisplayName?.text ? [p.primaryTypeDisplayName.text] : [],
      address: p.formattedAddress || "",
      coordinates: {
        latitude: p.location?.latitude || 0,
        longitude: p.location?.longitude || 0,
      },
    }));
  } catch (err) {
    console.error("Google Places fetch failed:", err);
    return [];
  }
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

export async function geocodeLocation(
  address: string
): Promise<{ lat: number; lng: number; countryCode?: string } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.status !== "OK") {
      console.error("[geocode] API error for", address, "— status:", data.status, "error_message:", data.error_message ?? "(none)");
      return null;
    }
    const loc = data.results?.[0]?.geometry?.location;
    if (!loc) return null;
    const countryComponent = data.results?.[0]?.address_components?.find(
      (c: { types: string[]; short_name: string }) => c.types.includes("country")
    );
    return { lat: loc.lat, lng: loc.lng, countryCode: countryComponent?.short_name };
  } catch (err) {
    console.error("[geocode] fetch threw for", address, err);
    return null;
  }
}

// ── Directions (road routing) ─────────────────────────────────────────────────

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export async function getDirectionsRoute(
  waypoints: { lat: number; lng: number }[]
): Promise<{ points: [number, number][]; distance: string; duration: string } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || waypoints.length < 2) return null;
  try {
    const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
    const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
    const waypointStr = waypoints.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|");
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointStr ? `&waypoints=${encodeURIComponent(waypointStr)}` : ""}&mode=driving&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.routes?.[0]) {
      console.warn("[directions] API status:", data.status);
      return null;
    }
    const route = data.routes[0];
    const points = decodePolyline(route.overview_polyline.points);
    const legs = route.legs as { distance: { text: string }; duration: { text: string } }[];
    const totalDist = legs.reduce((s, l) => s + (l.distance?.text ? parseFloat(l.distance.text) : 0), 0);
    const totalSecs = legs.reduce((s, l) => s + (l.duration?.text ? 0 : 0), 0);
    const distance = legs.map(l => l.distance?.text).filter(Boolean).join(" + ") || "";
    const duration = legs.map(l => l.duration?.text).filter(Boolean).join(" + ") || "";
    void totalDist; void totalSecs;
    return { points, distance, duration };
  } catch (err) {
    console.error("[directions] fetch threw:", err);
    return null;
  }
}

// ── Top Attraction Lookup ─────────────────────────────────────────────────────

export async function getTopAttractionForCity(
  cityName: string,
  center?: { lat: number; lng: number }
): Promise<{ name: string; photoUrl: string | null }  | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const results = await runPlacesTextSearch(
      `top tourist attraction in ${cityName}`,
      center ?? { lat: 0, lng: 0 },
      center ? 50_000 : 0, // 0 radius = omit bias, let text query handle geography
      apiKey,
      1
    );
    if (!results.length) return null;
    const r = results[0];
    return { name: r.name, photoUrl: r.photo_url ?? null };
  } catch (err) {
    console.error("[getTopAttraction] failed for", cityName, err);
    return null;
  }
}

// ── Places Autocomplete ───────────────────────────────────────────────────────

export async function placesAutocomplete(
  input: string
): Promise<{ description: string; placeId: string }[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || input.length < 2) return [];
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ["locality", "administrative_area_level_3"],
      }),
    });
    const data = await res.json();
    return ((data.suggestions as any[]) || [])
      .map((s: any) => ({
        description: s.placePrediction?.text?.text ?? "",
        placeId: s.placePrediction?.placeId ?? "",
      }))
      .filter((s) => s.description);
  } catch (err) {
    console.error("[autocomplete] fetch failed:", err);
    return [];
  }
}

// ── Day Trip Search ───────────────────────────────────────────────────────────

const DAY_TRIP_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.formattedAddress",
  "places.location",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
  "places.photos",
].join(",");

async function runPlacesTextSearch(
  textQuery: string,
  center: { lat: number; lng: number },
  radiusMeters: number,
  apiKey: string,
  limit = 20
): Promise<DayTripResult[]> {
  const body: Record<string, any> = {
    textQuery,
    languageCode: "en",
    maxResultCount: limit,
    rankPreference: "RELEVANCE",
  };

  // Google Places circle.radius max is 50,000m — for larger radii, omit locationBias
  // and let the text query's location context ("near Jacksonville, FL") handle filtering
  if (radiusMeters <= 50_000) {
    body.locationBias = {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusMeters,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DAY_TRIP_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Google Places day-trip search error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.places || []).map((p: any): DayTripResult => {
    // Build photo URL from the first photo reference if available
    const firstPhoto = p.photos?.[0];
    const photo_url = firstPhoto?.name
      ? `https://places.googleapis.com/v1/${firstPhoto.name}/media?maxWidthPx=800&key=${apiKey}`
      : undefined;

    return {
      id: p.id || "",
      name: p.displayName?.text || "Unknown",
      category: p.primaryTypeDisplayName?.text || "Attraction",
      description: p.editorialSummary?.text,
      rating: p.rating || 0,
      review_count: p.userRatingCount || 0,
      url: p.googleMapsUri || "",
      address: p.formattedAddress || "",
      photo_url,
      coordinates: {
        latitude: p.location?.latitude || 0,
        longitude: p.location?.longitude || 0,
      },
    };
  });
}

/**
 * Search for day-trip worthy attractions within ~2.5 hours drive of home.
 * Runs two parallel queries (attractions + parks/nature) and deduplicates.
 */
export async function searchDayTrips(params: {
  homeLocation: string;
  homeCoords?: { lat: number; lng: number };
  travelStyles?: string[];
  maxTravelHours?: number;
}): Promise<DayTripResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set — day trips unavailable");
    return [];
  }

  // Geocode home location if coords not already provided
  let center = params.homeCoords;
  if (!center) {
    center = (await geocodeLocation(params.homeLocation)) ?? undefined;
  }
  if (!center) {
    console.warn("Could not geocode home location for day trips:", params.homeLocation);
    return [];
  }

  // Radius based on maxTravelHours (average ~100 km/h highway speed)
  const maxHours = params.maxTravelHours ?? 2.5;
  // When > 50,000m, locationBias is omitted in runPlacesTextSearch and the
  // text query's location context handles geographic filtering
  const RADIUS_METERS = Math.round(maxHours * 100_000);

  const styles = (params.travelStyles || []).map(s => s.toLowerCase());
  const wantsNature   = styles.some(s => ["nature", "adventure", "outdoors", "hiking"].includes(s));
  const wantsCulture  = styles.some(s => ["culture", "history", "museums", "art"].includes(s));
  const wantsTheme    = styles.some(s => ["family", "thrill", "amusement"].includes(s));

  // Build two mainstream queries and one wildcard "road less traveled" query
  let queryA = `popular tourist attractions and landmarks near ${params.homeLocation}`;
  let queryB = `scenic parks, trails, and nature reserves near ${params.homeLocation}`;
  const queryC = `unique hidden gem quirky unusual small town attractions near ${params.homeLocation}`;

  if (wantsCulture) {
    queryA = `museums, historic sites, and cultural landmarks near ${params.homeLocation}`;
  } else if (wantsTheme) {
    queryA = `amusement parks, zoos, and family attractions near ${params.homeLocation}`;
  }
  if (wantsNature) {
    queryB = `state parks, national parks, hiking trails, and scenic areas near ${params.homeLocation}`;
  }

  try {
    const [resultsA, resultsB, resultsC] = await Promise.all([
      runPlacesTextSearch(queryA, center, RADIUS_METERS, apiKey, 20),
      runPlacesTextSearch(queryB, center, RADIUS_METERS, apiKey, 20),
      runPlacesTextSearch(queryC, center, RADIUS_METERS, apiKey, 15),
    ]);

    // Deduplicate by place ID, favour the entry with a photo
    const seen = new Map<string, DayTripResult>();
    for (const place of [...resultsA, ...resultsB]) {
      if (!place.id) continue;
      const existing = seen.get(place.id);
      if (!existing || (!existing.photo_url && place.photo_url)) {
        seen.set(place.id, place);
      }
    }

    const all = Array.from(seen.values());
    console.log(`[day-trips] raw results: ${all.length} (A:${resultsA.length} B:${resultsB.length} C:${resultsC.length}) radius:${RADIUS_METERS}m`);
    if (all.length > 0) {
      console.log(`[day-trips] sample ratings:`, all.slice(0, 5).map(p => `${p.name} r=${p.rating} n=${p.review_count}`));
    }

    // Mainstream results: include anything with at least 1 review, sorted by quality score
    const mainstream = all
      .filter(p => p.review_count >= 1)
      .sort((a, b) => {
        const scoreA = (a.rating || 3.0) * Math.log(a.review_count + 2);
        const scoreB = (b.rating || 3.0) * Math.log(b.review_count + 2);
        return scoreB - scoreA;
      })
      .slice(0, 12);

    // Wildcards from queryC: highly rated but not yet discovered (low review count)
    const wildcardIds = new Set(mainstream.map(p => p.id));
    const wildcards = resultsC
      .filter(p => p.rating >= 4.2 && p.review_count >= 2 && p.review_count <= 200 && !wildcardIds.has(p.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map(p => ({ ...p, is_wildcard: true }));

    // Last-resort fallback: if everything got filtered out, return raw results sorted by rating
    const mainstreamFinal = mainstream.length === 0 && all.length > 0
      ? all.sort((a, b) => b.rating - a.rating).slice(0, 12)
      : mainstream;

    console.log(`[day-trips] mainstream: ${mainstreamFinal.length}, wildcards: ${wildcards.length}`);
    return [...mainstreamFinal, ...wildcards];
  } catch (err) {
    console.error("Day trips search failed:", err);
    return [];
  }
}

// ── Inspire Destination Discovery (Driving) ───────────────────────────────────

/**
 * Extract "City, ST" from a Google Places formattedAddress string.
 * Falls back to the second-to-last comma-separated component for non-US addresses.
 */
function extractCityFromAddress(address: string): string | null {
  if (!address) return null;
  // Match US pattern: "City, ST 12345" or "City, ST, Country"
  const usMatch = address.match(/([^,]+,\s*[A-Z]{2})(?:\s+\d{5})?(?:,|$)/);
  if (usMatch) return usMatch[1].trim();
  // Fallback: penultimate comma-separated token
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

/**
 * Search for multi-day travel destinations within driving range of homeLocation.
 * Uses Google Places text search to find tourist cities/areas, then extracts
 * unique city names from their addresses. Returns up to 30 city names.
 */
export async function searchInspireDestinations(params: {
  homeLocation: string;
  maxTravelHours: number;
}): Promise<string[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set — inspire destination search unavailable");
    return [];
  }

  const center = await geocodeLocation(params.homeLocation);
  if (!center) {
    console.warn("[inspire-destinations] Could not geocode:", params.homeLocation);
    return [];
  }

  // 80 km/h avg road speed (more realistic than 100 km/h for long highway drives)
  const RADIUS_METERS = Math.round(params.maxTravelHours * 80_000);

  const queries = [
    `tourist resort hotel vacation destination near ${params.homeLocation}`,
    `historic downtown city center tourism near ${params.homeLocation}`,
    `unique hidden gem small town bed and breakfast destination near ${params.homeLocation}`,
  ];

  try {
    const batches = await Promise.all(
      queries.map(q => runPlacesTextSearch(q, center, RADIUS_METERS, apiKey, 20))
    );

    const citySet = new Set<string>();
    for (const batch of batches) {
      for (const place of batch) {
        const city = extractCityFromAddress(place.address);
        if (city) citySet.add(city);
      }
    }

    const cities = Array.from(citySet).slice(0, 30);
    console.log(`[inspire-destinations] ${cities.length} candidate cities (radius: ${RADIUS_METERS}m):`, cities.slice(0, 5).join(", "));
    return cities;
  } catch (err) {
    console.error("[inspire-destinations] search failed:", err);
    return [];
  }
}

export function formatRestaurantsForPrompt(businesses: PlaceResult[]): string {
  if (!businesses.length) return "";
  return businesses
    .map((b) => {
      const cats = b.categories.join(", ");
      const price = b.price || "N/A";
      return `- ${b.name} | Rating: ${b.rating}/5 (${b.review_count} reviews) | Price: ${price} | ${cats} | ${b.address} | ${b.url}`;
    })
    .join("\n");
}

/**
 * Try to match an activity title to a Place result by name overlap.
 */
export function matchActivityToPlace(
  activityTitle: string,
  businesses: PlaceResult[]
): PlaceResult | undefined {
  const title = activityTitle.toLowerCase().trim();
  return businesses.find((b) => {
    const name = b.name.toLowerCase().trim();
    if (title.includes(name) || name.includes(title)) return true;
    const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
    const nameWords = name.split(/\s+/).filter((w) => w.length > 3);
    return titleWords.filter((w) => nameWords.includes(w)).length >= 2;
  });
}
