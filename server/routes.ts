import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, getUserId } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { insertJourneySchema, insertPastTripSchema, insertBookmarkSchema, updateUserSettingsSchema, journeyMembers, type User } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import { searchRestaurants, formatRestaurantsForPrompt, matchActivityToPlace, searchDayTrips, type PlaceResult } from "./services/places";
import { sendSms } from "./twilio";
import Papa from "papaparse";
import Parser from "rss-parser";
import multer from "multer";
import ExifReader from "exifreader";
import { photoProvider } from "./photoStorage";

function formatUserSettings(user: User) {
  return {
    displayName: user.displayName || user.firstName || "",
    email: user.email || "",
    profileImageUrl: user.profileImageUrl || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    homeLocation: user.homeLocation || "",
    passportCountry: user.passportCountry || "",
    temperatureUnit: user.temperatureUnit || "F",
    weightUnit: user.weightUnit || "kg",
    currency: user.currency || "USD",
    distanceUnit: user.distanceUnit || "mi",
    dateFormat: user.dateFormat || "MM/DD/YYYY",
    travelStyles: user.travelStyles || [],
    onboardingCompleted: user.onboardingCompleted || false,
    socialInstagram: user.socialInstagram || "",
    socialBlogUrl: user.socialBlogUrl || "",
    socialYoutube: user.socialYoutube || "",
    socialTiktok: user.socialTiktok || "",
    socialTwitter: user.socialTwitter || "",
    gender: user.gender || "",
    phoneNumber: user.phoneNumber || "",
    publishBlog: user.publishBlog || false,
  };
}

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || undefined,
});

const DESTINATION_FALLBACK_IMAGES: Record<string, string> = {
  city: "/images/destinations/city.jpg",
  beach: "/images/destinations/beach.jpg",
  mountain: "/images/destinations/mountain.jpg",
  historic: "/images/destinations/historic.jpg",
  nature: "/images/destinations/nature.jpg",
  desert: "/images/destinations/desert.jpg",
  coastal: "/images/destinations/coastal.jpg",
  urban: "/images/destinations/urban.jpg",
};

const imageCache = new Map<string, string>();

function parseDurationMinutes(duration: string | undefined): number {
  if (!duration) return 60;
  const hours = duration.match(/(\d+)\s*h/i);
  const mins = duration.match(/(\d+)\s*m/i);
  let total = 0;
  if (hours) total += parseInt(hours[1]) * 60;
  if (mins) total += parseInt(mins[1]);
  if (total === 0) {
    const num = parseInt(duration);
    if (!isNaN(num)) total = num > 10 ? num : num * 60;
    else total = 60;
  }
  return total;
}

function formatDurationMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${h} hour${h > 1 ? "s" : ""} ${m} min`;
}

async function fetchDestinationImage(destinationName: string, fallbackType: string): Promise<string> {
  const fallback = DESTINATION_FALLBACK_IMAGES[fallbackType] || DESTINATION_FALLBACK_IMAGES.city;
  try {
    const searchTerm = destinationName.trim();
    if (!searchTerm) return fallback;

    const cacheKey = searchTerm.toLowerCase();
    if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;

    const isPhoto = (url: string) => /\.(jpg|jpeg|png)/i.test(url);

    // Step 1: use the pageimages API which returns the canonical infobox photo
    // (much more reliable than the summary API which can return unrelated images)
    const encoded = encodeURIComponent(searchTerm);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&redirects=1&format=json&origin=*`,
      { headers: { "User-Agent": "Voyager-Travel-App/1.0" }, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json() as any;
      const pages = Object.values(data?.query?.pages ?? {}) as any[];
      const page = pages[0];
      const origUrl = page?.original?.source;
      const thumbUrl = page?.thumbnail?.source;
      const url = (origUrl && isPhoto(origUrl)) ? origUrl : (thumbUrl && isPhoto(thumbUrl)) ? thumbUrl : null;
      if (url) {
        imageCache.set(cacheKey, url);
        return url;
      }
    }

    // Step 2: fallback — search Wikipedia for the term and take the top result's image
    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 5000);
    const searchResp = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&srlimit=1&srprop=&format=json&origin=*`,
      { headers: { "User-Agent": "Voyager-Travel-App/1.0" }, signal: searchController.signal }
    );
    clearTimeout(searchTimeout);

    if (searchResp.ok) {
      const searchData = await searchResp.json() as any;
      const topTitle = searchData?.query?.search?.[0]?.title;
      if (topTitle && topTitle.toLowerCase() !== encoded.toLowerCase()) {
        // Recurse once with the correct article title
        const found = await fetchDestinationImage(topTitle, fallbackType);
        if (found !== fallback) {
          imageCache.set(cacheKey, found);
          return found;
        }
      }
    }

    imageCache.set(cacheKey, fallback);
    return fallback;
  } catch {
    return fallback;
  }
}

async function fetchDestinationImages(
  destinations: Array<{ name: string; type: string }>
): Promise<string[]> {
  const CONCURRENCY = 5;
  const results: string[] = new Array(destinations.length);
  for (let i = 0; i < destinations.length; i += CONCURRENCY) {
    const batch = destinations.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((d) => fetchDestinationImage(d.name, d.type))
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
  }
  return results;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);

  app.get("/api/user-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(formatUserSettings(user));
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/user-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const validated = updateUserSettingsSchema.parse(req.body);
      const updated = await storage.updateUser(userId, validated);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(formatUserSettings(updated));
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Restaurant search via Yelp
  app.get("/api/restaurants/search", isAuthenticated, async (req: any, res) => {
    try {
      const { location, cuisines, dietary, price } = req.query as Record<string, string>;
      if (!location) return res.status(400).json({ message: "location is required" });
      const cuisineList = cuisines ? cuisines.split(",") : [];
      const dietaryList = dietary ? dietary.split(",") : [];
      const businesses = await searchRestaurants({ location, cuisinePreferences: cuisineList, dietaryRestrictions: dietaryList, priceRange: price, limit: 20 });
      res.json(businesses);
    } catch (error) {
      console.error("Error searching restaurants:", error);
      res.status(500).json({ message: "Failed to search restaurants" });
    }
  });

  // Journeys CRUD
  app.get("/api/journeys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const journeys = await storage.getJourneys(userId);
      res.json(journeys);
    } catch (error) {
      console.error("Error fetching journeys:", error);
      res.status(500).json({ message: "Failed to fetch journeys" });
    }
  });

  app.get("/api/journeys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const journey = await storage.getJourney(req.params.id, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });
      res.json(journey);
    } catch (error) {
      console.error("Error fetching journey:", error);
      res.status(500).json({ message: "Failed to fetch journey" });
    }
  });

  app.post("/api/journeys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const data = { ...req.body, userId };
      if (!data.image) {
        const imageDest = data.finalDestination || data.destinations?.[0];
        if (imageDest) {
          data.image = await fetchDestinationImage(imageDest, "city");
        }
      }
      const parsed = insertJourneySchema.parse(data);
      const journey = await storage.createJourneyWithOwner(parsed);
      res.status(201).json(journey);
    } catch (error: any) {
      console.error("Error creating journey:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid journey data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create journey" });
    }
  });

  app.patch("/api/journeys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const journey = await storage.updateJourney(req.params.id, userId, req.body);
      if (!journey) return res.status(404).json({ message: "Journey not found" });
      res.json(journey);
    } catch (error) {
      console.error("Error updating journey:", error);
      res.status(500).json({ message: "Failed to update journey" });
    }
  });

  app.delete("/api/journeys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const deleted = await storage.deleteJourney(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Journey not found" });
      res.json({ message: "Journey deleted" });
    } catch (error) {
      console.error("Error deleting journey:", error);
      res.status(500).json({ message: "Failed to delete journey" });
    }
  });

  // Generate AI Itinerary
  app.post("/api/journeys/:id/generate-itinerary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const journey = await storage.getJourney(req.params.id, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });

      const user = await storage.getUser(userId);
      const allStops = [
        journey.origin,
        ...(journey.destinations || []),
        journey.finalDestination,
      ].filter(Boolean);
      const destinations = allStops.join(", ") || "unspecified destination";
      const days = journey.days || 7;
      const budget = journey.cost || "flexible";
      const currency = user?.currency || "USD";
      const originNote = journey.origin ? `Starting from: ${journey.origin}. ` : "";
      const finalNote = journey.finalDestination ? `Ending at: ${journey.finalDestination}. ` : "";

      const { wishlist } = req.body || {};
      const wishlistNote = wishlist && wishlist.trim()
        ? `\n\nThe traveler has specifically requested to include these places, activities, or interests in their itinerary:\n${wishlist}\n\nPrioritize incorporating these requests into the itinerary where possible, fitting them into the most logical days and times.`
        : "";

      const travelMode = (journey as any).travelMode || "mixed";
      const travelModeLabels: Record<string, string> = {
        drive: "ROAD TRIP — the traveler is DRIVING the entire trip. All travel between stops must be by car/driving. Include realistic driving times and distances between cities. Suggest scenic routes, interesting roadside stops, and rest breaks for long drives. No flights. Plan logistics activities as 'drive' mode only.",
        fly: "The traveler will FLY between distant cities. Use flights for long-distance travel and local transport (taxi/transit/walk) within cities.",
        train: "The traveler prefers TRAIN travel between cities. Plan rail journeys between destinations with station names and estimated journey times. Use local transport within cities.",
        bus: "The traveler will use BUS/COACH between cities. Plan bus routes between destinations with realistic journey times. Use local transport within cities.",
        ferry: "The traveler will use FERRY/BOAT between destinations where applicable. Plan water crossings and maritime routes. Use appropriate local transport for land portions.",
        mixed: "The traveler is open to ALL modes of transport. Choose the best option for each leg — driving for short distances, trains for medium, flights for long distances, ferries where relevant."
      };
      const travelModeNote = travelModeLabels[travelMode] || travelModeLabels.mixed;

      // Fetch Yelp restaurants for each unique destination stop
      const uniqueStops = [...new Set([
        journey.origin,
        ...(journey.destinations || []),
        journey.finalDestination,
      ].filter(Boolean))] as string[];

      const restaurantsByStop: Record<string, string> = {};
      const placesByStop: Record<string, PlaceResult[]> = {};
      await Promise.all(
        uniqueStops.map(async (stop) => {
          const businesses = await searchRestaurants({
            location: stop,
            cuisinePreferences: (user as any)?.cuisinePreferences || [],
            dietaryRestrictions: (user as any)?.dietaryRestrictions || [],
            priceRange: (user as any)?.diningPriceRange || undefined,
            limit: 8,
          });
          if (businesses.length) {
            restaurantsByStop[stop] = formatRestaurantsForPrompt(businesses);
            placesByStop[stop] = businesses;
          }
        })
      );

      const restaurantNote = Object.entries(restaurantsByStop).length
        ? `\n\nVERIFIED GOOGLE RESTAURANTS — use these real, highly-rated restaurants when scheduling food/dining activities. Prioritise these over invented names:\n${
            Object.entries(restaurantsByStop)
              .map(([stop, list]) => `\n${stop}:\n${list}`)
              .join("\n")
          }\n`
        : "";

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 32000,
        messages: [{
          role: "user",
          content: `Create a detailed day-by-day travel itinerary for a ${days}-day trip covering: ${destinations}. ${originNote}${finalNote}Budget: ${budget} ${currency}.${wishlistNote}${restaurantNote}

TRAVEL MODE: ${travelModeNote}

Return a JSON object with this exact structure (no markdown, no code fences, just raw JSON):
{
  "days": [
    {
      "day": 1,
      "date_label": "Day 1",
      "location": "City Name",
      "hotels": [
        {
          "name": "Hotel Name",
          "category": "luxury|upscale|mid-range|budget|boutique|hostel",
          "price_per_night": "$150",
          "rating": 4.5,
          "review_summary": "One-line summary of what reviewers love about this hotel",
          "why_this_hotel": "Why it makes sense for this day's itinerary and location",
          "neighborhood": "District or neighborhood name",
          "lat": 42.6980,
          "lng": 23.3225,
          "image_query": "Wikipedia article title for this hotel or its neighborhood"
        }
      ],
      "activities": [
        {
          "time": "09:00",
          "title": "Activity Name",
          "type": "culture|food|logistics|nature|shopping|nightlife|relaxation",
          "duration": "2 hours",
          "description": "Brief description",
          "cost": "Free or estimated cost",
          "tip": "Optional insider tip",
          "lat": 42.6977,
          "lng": 23.3219,
          "image_query": "Wikipedia article title for this specific place or landmark (e.g. 'Rila_Monastery', 'Alexander_Nevsky_Cathedral,_Sofia')",
          "travel_to_next": {
            "mode": "walk|drive|taxi|transit|bus|train|ferry|flight",
            "duration": "15 min",
            "distance": "1.2 km",
            "note": "Optional note e.g. 'Take Metro Line 2 towards Lumière'"
          }
        }
      ]
    }
  ],
  "summary": "Brief trip summary"
}

Include 3-5 activities per day with realistic times, real places, accurate coordinates (lat/lng), cost estimates, and insider tips. Cover a mix of culture, food, logistics (arrival/departure), nature, shopping, and local experiences. Use the actual correct coordinates for each place.
SHOPPING ACTIVITIES: Include at least one shopping activity per destination that highlights products ENDEMIC to the region — local artisan crafts, specialty goods, and cultural products unique to the area. Examples: silverwork and turquoise jewelry in Santa Fe, saffron in Spain, hand-painted azulejo tiles in Portugal, Murano blown glass in Venice, silk in Thailand, leather goods in Florence, ceramics in Oaxaca. For each shopping activity, the description MUST name the specific local product(s) and explain their cultural significance. The tip should include where to find authentic (non-tourist-trap) sources and what to look for when buying. Title should reference the specific local product, not just "Shopping" or "Market visit".
TRAVEL BETWEEN STOPS: For each activity (except the last one of the day), include "travel_to_next" with the best travel mode, estimated duration, distance, and an optional practical note (e.g. which metro line, bus number, or if walking is scenic). Be realistic about travel times based on actual distances.
For image_query, provide the exact Wikipedia article title for each specific place, landmark, restaurant, or attraction (use underscores for spaces). This must be a real Wikipedia page name. For restaurants or lesser-known places, use the neighborhood or district Wikipedia page instead.

HOTEL RECOMMENDATIONS: For each day/location, recommend 2-3 hotels ranked by best value (balancing review rating and cost). Hotels MUST be real, well-known properties with accurate coordinates. Choose hotels strategically located near that day's activities so the itinerary "makes sense" geographically. Include a mix of price categories matching the traveler's budget (${budget} ${currency}). The "why_this_hotel" field should explain proximity to the day's attractions.`
        }],
      });

      console.log("[generate-itinerary] stop_reason:", response.stop_reason, "| output_tokens:", response.usage?.output_tokens);

      const textContent = response.content.find(c => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        return res.status(500).json({ message: "No response from AI" });
      }

      let itinerary;
      try {
        const cleaned = textContent.text
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();
        itinerary = JSON.parse(cleaned);
      } catch {
        return res.status(422).json({ message: "AI returned an invalid itinerary format. Please try again." });
      }

      if (!itinerary?.days || !Array.isArray(itinerary.days) || itinerary.days.length === 0) {
        return res.status(422).json({ message: "AI itinerary is missing day data. Please try again." });
      }

      for (const day of itinerary.days) {
        if (!day.activities || !Array.isArray(day.activities)) {
          day.activities = [];
        }
        if (!day.hotels || !Array.isArray(day.hotels)) {
          day.hotels = [];
        }
        if (!day.location) day.location = "Unknown";
        if (!day.day) day.day = itinerary.days.indexOf(day) + 1;
        if (!day.date_label) day.date_label = `Day ${day.day}`;

        for (const hotel of day.hotels) {
          if (typeof hotel.rating === "string") hotel.rating = parseFloat(hotel.rating) || 0;
        }
        day.hotels.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));

        // Attach Yelp data to food activities where we can match by name
        const stopBusinesses = placesByStop[day.location] ||
          Object.values(placesByStop).flat();
        for (const activity of day.activities) {
          if (activity.type === "food" && stopBusinesses.length) {
            const match = matchActivityToPlace(activity.title, stopBusinesses);
            if (match) {
              activity.place_url = match.url;
              activity.place_rating = match.rating;
              activity.place_review_count = match.review_count;
              activity.place_price = match.price || undefined;
            }
          }
        }
      }

      const allItems: { item: any; searchTerm: string }[] = [];
      for (const day of itinerary.days) {
        for (const activity of day.activities) {
          allItems.push({ item: activity, searchTerm: activity.image_query || activity.title });
        }
        for (const hotel of day.hotels) {
          allItems.push({ item: hotel, searchTerm: hotel.image_query || hotel.neighborhood || hotel.name });
        }
      }

      const CONCURRENCY = 5;
      for (let i = 0; i < allItems.length; i += CONCURRENCY) {
        const batch = allItems.slice(i, i + CONCURRENCY);
        const images = await Promise.all(
          batch.map(({ searchTerm }) => fetchDestinationImage(searchTerm, "culture"))
        );
        for (let j = 0; j < batch.length; j++) {
          batch[j].item.image_url = images[j];
        }
      }

      const updated = await storage.updateJourney(req.params.id, userId, { itinerary });
      res.json(updated);
    } catch (error) {
      console.error("Error generating itinerary:", error);
      res.status(500).json({ message: "Failed to generate itinerary" });
    }
  });

  app.post("/api/journeys/:id/remove-activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const journey = await storage.getJourney(req.params.id, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });

      const itinerary = journey.itinerary as any;
      if (!itinerary?.days) return res.status(400).json({ message: "No itinerary found" });

      const { dayIndex, activityIndex, action, replaceType } = req.body;
      if (typeof dayIndex !== "number" || typeof activityIndex !== "number") {
        return res.status(400).json({ message: "dayIndex and activityIndex are required" });
      }

      const day = itinerary.days[dayIndex];
      if (!day || !day.activities || !day.activities[activityIndex]) {
        return res.status(400).json({ message: "Invalid day or activity index" });
      }

      const removedActivity = day.activities[activityIndex];

      if (action === "extend_previous") {
        if (activityIndex === 0) {
          return res.status(400).json({ message: "No previous activity to extend" });
        }
        const prevActivity = day.activities[activityIndex - 1];
        const removedDurationMinutes = parseDurationMinutes(removedActivity.duration);
        const travelMinutes = removedActivity.travel_to_next ? parseDurationMinutes(removedActivity.travel_to_next.duration) : 0;
        const prevDurationMinutes = parseDurationMinutes(prevActivity.duration);
        const extraMinutes = removedDurationMinutes + travelMinutes;
        const newDuration = prevDurationMinutes + extraMinutes;
        prevActivity.duration = formatDurationMinutes(newDuration);

        if (removedActivity.travel_to_next && activityIndex < day.activities.length - 1) {
          prevActivity.travel_to_next = removedActivity.travel_to_next;
        } else {
          delete prevActivity.travel_to_next;
        }

        day.activities.splice(activityIndex, 1);

        const updated = await storage.updateJourney(req.params.id, userId, { itinerary });
        return res.json(updated);
      }

      if (action === "replace") {
        if (!replaceType) {
          return res.status(400).json({ message: "replaceType is required for replace action" });
        }

        const timeSlot = removedActivity.time;
        const durationHint = removedActivity.duration || "2 hours";
        const location = day.location || "the destination";
        const prevTitle = activityIndex > 0 ? day.activities[activityIndex - 1].title : null;
        const nextTitle = activityIndex < day.activities.length - 1 ? day.activities[activityIndex + 1].title : null;

        const contextActivities = day.activities
          .filter((_: any, i: number) => i !== activityIndex)
          .map((a: any) => a.title)
          .join(", ");

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `Suggest ONE replacement activity for a travel itinerary in ${location}.

Time slot: ${timeSlot}, Duration: ${durationHint}
Type requested: ${replaceType}
${prevTitle ? `Previous activity: ${prevTitle}` : "First activity of the day"}
${nextTitle ? `Next activity: ${nextTitle}` : "Last activity of the day"}
Other activities already planned this day: ${contextActivities || "none"}

Return a JSON object (no markdown, no code fences, just raw JSON):
{
  "time": "${timeSlot}",
  "title": "Activity Name",
  "type": "${replaceType}",
  "duration": "${durationHint}",
  "description": "Brief description",
  "cost": "Free or estimated cost",
  "tip": "Optional insider tip",
  "lat": 0.0000,
  "lng": 0.0000,
  "image_query": "Wikipedia article title for this specific place",
  "travel_to_next": ${nextTitle ? `{ "mode": "walk|drive|taxi|transit|bus|train", "duration": "estimated", "distance": "estimated" }` : "null"}
}

Rules:
- Must be a REAL place that exists in ${location}
- Use accurate lat/lng coordinates
- Must be type "${replaceType}"
- Should complement the other planned activities (don't duplicate what's already there)
- For image_query, use the exact Wikipedia article title
- If type is "shopping": Focus on products ENDEMIC to the region — local artisan crafts, specialty goods, and cultural products unique to ${location}. The description MUST name the specific local product(s) and their cultural significance. The tip should recommend authentic (non-tourist-trap) sources and what to look for when buying. Title should reference the specific local product, not just "Shopping" or "Market visit".`
          }],
        });

        const textContent = response.content.find(c => c.type === "text");
        if (!textContent || textContent.type !== "text") {
          return res.status(500).json({ message: "No response from AI" });
        }

        let newActivity;
        try {
          const cleaned = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          newActivity = JSON.parse(cleaned);
        } catch {
          return res.status(422).json({ message: "AI returned invalid format. Please try again." });
        }

        const imageUrl = await fetchDestinationImage(newActivity.image_query || newActivity.title, newActivity.type || "culture");
        newActivity.image_url = imageUrl;

        if (!newActivity.travel_to_next || !nextTitle) {
          delete newActivity.travel_to_next;
        }

        day.activities[activityIndex] = newActivity;

        const updated = await storage.updateJourney(req.params.id, userId, { itinerary });
        return res.json(updated);
      }

      if (action === "remove") {
        if (activityIndex > 0 && removedActivity.travel_to_next) {
          day.activities[activityIndex - 1].travel_to_next = removedActivity.travel_to_next;
        }
        day.activities.splice(activityIndex, 1);
        if (day.activities.length > 0 && activityIndex === day.activities.length) {
          delete day.activities[day.activities.length - 1].travel_to_next;
        }
        const updated = await storage.updateJourney(req.params.id, userId, { itinerary });
        return res.json(updated);
      }

      return res.status(400).json({ message: "Invalid action. Use 'extend_previous', 'replace', or 'remove'" });
    } catch (error) {
      console.error("Error modifying activity:", error);
      res.status(500).json({ message: "Failed to modify activity" });
    }
  });

  app.post("/api/journeys/:id/generate-highlights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const journey = await storage.getJourney(req.params.id, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });

      const destinations = [
        journey.origin,
        ...(journey.destinations || []),
        journey.finalDestination,
      ].filter(Boolean) as string[];
      if (destinations.length === 0) {
        return res.status(400).json({ message: "No destinations set for this journey" });
      }

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: `For each of these travel destinations, provide curated local recommendations. Destinations: ${destinations.join(", ")}.

Return a JSON object with this exact structure (no markdown, no code fences, just raw JSON):
{
  "destinations": [
    {
      "name": "Destination Name",
      "must_see": [
        { "title": "Place Name", "description": "One-sentence why it's unmissable", "tip": "Insider tip", "confidence": 95, "review_query": "Place Name Destination Name" }
      ],
      "must_do": [
        { "title": "Activity Name", "description": "One-sentence what makes it special", "tip": "Insider tip", "confidence": 90, "review_query": "Activity Name Destination Name" }
      ],
      "must_eat": [
        { "title": "Dish or Restaurant Name", "description": "One-sentence about it", "tip": "Insider tip", "confidence": 92, "review_query": "Restaurant Name Destination Name" }
      ]
    }
  ]
}

Rules:
- Include 3-5 items per category per destination
- Focus on authentic local experiences, not tourist traps
- Tips should be practical insider knowledge
- Use REAL, VERIFIABLE places, restaurants, and activities that genuinely exist. Do not invent fictional establishments.
- Keep descriptions concise and compelling
- "confidence" is a number 0-100 representing how confident you are that this is a well-known, highly-rated, real recommendation. Only include items with confidence >= 80.
- "review_query" is a search-friendly name for looking up this place (e.g. "Cafe Central Vienna" or "Colosseum Rome"). Use the specific establishment name plus the city name.`
        }],
      });

      const textContent = response.content.find(c => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        return res.status(500).json({ message: "No response from AI" });
      }

      let highlights;
      try {
        const cleaned = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        highlights = JSON.parse(cleaned);
      } catch {
        return res.status(422).json({ message: "AI returned an invalid format. Please try again." });
      }

      if (!highlights?.destinations || !Array.isArray(highlights.destinations)) {
        return res.status(422).json({ message: "AI response is missing destination data. Please try again." });
      }

      const updated = await storage.updateJourney(req.params.id, userId, { highlights });
      res.json(updated);
    } catch (error) {
      console.error("Error generating highlights:", error);
      res.status(500).json({ message: "Failed to generate highlights" });
    }
  });

  // Past Trips CRUD
  app.get("/api/past-trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const trips = await storage.getPastTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching past trips:", error);
      res.status(500).json({ message: "Failed to fetch past trips" });
    }
  });

  app.post("/api/past-trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const parsed = insertPastTripSchema.parse({ ...req.body, userId });
      const trip = await storage.createPastTrip(parsed);
      res.status(201).json(trip);
    } catch (error: any) {
      console.error("Error creating past trip:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create past trip" });
    }
  });

  app.post("/api/past-trips/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const trips = req.body.trips.map((t: any) => insertPastTripSchema.parse({ ...t, userId }));
      const created = await storage.createPastTrips(trips);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Error bulk creating past trips:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create past trips" });
    }
  });

  app.delete("/api/past-trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      const deleted = await storage.deletePastTrip(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Trip not found" });
      res.json({ message: "Trip deleted" });
    } catch (error) {
      console.error("Error deleting past trip:", error);
      res.status(500).json({ message: "Failed to delete past trip" });
    }
  });

  app.post("/api/past-trips/ai-parse", isAuthenticated, async (req: any, res) => {
    try {
      const { csvText } = req.body;
      if (!csvText || typeof csvText !== "string") {
        return res.status(400).json({ message: "csvText is required" });
      }

      const hasMultipleTabs = csvText.includes("=== Tab:");
      let truncated: string;

      if (hasMultipleTabs) {
        const tabSections = csvText.split(/(?==== Tab:)/).filter(s => s.trim());
        const cleanedTabs: string[] = [];
        let totalRows = 0;

        for (const section of tabSections) {
          const lines = section.trim().split("\n");
          const tabHeader = lines[0];
          const tabCsv = lines.slice(1).join("\n").trim();
          if (!tabCsv) continue;

          const parsed_csv = Papa.parse(tabCsv, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
          });

          const rows = (parsed_csv.data as Record<string, string>[]).filter(row =>
            Object.values(row).some(v => v && String(v).trim() !== "")
          );
          if (rows.length === 0) continue;
          totalRows += rows.length;

          const headers = parsed_csv.meta.fields || Object.keys(rows[0] || {});
          const maxRows = Math.min(rows.length, 100);
          const sampledRows = rows.slice(0, maxRows);
          const rebuilt = [
            tabHeader,
            headers.join(","),
            ...sampledRows.map(row => headers.map(h => {
              const val = String(row[h] || "").trim();
              return val.includes(",") ? `"${val}"` : val;
            }).join(","))
          ].join("\n");
          cleanedTabs.push(rebuilt);
        }

        truncated = cleanedTabs.join("\n\n").slice(0, 80000);
        console.log(`AI Parse: multi-tab spreadsheet, ${tabSections.length} tabs, ${totalRows} total rows, sending ${truncated.length} chars to AI`);
      } else {
        const parsed_csv = Papa.parse(csvText.trim(), {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
        });

        const rows = (parsed_csv.data as Record<string, string>[]).filter(row =>
          Object.values(row).some(v => v && String(v).trim() !== "")
        );
        if (!rows || rows.length === 0) {
          return res.status(400).json({ message: "No data rows found in the file." });
        }

        const headers = parsed_csv.meta.fields || Object.keys(rows[0] || {});
        const maxRows = Math.min(rows.length, 200);
        const sampledRows = rows.slice(0, maxRows);

        const csvSummary = [
          headers.join(","),
          ...sampledRows.map(row => headers.map(h => {
            const val = String(row[h] || "").trim();
            return val.includes(",") ? `"${val}"` : val;
          }).join(","))
        ].join("\n");

        truncated = csvSummary.slice(0, 80000);
        console.log(`AI Parse: single sheet, ${rows.length} total rows, sending ${sampledRows.length} rows (${truncated.length} chars) to AI`);
      }

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: `You are a travel data extraction assistant. Parse the following spreadsheet data and extract travel trip information.

The data may come from a spreadsheet with MULTIPLE TABS (marked with "=== Tab: TabName ==="). Each tab may contain different destinations or trip details. Process ALL tabs.

IMPORTANT: Determine the logical structure of the trip(s). If multiple tabs appear to be part of ONE journey (e.g. tabs named "Bulgaria", "Serbia" for a Balkans trip, or tabs with itinerary details for different legs of the same trip), consolidate them into a SINGLE journey with multiple destinations. Only create separate journeys if the data clearly represents independent, unrelated trips.

The data may have ANY column names or format. Figure out which columns contain relevant travel data. Columns might be named "Place", "City", "Location", "Where", "Destination", "Budget", "Cost", "Notes", "Comments", etc. The tab names themselves may indicate destinations within the journey.

CRITICAL RULE: Only use data that is ACTUALLY PRESENT in the spreadsheet. Do NOT invent, fabricate, or estimate any values. If a field is not in the data, use null or omit it. The only exceptions are:
- lat/lng coordinates for well-known cities (these are factual, not estimates)
- destination_type category (factual classification)
- country name if clearly implied by the city name
- seasonality and logistics fields (these are factual reference information about the destination, not personal data)

Create journey JSON objects with these fields:

JOURNEY fields:
- title: A descriptive title based on the actual data. If multiple destinations are part of one trip, combine them (e.g. "Bulgaria & Serbia"). Do NOT invent flowery names — use the real place names from the data.
- dates: ONLY if dates exist in the data. Otherwise use null.
- days: ONLY if duration is in the data or calculable from dates. Otherwise use null.
- cost: ONLY if budget/cost/price data exists in the spreadsheet. Otherwise use null.
- status: Default to "Completed" unless the data clearly indicates a future trip.
- progress: 100 for completed, 0 for planning
- destinations: Array of ALL destination strings from ALL tabs that belong to this journey, e.g. ["Sofia, Bulgaria", "Belgrade, Serbia", "Nis, Serbia"]. Include every specific place, city, or stop mentioned.
- destination_type: One of: "city", "beach", "mountain", "historic", "nature", "desert", "coastal", "urban" (pick the dominant type)
- seasonality: JSON object with factual destination reference info for the primary destination:
  - best_months: array of best month names to visit
  - peak_season: string describing peak season
  - shoulder_season: string describing shoulder season
  - tip: A practical tip about when to visit
- logistics: JSON object with factual destination reference info:
  - travel_tips: array of 2-3 practical travel tips
  - visa: visa requirements for US travelers
  - currency: local currency name(s) and code(s) — list all if the journey spans multiple countries
  - timezone: timezone string(s)
  - language: primary language(s) spoken
  - budget_notes: ONLY include if budget info exists in the spreadsheet data. Otherwise omit this field entirely.
- notes: ONLY include notes/comments/ratings that are actually in the spreadsheet data. Do NOT fabricate notes.

PAST TRIP fields (for map pins — create one per unique city/place):
- destination: The city or place name from the data (required)
- country: The country (infer from city if obvious)
- startDate: ONLY if in the data, otherwise null
- endDate: ONLY if in the data, otherwise null
- notes: ONLY if in the data, otherwise null
- lat: Latitude for well-known cities (factual)
- lng: Longitude for well-known cities (factual)

Return a JSON object with two arrays:
{
  "journeys": [ ...journey objects... ],
  "pastTrips": [ ...pastTrip objects... ]
}

Rules:
- Consolidate related tabs/destinations into ONE journey when they are clearly part of the same trip
- Create a SEPARATE past trip entry (map pin) for each unique city/destination mentioned across all tabs
- NEVER fabricate costs, budgets, dates, durations, or personal notes
- Preserve ALL data from the original spreadsheet exactly as it appears
- Seasonality and logistics are factual reference data about destinations — these are OK to include
- Skip rows that don't appear to be travel destinations
- Return ONLY the JSON object, no other text

Data:
${truncated}`,
          },
        ],
      });

      const content = message.content[0];
      const responseText = content.type === "text" ? content.text : "";

      let parsed: any;
      try {
        const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        const rawJson = codeBlockMatch ? codeBlockMatch[1].trim() : responseText.trim();
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return res.status(422).json({ message: "Could not parse trips from the file. Try a different format." });
        }
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error("JSON parse error from AI response:", parseErr);
        return res.status(422).json({ message: "AI returned invalid data. Please try again." });
      }

      const userId = getUserId(req)!
      const createdJourneys: any[] = [];
      const createdPastTrips: any[] = [];

      if (Array.isArray(parsed.journeys) && parsed.journeys.length > 0) {
        const destLookups = parsed.journeys.map((j: any) => ({
          name: Array.isArray(j.destinations) && j.destinations.length > 0
            ? String(j.destinations[0])
            : j.title || "",
          type: String(j.destination_type || "city").toLowerCase(),
        }));
        const images = await fetchDestinationImages(destLookups);

        const journeyRecords: any[] = [];
        for (let idx = 0; idx < parsed.journeys.length; idx++) {
          const j = parsed.journeys[idx];
          const image = images[idx];

          const budgetNotes = j.logistics?.budget_notes || j.notes || null;
          const logistics = typeof j.logistics === "object" && j.logistics !== null
            ? { ...j.logistics, budget_notes: budgetNotes ? String(budgetNotes) : j.logistics.budget_notes || null }
            : null;

          const candidate = {
            userId,
            title: j.title ? String(j.title).trim() : "",
            dates: j.dates ? String(j.dates).trim() : null,
            days: j.days ? Math.max(1, Math.min(365, Number(j.days))) : null,
            cost: j.cost ? String(j.cost).trim() : null,
            status: ["Planning", "Completed", "Confirmed"].includes(j.status) ? j.status : "Completed",
            progress: j.status === "Completed" || j.progress === 100 ? 100 : Math.max(0, Math.min(100, Number(j.progress) || 0)),
            image,
            destinations: Array.isArray(j.destinations) ? j.destinations.map(String) : [],
            seasonality: typeof j.seasonality === "object" && j.seasonality !== null ? j.seasonality : null,
            priceAlert: null,
            logistics,
          };
          if (!candidate.title) continue;
          try {
            insertJourneySchema.parse(candidate);
            journeyRecords.push(candidate);
          } catch (validationErr) {
            console.warn("Skipping invalid journey from AI:", candidate.title, validationErr);
          }
        }

        if (journeyRecords.length > 0) {
          const created = await storage.createJourneys(journeyRecords);
          createdJourneys.push(...created);
        }
      }

      if (Array.isArray(parsed.pastTrips) && parsed.pastTrips.length > 0) {
        const parentJourneyId = createdJourneys.length > 0 ? createdJourneys[0].id : null;
        const tripRecords: any[] = [];
        for (const t of parsed.pastTrips) {
          const candidate = {
            userId,
            journeyId: parentJourneyId,
            destination: t.destination ? String(t.destination).trim() : "",
            country: t.country ? String(t.country).trim() : null,
            startDate: t.startDate ? String(t.startDate).trim() : null,
            endDate: t.endDate ? String(t.endDate).trim() : null,
            notes: t.notes ? String(t.notes).trim() : null,
            lat: t.lat ? String(t.lat) : null,
            lng: t.lng ? String(t.lng) : null,
          };
          if (!candidate.destination) continue;
          try {
            insertPastTripSchema.parse(candidate);
            tripRecords.push(candidate);
          } catch (validationErr) {
            console.warn("Skipping invalid past trip from AI:", candidate.destination, validationErr);
          }
        }

        if (tripRecords.length > 0) {
          const created = await storage.createPastTrips(tripRecords);
          createdPastTrips.push(...created);
        }
      }

      res.status(201).json({
        journeys: createdJourneys,
        pastTrips: createdPastTrips,
      });
    } catch (error: any) {
      console.error("Error in AI parse:", error);
      res.status(500).json({ message: "Failed to parse file with AI. Please try again." });
    }
  });

  // RSS Feed cache
  const rssParser = new Parser();
  const feedCache = new Map<string, { data: any[]; timestamp: number }>();
  const FEED_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  const RSS_FEEDS = [
    { url: "https://www.nomadicmatt.com/travel-blog/feed/", source: "Nomadic Matt" },
    { url: "https://thepointsguy.com/feed/", source: "The Points Guy" },
    { url: "https://www.adventurouskate.com/feed/", source: "Adventurous Kate" },
  ];

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
  }

  app.get("/api/community/feed", isAuthenticated, async (_req, res) => {
    try {
      const cacheKey = "community_feed";
      const cached = feedCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < FEED_CACHE_TTL) {
        return res.json(cached.data);
      }

      const allItems: any[] = [];
      const feedPromises = RSS_FEEDS.map(async ({ url, source }) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const feed = await rssParser.parseURL(url);
          clearTimeout(timeout);
          return (feed.items || []).map((item: any) => {
            const description = item.contentSnippet || item.content || item.summary || "";
            const strippedDesc = stripHtml(description).slice(0, 200);
            let imageUrl = null;
            if (item.enclosure?.url) {
              imageUrl = item.enclosure.url;
            } else if (item["media:content"]?.$.url) {
              imageUrl = item["media:content"].$.url;
            } else {
              const imgMatch = (item.content || item["content:encoded"] || "").match(/<img[^>]+src=["']([^"']+)["']/);
              if (imgMatch) imageUrl = imgMatch[1];
            }
            return {
              title: item.title || "",
              link: item.link || "",
              description: strippedDesc,
              pubDate: item.pubDate || item.isoDate || "",
              source,
              imageUrl,
            };
          });
        } catch (err) {
          console.error(`Failed to fetch RSS from ${source}:`, err);
          return [];
        }
      });

      const results = await Promise.all(feedPromises);
      for (const items of results) {
        allItems.push(...items);
      }

      allItems.sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime() || 0;
        const dateB = new Date(b.pubDate).getTime() || 0;
        return dateB - dateA;
      });

      const limited = allItems.slice(0, 30);
      feedCache.set(cacheKey, { data: limited, timestamp: Date.now() });
      res.json(limited);
    } catch (error) {
      console.error("Error fetching community feed:", error);
      res.status(500).json({ message: "Failed to fetch community feed" });
    }
  });

  const inspireCache = new Map<string, { data: any; timestamp: number }>();

  app.get("/api/inspire/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Qualifier params from the frontend
      const days           = parseInt(req.query.days as string) || 7;
      const transport      = (req.query.transport as string) || "either";
      const budget         = (req.query.budget    as string) || "midrange";
      const maxTravelHours = (req.query.maxTravelHours as string) || "any";

      const cacheKey = `inspire_${userId}_${days}_${transport}_${budget}_${maxTravelHours}`;
      const cached = inspireCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        return res.json(cached.data);
      }

      const journeys = await storage.getJourneys(userId);
      const pastTrips = await storage.getPastTrips(userId);

      const travelStyles = (user.travelStyles as string[]) || [];
      const homeLocation = user.homeLocation || "";
      const passportCountry = user.passportCountry || "";

      const visitedPlaces = [
        ...journeys.map(j => [j.origin, ...(j.destinations as string[] || []), j.finalDestination].filter(Boolean)).flat(),
        ...pastTrips.map(t => t.destination).filter(Boolean),
      ];
      const uniqueVisited = Array.from(new Set(visitedPlaces.filter((p): p is string => !!p)));

      // Human-readable qualifier descriptions for the prompt
      const durationDesc = days === 1
        ? "a single day trip (must return home the same evening)"
        : days === 21
        ? "an open-ended trip of 3 weeks or more"
        : `exactly ${days} day${days > 1 ? "s" : ""}`;

      const travelTimeDesc: Record<string, string> = {
        "2":   "a maximum of 2 hours total travel time each way (door-to-door including any drives to the airport)",
        "4":   "a maximum of 4 hours total travel time each way (including airport transfers, connections, and waits)",
        "8":   "up to 8 hours total travel time each way — a full day of travel is acceptable",
        "any": "no travel time limit — they are willing to travel as long as needed to reach the destination",
      };
      const travelTimeNote = travelTimeDesc[maxTravelHours] || travelTimeDesc["any"];

      // Factor in home airport — smaller airports often require connecting through a hub,
      // adding 1–3 hours to total travel time vs. flying from a major hub city.
      const homeAirportNote = homeLocation
        ? `IMPORTANT: The traveler's home is "${homeLocation}". When calculating travel time, factor in:
  1. Drive time from their home to the nearest airport (check if it's a regional or major hub)
  2. If it's a regional airport, add ~1–2 hours for likely connections through a hub (e.g. Atlanta, Charlotte, Dallas)
  3. Total door-to-door travel time must respect the traveler's stated maximum of ${maxTravelHours === "any" ? "unlimited" : maxTravelHours + " hours"}.
  Do NOT assume they live next to a major international hub unless their city actually has one.`
        : "";

      const transportDesc: Record<string, string> = {
        flying:  "flying (choose destinations whose total door-to-door travel time fits within the traveler's stated maximum)",
        driving: `driving only — destinations must be reachable by car from ${homeLocation || "their home"} within the traveler's stated travel time maximum`,
        either:  "open to flying or driving — choose whichever makes sense for each destination given the travel time constraint",
      };
      const budgetDesc: Record<string, string> = {
        budget:    "$50–100/day (backpacker / hostel / budget hotel style)",
        midrange:  "$100–250/day (comfortable hotels, good restaurants)",
        luxury:    "$300–600/day (high-end hotels, premium experiences)",
        unlimited: "unlimited — money is no object, recommend only the finest",
      };

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: `You are Marco, a world-class travel curator and dream-voyage architect. Generate 12 inspiring, personalized destination suggestions for this traveler. Think beyond the obvious — every suggestion must genuinely fit their constraints.

TRAVELER PROFILE:
- Home: ${homeLocation || "Not specified"}
- Passport: ${passportCountry || "Not specified"}
- Travel styles: ${travelStyles.length > 0 ? travelStyles.join(", ") : "Not specified"}
- Places already visited/planned: ${uniqueVisited.length > 0 ? uniqueVisited.join(", ") : "None yet"}

TRIP CONSTRAINTS (hard requirements — every suggestion MUST satisfy all of these):
- Duration: ${durationDesc}
- Max travel time: ${travelTimeNote}
- Transport: ${transportDesc[transport] || transportDesc.either}
- Budget: ${budgetDesc[budget] || budgetDesc.midrange}

${homeAirportNote}

RULES:
- Suggest destinations they have NOT already visited
- Each suggestion must be a SPECIFIC destination (city, region, or unique place) — not a country
- Every suggestion must realistically fit the duration, transport, travel time, and budget constraints above
- If transport is "driving", ALL suggestions must be within driving distance of their home within their stated travel time
- avg_daily_budget values must match the budget bracket (budget ≤$100, midrange $100–250, luxury $300+)
- Include a diverse mix; if transport is "flying" spread across different continents where travel time allows
- All data must be REAL — real places, accurate coordinates, factual descriptions
- Categories must be one of: "Adventure", "Culture", "Food & Drink", "Nature", "Urban", "Beach", "Wellness"

Return ONLY a JSON array (no markdown, no code fences):
[
  {
    "title": "Destination Name",
    "country": "Country",
    "category": "One of the categories above",
    "description": "2-3 sentence vivid description of what makes this place special",
    "best_months": "e.g. April–October",
    "avg_daily_budget": "e.g. $80-120",
    "tags": ["3-4 relevant tags"],
    "lat": 0.0000,
    "lng": 0.0000,
    "image_query": "Wikipedia article title for this specific place (e.g. 'Hallstatt', 'Chefchaouen', 'Luang_Prabang')",
    "why_for_you": "One sentence explaining why Marco picked this given their duration, transport, budget, and travel style"
  }
]`
        }],
      });

      const textContent = response.content.find(c => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        return res.status(500).json({ message: "No response from AI" });
      }

      let suggestions;
      try {
        const cleaned = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        suggestions = JSON.parse(cleaned);
      } catch {
        return res.status(422).json({ message: "AI returned invalid format. Please try again." });
      }

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return res.status(422).json({ message: "No suggestions generated. Please try again." });
      }

      const CONCURRENCY = 5;
      for (let i = 0; i < suggestions.length; i += CONCURRENCY) {
        const batch = suggestions.slice(i, i + CONCURRENCY);
        const images = await Promise.all(
          batch.map((s: any) => fetchDestinationImage(s.image_query || s.title, s.category?.toLowerCase() || "city"))
        );
        for (let j = 0; j < batch.length; j++) {
          batch[j].image_url = images[j];
        }
      }

      const result = { suggestions, generatedAt: new Date().toISOString() };
      inspireCache.set(cacheKey, { data: result, timestamp: Date.now() });
      res.json(result);
    } catch (error) {
      console.error("Error generating inspire suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.post("/api/inspire/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      // Clear all qualifier variants for this user
      for (const key of inspireCache.keys()) {
        if (key.startsWith(`inspire_${userId}`)) inspireCache.delete(key);
      }
      res.json({ cleared: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh" });
    }
  });

  // ── Day Trips ─────────────────────────────────────────────────────────────

  const dayTripCache = new Map<string, { data: any; timestamp: number }>();

  app.get("/api/inspire/day-trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.homeLocation) {
        return res.status(400).json({
          message: "Set your home location in Settings so Marco can find day trips near you.",
        });
      }

      // Mobile can pass current GPS coords; falls back to home location geocoding
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const rawLocation = (req.query.locationLabel as string) || user.homeLocation;
      // Append country for unambiguous geocoding (e.g. "Jacksonville" → "Jacksonville, United States")
      const locationLabel = (user.passportCountry && !rawLocation.includes(","))
        ? `${rawLocation}, ${user.passportCountry}`
        : rawLocation;
      // Round coords to 2 decimal places (~1km) for cache key
      const coordKey = lat && lng ? `_${lat.toFixed(2)}_${lng.toFixed(2)}` : "";
      const cacheKey = `daytrips_${userId}${coordKey}`;
      const cached = dayTripCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
        return res.json(cached.data);
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.error("[day-trips] GOOGLE_PLACES_API_KEY is not set");
        return res.status(503).json({ message: "Day trips are not configured on this server (missing API key)." });
      }

      // Test geocoding first so we can give a specific error if it fails
      const resolvedCoords = (lat && lng) ? { lat, lng } : await (async () => {
        const { geocodeLocation } = await import("./services/places");
        const coords = await geocodeLocation(locationLabel);
        if (!coords) console.error("[day-trips] Geocoding failed for:", locationLabel);
        return coords;
      })();

      if (!resolvedCoords) {
        return res.status(400).json({
          message: `Marco couldn't find "${locationLabel}" on the map. Check that your home location in Settings is a real city or address.`,
        });
      }

      const travelStyles = (user.travelStyles as string[]) || [];
      const results = await searchDayTrips({
        homeLocation: locationLabel,
        homeCoords: resolvedCoords,
        travelStyles,
      });

      if (!results.length) {
        return res.status(404).json({
          message: "No highly-rated attractions found within 2.5 hours of your home. Try updating your home location in Settings.",
        });
      }

      const result = { dayTrips: results, homeLocation: locationLabel, generatedAt: new Date().toISOString() };
      dayTripCache.set(cacheKey, { data: result, timestamp: Date.now() });
      res.json(result);
    } catch (error) {
      console.error("Error fetching day trips:", error);
      res.status(500).json({ message: "Failed to fetch day trips" });
    }
  });

  // Bookmarks CRUD
  app.get("/api/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const results = await storage.getBookmarks(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = insertBookmarkSchema.parse({ ...req.body, userId });
      const bookmark = await storage.createBookmark(parsed);
      res.status(201).json(bookmark);
    } catch (error: any) {
      console.error("Error creating bookmark:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const deleted = await storage.deleteBookmark(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Bookmark not found" });
      res.json({ message: "Bookmark deleted" });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  app.post("/api/packing-list/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { destination, origin, dates, duration, activities, gender, journeyId } = req.body;
      if (!destination && !journeyId) {
        return res.status(400).json({ message: "Destination or journey is required" });
      }

      const userId = getUserId(req)!;
      const user = await storage.getUser(userId);

      const contextParts: string[] = [];
      let itineraryContext = "";

      if (journeyId) {
        const journey = await storage.getJourney(journeyId, userId);
        if (journey) {
          const allStops = [journey.origin, ...(journey.destinations || []), journey.finalDestination].filter(Boolean);
          if (allStops.length > 0) contextParts.push(`Destinations: ${allStops.join(" → ")}`);
          if (journey.origin) contextParts.push(`Starting from: ${journey.origin}`);
          if (journey.finalDestination) contextParts.push(`Ending at: ${journey.finalDestination}`);
          if (journey.days) contextParts.push(`Duration: ${journey.days} days`);
          if (journey.cost) contextParts.push(`Budget: ${journey.cost}`);
          if (journey.dates) contextParts.push(`Travel dates: ${journey.dates}`);
          const jTravelMode = (journey as any).travelMode;
          if (jTravelMode && jTravelMode !== "mixed") {
            const modeLabels: Record<string, string> = {
              drive: "Road trip (driving)",
              fly: "Flying between cities",
              train: "Train travel",
              bus: "Bus/coach travel",
              ferry: "Ferry/boat travel",
            };
            contextParts.push(`Travel mode: ${modeLabels[jTravelMode] || jTravelMode}`);
          }

          const itinerary = journey.itinerary as any;
          if (itinerary?.days && Array.isArray(itinerary.days)) {
            const dayDescriptions = itinerary.days.map((day: any) => {
              const loc = day.location || "Unknown";
              const acts = (day.activities || []).map((a: any) =>
                `${a.title} (${a.type}${a.duration ? ", " + a.duration : ""})`
              ).join("; ");
              const hotels = (day.hotels || []).map((h: any) => h.name).join(", ");
              let desc = `Day ${day.day} - ${loc}: ${acts}`;
              if (hotels) desc += ` | Hotels: ${hotels}`;
              return desc;
            });
            itineraryContext = `\n\nDETAILED ITINERARY (pack specifically for these activities and locations):\n${dayDescriptions.join("\n")}`;
          }
        }
      }

      if (origin) contextParts.push(`Traveling from: ${origin}`);
      if (destination) contextParts.push(`Destination: ${destination}`);
      if (dates) contextParts.push(`Travel dates: ${dates}`);
      if (duration) contextParts.push(`Duration: ${duration} days`);
      if (activities && activities.length > 0) contextParts.push(`Activities: ${activities.join(", ")}`);
      if (gender && gender !== "prefer-not-to-say") contextParts.push(`Traveler gender: ${gender}`);
      if (user?.temperatureUnit) contextParts.push(`Preferred temperature unit: ${user.temperatureUnit === "C" ? "Celsius" : "Fahrenheit"}`);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a smart packing assistant. Generate a comprehensive, personalized packing checklist for this trip:

${contextParts.join("\n")}${itineraryContext}

Return a JSON object with a "categories" array. Each category has:
- name: category name (Clothing, Toiletries, Electronics, Documents, Health, Accessories)
- icon: icon identifier (shirt, droplets, zap, file-text, heart, watch)
- items: array of items, each with:
  - name: item name
  - quantity: number to pack
  - reason: brief reason why this item is needed for THIS specific trip
  - weight_grams: estimated weight PER UNIT in grams (be realistic — e.g., t-shirt ~180g, laptop ~1500g, toothbrush ~30g, passport ~50g, jeans ~850g, phone charger ~80g, sunscreen bottle ~200g)

Tailor items to the destination's climate, culture, and planned activities. Be specific (e.g., "Light rain jacket" not just "Jacket"). Include destination-specific items (power adapters, modest clothing for temples, etc.).${itineraryContext ? "\nIMPORTANT: You have the full day-by-day itinerary above. Use it to recommend items specific to the planned activities (e.g., comfortable walking shoes for walking tours, swimwear if there's a beach day, formal attire if there's a fine dining reservation, hiking gear for nature activities). Reference specific activities in your 'reason' field." : ""}
${contextParts.some(p => p.includes("Road trip")) ? "\nROAD TRIP PACKING: Since they are driving, there are NO airline liquid restrictions or carry-on size limits. They can pack more freely — include car-specific items (phone mount/charger, snacks, cooler bag, sunglasses, emergency car kit, reusable water bottle). They have more luggage flexibility so suggest full-size toiletries instead of travel-size." : ""}

Return ONLY the JSON object, no other text.`,
          },
        ],
      });

      const content = message.content[0];
      const responseText = content.type === "text" ? content.text : "";

      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const rawJson = codeBlockMatch ? codeBlockMatch[1].trim() : responseText.trim();
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(422).json({ message: "Failed to generate packing list. Please try again." });
      }

      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } catch (error) {
      console.error("Error generating packing list:", error);
      res.status(500).json({ message: "Failed to generate packing list" });
    }
  });

  app.post("/api/journeys/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!
      if (!Array.isArray(req.body.journeys)) {
        return res.status(400).json({ message: "journeys array is required" });
      }
      const journeyList = req.body.journeys.map((j: any) =>
        insertJourneySchema.parse({ ...j, userId })
      );
      const created = await storage.createJourneys(journeyList);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Error bulk creating journeys:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid journey data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create journeys" });
    }
  });

  app.get("/api/packing-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const lists = await storage.getPackingLists(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching packing lists:", error);
      res.status(500).json({ message: "Failed to fetch packing lists" });
    }
  });

  app.get("/api/packing-lists/latest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const lists = await storage.getPackingLists(userId);
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.json(lists[0] || null);
    } catch (error) {
      console.error("Error fetching latest packing list:", error);
      res.status(500).json({ message: "Failed to fetch packing list" });
    }
  });

  app.post("/api/packing-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { destination, origin, startDate, endDate, activities, categories, journeyId } = req.body;
      if (!destination || !categories) {
        return res.status(400).json({ message: "Destination and categories are required" });
      }
      const created = await storage.createPackingList({
        userId,
        destination,
        origin: origin || null,
        startDate: startDate || null,
        endDate: endDate || null,
        activities: activities || [],
        categories,
        journeyId: journeyId || null,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating packing list:", error);
      res.status(500).json({ message: "Failed to save packing list" });
    }
  });

  app.put("/api/packing-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { categories } = req.body;
      if (!categories) {
        return res.status(400).json({ message: "Categories are required" });
      }
      const updated = await storage.updatePackingList(req.params.id, userId, { categories });
      if (!updated) return res.status(404).json({ message: "Packing list not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating packing list:", error);
      res.status(500).json({ message: "Failed to update packing list" });
    }
  });

  app.delete("/api/packing-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const deleted = await storage.deletePackingList(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Packing list not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting packing list:", error);
      res.status(500).json({ message: "Failed to delete packing list" });
    }
  });

  // Travel Intelligence generation
  const intelCache = new Map<string, { data: any; timestamp: number }>();
  const INTEL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  app.post("/api/intel/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { journeyId } = req.body;
      if (!journeyId) return res.status(400).json({ message: "journeyId is required" });

      const journey = await storage.getJourney(journeyId, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });

      const cacheKey = `intel_${journeyId}`;
      const cached = intelCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < INTEL_CACHE_TTL) {
        return res.json(cached.data);
      }

      const allStops = [journey.origin, ...(journey.destinations || []), journey.finalDestination].filter(Boolean);
      const destStr = allStops.join(", ") || "unspecified destination";

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: `Generate accurate travel intelligence for a trip to: ${destStr}

Return a JSON object (no markdown, no code fences, just raw JSON):
{
  "emergency_number": "the actual emergency number(s) for these countries",
  "emergency_note": "one sentence about emergency services",
  "etiquette": ["3-5 specific cultural rules or norms for these destinations"],
  "safety": ["2-3 specific safety tips relevant to these destinations"],
  "phrases": [
    { "english": "Hello", "local": "local script", "transliteration": "pronunciation", "language": "Language name" },
    { "english": "Thank you", "local": "local script", "transliteration": "pronunciation", "language": "Language name" },
    { "english": "Please", "local": "local script", "transliteration": "pronunciation", "language": "Language name" },
    { "english": "Yes", "local": "local script", "transliteration": "pronunciation", "language": "Language name" },
    { "english": "No", "local": "local script", "transliteration": "pronunciation", "language": "Language name" },
    { "english": "Excuse me", "local": "local script", "transliteration": "pronunciation", "language": "Language name" }
  ],
  "languages": ["primary language(s) spoken at the destinations"]
}

Rules:
- All information must be REAL and ACCURATE
- For phrases: use the actual native script/alphabet for the "local" field
- For multi-country trips: include phrases for each country's primary language
- Emergency number must be the actual number used in these countries
- Etiquette must be specific to these destinations' culture, not generic
- Return ONLY the JSON object, no other text`,
        }],
      });

      const textContent = response.content.find(c => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        return res.status(500).json({ message: "No response from AI" });
      }

      let intel;
      try {
        const cleaned = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        intel = JSON.parse(jsonMatch[0]);
      } catch {
        return res.status(422).json({ message: "AI returned invalid format. Please try again." });
      }

      intelCache.set(cacheKey, { data: intel, timestamp: Date.now() });
      res.json(intel);
    } catch (error) {
      console.error("Error generating travel intel:", error);
      res.status(500).json({ message: "Failed to generate travel intelligence" });
    }
  });

  const smsRateLimit = new Map<string, number>();

  app.post("/api/send-packing-sms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const now = Date.now();
      const lastSent = smsRateLimit.get(userId) || 0;
      if (now - lastSent < 60000) {
        return res.status(429).json({ message: "Please wait a minute before sending another text" });
      }

      const { phoneNumber } = req.body;
      if (!phoneNumber || typeof phoneNumber !== "string") {
        return res.status(400).json({ message: "Phone number is required" });
      }

      let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, "");
      if (!cleaned.startsWith("+")) {
        if (cleaned.length === 10) cleaned = "+1" + cleaned;
        else if (cleaned.length === 11 && cleaned.startsWith("1")) cleaned = "+" + cleaned;
        else cleaned = "+" + cleaned;
      }
      if (!/^\+\d{10,15}$/.test(cleaned)) {
        return res.status(400).json({ message: "Please enter a valid phone number with country code (e.g. +1 555 123 4567)" });
      }

      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const packingUrl = `${protocol}://${host}/packing`;

      smsRateLimit.set(userId, now);

      const body = `📋 Your Voyager Packing List is ready!\n\nOpen it on your phone to check off items as you pack:\n${packingUrl}\n\n— Voyager: Travel Without Limits`;

      await sendSms(cleaned, body);
      res.json({ success: true, message: "SMS sent successfully" });
    } catch (error: any) {
      console.error("Error sending packing SMS:", error);
      const code = error.code || error.status;
      let userMsg = "Failed to send SMS. Please try again.";
      if (code === 20003 || (error.message && error.message.includes("Authenticate"))) {
        userMsg = "SMS service authentication error. The Twilio connection may need to be reconfigured.";
      } else if (code === 21211 || (error.message && error.message.includes("not valid"))) {
        userMsg = "That phone number doesn't appear to be valid. Please check and try again.";
      } else if (error.message) {
        userMsg = error.message;
      }
      res.status(500).json({ message: userMsg });
    }
  });

  // ── Photo upload routes ──────────────────────────────────────────────────────

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Only image files are allowed"));
    },
  });

  // GET /api/journeys/:id/photos
  app.get("/api/journeys/:id/photos", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const journeyId = String(req.params.id);
      const journey = await storage.getJourney(journeyId, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });
      const photos = await storage.getJourneyPhotos(journeyId);
      res.json(photos);
    } catch (err) {
      console.error("Error fetching photos:", err);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // POST /api/journeys/:id/photos  (multipart, field name "photos", up to 20 files)
  app.post("/api/journeys/:id/photos", isAuthenticated, upload.array("photos", 20), async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const journeyId = String(req.params.id);
      const journey = await storage.getJourney(journeyId, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "No files uploaded" });

      const results = await Promise.all(files.map(async (file) => {
        // Parse EXIF for GPS and original date
        let lat: number | undefined;
        let lng: number | undefined;
        let takenAt: Date | undefined;
        try {
          const tags = ExifReader.load(file.buffer);
          if (tags.GPSLatitude && tags.GPSLongitude) {
            const latVal = Number(tags.GPSLatitude.description);
            const lngVal = Number(tags.GPSLongitude.description);
            const latRef = String(tags.GPSLatitudeRef?.description ?? "N");
            const lngRef = String(tags.GPSLongitudeRef?.description ?? "E");
            lat = latRef === "S" ? -latVal : latVal;
            lng = lngRef === "W" ? -lngVal : lngVal;
          }
          if (tags.DateTimeOriginal?.description) {
            const raw = String(tags.DateTimeOriginal.description);
            // EXIF date format: "YYYY:MM:DD HH:MM:SS"
            const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
            const parsed = new Date(normalized);
            if (!isNaN(parsed.getTime())) takenAt = parsed;
          }
        } catch {
          // EXIF parsing is best-effort; continue without it
        }

        const uploaded = await photoProvider.upload(file.buffer, file.originalname, `voyager/journeys/${journeyId}`);

        return storage.createJourneyPhoto({
          journeyId,
          userId,
          cloudinaryPublicId: uploaded.publicId,
          url: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl,
          lat: lat ?? null,
          lng: lng ?? null,
          takenAt: takenAt ?? null,
          caption: null,
          dayIndex: null,
        });
      }));

      res.status(201).json(results);
    } catch (err: any) {
      console.error("Error uploading photos:", err);
      res.status(500).json({ message: err.message || "Failed to upload photos" });
    }
  });

  // PATCH /api/journeys/:journeyId/photos/:photoId
  app.patch("/api/journeys/:journeyId/photos/:photoId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { caption, dayIndex } = req.body;
      const updated = await storage.updateJourneyPhoto(String(req.params.photoId), userId, {
        caption: caption ?? undefined,
        dayIndex: dayIndex ?? undefined,
      });
      if (!updated) return res.status(404).json({ message: "Photo not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating photo:", err);
      res.status(500).json({ message: "Failed to update photo" });
    }
  });

  // DELETE /api/journeys/:journeyId/photos/:photoId
  app.delete("/api/journeys/:journeyId/photos/:photoId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const deleted = await storage.deleteJourneyPhoto(String(req.params.photoId), userId);
      if (!deleted) return res.status(404).json({ message: "Photo not found" });
      // Remove from Cloudinary (fire and forget — don't fail the request if CDN delete fails)
      photoProvider.delete(deleted.cloudinaryPublicId).catch((err) =>
        console.error("Cloudinary delete failed:", err)
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting photo:", err);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // ── Voyages ──────────────────────────────────────────────────────────────

  // GET /api/voyages — list all voyages for current user
  app.get("/api/voyages", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const list = await storage.getVoyages(userId);
      res.json(list);
    } catch (err) {
      console.error("Error fetching voyages:", err);
      res.status(500).json({ message: "Failed to fetch voyages" });
    }
  });

  // POST /api/voyages — create / open a new voyage (called by mobile app when geofence exit detected)
  app.post("/api/voyages", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      // Close any lingering active voyage first
      const active = await storage.getActiveVoyage(userId);
      if (active) {
        await storage.updateVoyage(active.id, userId, {
          status: "completed",
          endedAt: new Date(),
        });
      }
      const { startLocation, currentLocation, distanceMiles } = req.body;
      const voyage = await storage.createVoyage({
        userId,
        status: "active",
        startLocation: startLocation ?? null,
        currentLocation: currentLocation ?? startLocation ?? null,
        distanceMiles: distanceMiles ?? null,
        startedAt: new Date(),
      });
      res.status(201).json(voyage);
    } catch (err) {
      console.error("Error creating voyage:", err);
      res.status(500).json({ message: "Failed to create voyage" });
    }
  });

  // PATCH /api/voyages/:id — update location / notes on an active voyage
  app.patch("/api/voyages/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { currentLocation, distanceMiles, notes } = req.body;
      const updated = await storage.updateVoyage(String(req.params.id), userId, {
        ...(currentLocation !== undefined && { currentLocation }),
        ...(distanceMiles !== undefined && { distanceMiles }),
        ...(notes !== undefined && { notes }),
      });
      if (!updated) return res.status(404).json({ message: "Voyage not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating voyage:", err);
      res.status(500).json({ message: "Failed to update voyage" });
    }
  });

  // POST /api/voyages/close — close the user's currently active voyage (used by mobile background task)
  app.post("/api/voyages/close", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const active = await storage.getActiveVoyage(userId);
      if (!active) return res.status(404).json({ message: "No active voyage" });
      const { notes, distanceMiles } = req.body;
      const updated = await storage.updateVoyage(active.id, userId, {
        status: "completed",
        endedAt: new Date(),
        ...(notes !== undefined && { notes }),
        ...(distanceMiles !== undefined && { distanceMiles }),
      });
      res.json(updated);
    } catch (err) {
      console.error("Error closing active voyage:", err);
      res.status(500).json({ message: "Failed to close voyage" });
    }
  });

  // POST /api/voyages/:id/close — mark a voyage as completed (geofence return)
  app.post("/api/voyages/:id/close", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { notes, distanceMiles } = req.body;
      const updated = await storage.updateVoyage(String(req.params.id), userId, {
        status: "completed",
        endedAt: new Date(),
        ...(notes !== undefined && { notes }),
        ...(distanceMiles !== undefined && { distanceMiles }),
      });
      if (!updated) return res.status(404).json({ message: "Voyage not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error closing voyage:", err);
      res.status(500).json({ message: "Failed to close voyage" });
    }
  });

  // ── Push Notifications ───────────────────────────────────────────────────

  // POST /api/push/register — store Expo push token for the current user
  app.post("/api/push/register", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "token is required" });
      }
      await storage.updateUser(userId, { expoPushToken: token });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error registering push token:", err);
      res.status(500).json({ message: "Failed to register push token" });
    }
  });

  return httpServer;
}
