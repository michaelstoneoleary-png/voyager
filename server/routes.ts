import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertJourneySchema, insertPastTripSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";

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

  // Journeys CRUD
  app.get("/api/journeys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const journeys = await storage.getJourneys(userId);
      res.json(journeys);
    } catch (error) {
      console.error("Error fetching journeys:", error);
      res.status(500).json({ message: "Failed to fetch journeys" });
    }
  });

  app.get("/api/journeys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const parsed = insertJourneySchema.parse({ ...req.body, userId });
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteJourney(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Journey not found" });
      res.json({ message: "Journey deleted" });
    } catch (error) {
      console.error("Error deleting journey:", error);
      res.status(500).json({ message: "Failed to delete journey" });
    }
  });

  // Past Trips CRUD
  app.get("/api/past-trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trips = await storage.getPastTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching past trips:", error);
      res.status(500).json({ message: "Failed to fetch past trips" });
    }
  });

  app.post("/api/past-trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

      const truncated = csvText.slice(0, 15000);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: `You are a travel data extraction assistant. Parse the following spreadsheet/CSV data and extract travel trip information.

The data may have ANY column names or format. Figure out which columns contain relevant travel data. Columns might be named "Place", "City", "Location", "Where", "Destination", "Budget", "Cost", "Notes", "Comments", etc.

CRITICAL RULE: Only use data that is ACTUALLY PRESENT in the spreadsheet. Do NOT invent, fabricate, or estimate any values. If a field is not in the data, use null or omit it. The only exceptions are:
- lat/lng coordinates for well-known cities (these are factual, not estimates)
- destination_type category (factual classification)
- country name if clearly implied by the city name
- seasonality and logistics fields (these are factual reference information about the destination, not personal data)

For EACH trip found, create a JSON object with these fields:

JOURNEY fields:
- title: Use the destination name from the data as-is, e.g. "Paris, France" or "Tokyo, Japan" (required). Do NOT invent creative titles.
- dates: ONLY if dates exist in the data. Otherwise use null.
- days: ONLY if duration is in the data or calculable from dates. Otherwise use null.
- cost: ONLY if budget/cost/price data exists in the spreadsheet. Otherwise use null.
- status: Default to "Completed" unless the data clearly indicates a future trip.
- progress: 100 for completed, 0 for planning
- destinations: Array of destination strings from the data like ["Paris, France"]
- destination_type: One of: "city", "beach", "mountain", "historic", "nature", "desert", "coastal", "urban"
- seasonality: JSON object with factual destination reference info:
  - best_months: array of best month names to visit
  - peak_season: string describing peak season
  - shoulder_season: string describing shoulder season
  - tip: A practical tip about when to visit
- logistics: JSON object with factual destination reference info:
  - travel_tips: array of 2-3 practical travel tips
  - visa: visa requirements for US travelers
  - currency: local currency name and code
  - timezone: timezone string
  - language: primary language spoken
  - budget_notes: ONLY include if budget info exists in the spreadsheet data. Otherwise omit this field entirely.
- notes: ONLY include notes/comments/ratings that are actually in the spreadsheet data. Do NOT fabricate notes.

PAST TRIP fields (for map pins):
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
- Every imported row should create BOTH a journey AND a past trip entry
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

      const userId = req.user.claims.sub;
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
        const tripRecords: any[] = [];
        for (const t of parsed.pastTrips) {
          const candidate = {
            userId,
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

  app.post("/api/journeys/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
