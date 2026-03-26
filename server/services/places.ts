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
