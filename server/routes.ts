import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, getUserId } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { insertJourneySchema, insertPastTripSchema, insertBookmarkSchema, updateUserSettingsSchema, type User } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import Papa from "papaparse";
import Parser from "rss-parser";

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
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
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

async function fetchDestinationImage(destinationName: string, fallbackType: string): Promise<string> {
  const fallback = DESTINATION_FALLBACK_IMAGES[fallbackType] || DESTINATION_FALLBACK_IMAGES.city;
  try {
    const searchTerm = destinationName.split(",")[0].trim();
    if (!searchTerm) return fallback;

    if (imageCache.has(searchTerm.toLowerCase())) {
      return imageCache.get(searchTerm.toLowerCase())!;
    }

    const encoded = encodeURIComponent(searchTerm);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
      headers: { "User-Agent": "Voyager-Travel-App/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) return fallback;
    const data = await resp.json() as any;
    const isPhoto = (url: string) => /\.(jpg|jpeg|png)/i.test(url);
    const origUrl = data.originalimage?.source;
    const thumbUrl = data.thumbnail?.source;
    let result = fallback;
    if (origUrl && isPhoto(origUrl)) result = origUrl;
    else if (thumbUrl && isPhoto(thumbUrl)) result = thumbUrl;

    imageCache.set(searchTerm.toLowerCase(), result);
    return result;
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
      if (!data.image && data.destinations?.length > 0) {
        const dest = data.destinations[0];
        data.image = await fetchDestinationImage(dest, "city");
      }
      const parsed = insertJourneySchema.parse(data);
      const journey = await storage.createJourney(parsed);
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
      const destinations = journey.destinations?.join(", ") || "unspecified destination";
      const days = journey.days || 7;
      const budget = journey.cost || "flexible";
      const currency = user?.currency || "USD";

      const anthropicClient = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      const response = await anthropicClient.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: `Create a detailed day-by-day travel itinerary for a ${days}-day trip to ${destinations}. Budget: ${budget} ${currency}.

Return a JSON object with this exact structure (no markdown, no code fences, just raw JSON):
{
  "days": [
    {
      "day": 1,
      "date_label": "Day 1",
      "location": "City Name",
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
          "lng": 23.3219
        }
      ]
    }
  ],
  "summary": "Brief trip summary"
}

Include 3-5 activities per day with realistic times, real places, accurate coordinates (lat/lng), cost estimates, and insider tips. Cover a mix of culture, food, logistics (arrival/departure), nature, and local experiences. Use the actual correct coordinates for each place.`
        }],
      });

      const textContent = response.content.find(c => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        return res.status(500).json({ message: "No response from AI" });
      }

      let itinerary;
      try {
        const cleaned = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
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
        if (!day.location) day.location = "Unknown";
        if (!day.day) day.day = itinerary.days.indexOf(day) + 1;
        if (!day.date_label) day.date_label = `Day ${day.day}`;
      }

      const updated = await storage.updateJourney(req.params.id, userId, { itinerary });
      res.json(updated);
    } catch (error) {
      console.error("Error generating itinerary:", error);
      res.status(500).json({ message: "Failed to generate itinerary" });
    }
  });

  app.post("/api/journeys/:id/generate-highlights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const journey = await storage.getJourney(req.params.id, userId);
      if (!journey) return res.status(404).json({ message: "Journey not found" });

      const destinations = journey.destinations || [];
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
        { "title": "Place Name", "description": "One-sentence why it's unmissable", "tip": "Insider tip" }
      ],
      "must_do": [
        { "title": "Activity Name", "description": "One-sentence what makes it special", "tip": "Insider tip" }
      ],
      "must_eat": [
        { "title": "Dish or Restaurant Name", "description": "One-sentence about it", "tip": "Insider tip" }
      ]
    }
  ]
}

Rules:
- Include 3-5 items per category per destination
- Focus on authentic local experiences, not tourist traps
- Tips should be practical insider knowledge
- Use real places, dishes, and activities
- Keep descriptions concise and compelling`
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
      const { destination, origin, dates, duration, activities, gender } = req.body;
      if (!destination) {
        return res.status(400).json({ message: "Destination is required" });
      }

      const userId = getUserId(req)!;
      const user = await storage.getUser(userId);

      const contextParts: string[] = [];
      if (origin) contextParts.push(`Traveling from: ${origin}`);
      contextParts.push(`Destination: ${destination}`);
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

${contextParts.join("\n")}

Return a JSON object with a "categories" array. Each category has:
- name: category name (Clothing, Toiletries, Electronics, Documents, Health, Accessories)
- icon: icon identifier (shirt, droplets, zap, file-text, heart, watch)
- items: array of items, each with:
  - name: item name
  - quantity: number to pack
  - reason: brief reason why this item is needed for THIS specific trip

Tailor items to the destination's climate, culture, and planned activities. Be specific (e.g., "Light rain jacket" not just "Jacket"). Include destination-specific items (power adapters, modest clothing for temples, etc.).

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

  return httpServer;
}
