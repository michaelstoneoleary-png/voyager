export interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  price?: string;
  url: string;
  categories: { alias: string; title: string }[];
  location: { address1: string; city: string; display_address: string[] };
  coordinates: { latitude: number; longitude: number };
  image_url?: string;
  phone?: string;
  is_closed?: boolean;
}

interface YelpSearchParams {
  location: string;
  categories?: string;
  price?: string;  // "1,2,3,4" — Yelp price levels
  limit?: number;
  sort_by?: "best_match" | "rating" | "review_count";
}

// Maps cuisine preference labels to Yelp category aliases
export const CUISINE_TO_YELP: Record<string, string> = {
  Italian: "italian",
  Japanese: "japanese",
  Mexican: "mexican",
  Chinese: "chinese",
  Indian: "indpak",
  French: "french",
  Mediterranean: "mediterranean",
  American: "newamerican",
  Thai: "thai",
  Spanish: "spanish",
  Greek: "greek",
  "Middle Eastern": "mideastern",
  Seafood: "seafood",
  Steakhouse: "steak",
  Vietnamese: "vietnamese",
  Korean: "korean",
  Brazilian: "brazilian",
  Vegetarian: "vegetarian",
  Vegan: "vegan",
};

// Maps dietary restriction labels to Yelp category aliases (where applicable)
export const DIETARY_TO_YELP: Record<string, string> = {
  Vegetarian: "vegetarian",
  Vegan: "vegan",
  Halal: "halal",
  Kosher: "kosher",
};

export async function searchRestaurants(params: YelpSearchParams): Promise<YelpBusiness[]> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    console.warn("YELP_API_KEY not set — skipping Yelp enrichment");
    return [];
  }

  const query = new URLSearchParams({
    location: params.location,
    categories: params.categories || "restaurants",
    limit: String(params.limit ?? 10),
    sort_by: params.sort_by ?? "rating",
  });
  if (params.price) query.set("price", params.price);

  try {
    const res = await fetch(`https://api.yelp.com/v3/businesses/search?${query.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.error("Yelp API error:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return (data.businesses || []).filter((b: YelpBusiness) => !b.is_closed);
  } catch (err) {
    console.error("Yelp fetch failed:", err);
    return [];
  }
}

export function buildYelpCategories(
  cuisinePreferences: string[] = [],
  dietaryRestrictions: string[] = []
): string {
  const cats = new Set<string>(["restaurants"]);
  for (const c of cuisinePreferences) {
    const alias = CUISINE_TO_YELP[c];
    if (alias) cats.add(alias);
  }
  for (const d of dietaryRestrictions) {
    const alias = DIETARY_TO_YELP[d];
    if (alias) cats.add(alias);
  }
  return Array.from(cats).join(",");
}

export function formatYelpRestaurantsForPrompt(businesses: YelpBusiness[]): string {
  if (!businesses.length) return "";
  return businesses
    .map((b) => {
      const cats = b.categories.map((c) => c.title).join(", ");
      const addr = b.location.display_address.join(", ");
      const price = b.price || "N/A";
      return `- ${b.name} | Rating: ${b.rating}/5 (${b.review_count} reviews) | Price: ${price} | Cuisine: ${cats} | ${addr} | ${b.url}`;
    })
    .join("\n");
}

/**
 * Try to match an activity title to a Yelp business by name overlap.
 * Returns the matched business or undefined.
 */
export function matchActivityToYelp(
  activityTitle: string,
  businesses: YelpBusiness[]
): YelpBusiness | undefined {
  const title = activityTitle.toLowerCase().trim();
  return businesses.find((b) => {
    const name = b.name.toLowerCase().trim();
    // Direct inclusion check
    if (title.includes(name) || name.includes(title)) return true;
    // Word-overlap check: at least 2 words in common (filters out single common words)
    const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
    const nameWords = name.split(/\s+/).filter((w) => w.length > 3);
    const overlap = titleWords.filter((w) => nameWords.includes(w));
    return overlap.length >= 2;
  });
}
