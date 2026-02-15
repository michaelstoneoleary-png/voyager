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
            content: `You are a premium travel curator data extraction assistant. Parse the following spreadsheet/CSV data and extract travel trip information.

The data may have ANY column names or format. Figure out which columns contain relevant travel data. Columns might be named "Place", "City", "Location", "Where", "Destination", "Budget", "Cost", "Notes", "Comments", etc.

For EACH trip found, create a JSON object with these fields:

JOURNEY fields (for creating a full trip plan):
- title: A compelling, editorial journey title, e.g. "Parisian Sojourn" or "Mediterranean Escape" (required)
- dates: Date range string like "Jun 15 - Jun 22, 2024" or "Flexible (7 days)" if no exact dates
- days: Number of days (integer, calculate from dates if possible, or estimate based on destination)
- cost: Budget string like "$2,500" — use any budget/cost/price data from the spreadsheet, or provide a realistic estimate for the destination and duration
- status: "Completed" for past trips, "Planning" for future trips
- progress: 100 for completed, 0 for planning
- destinations: Array of destination strings like ["Paris, France", "Lyon, France"]
- destination_type: One of these categories that best describes the destination: "city", "beach", "mountain", "historic", "nature", "desert", "coastal", "urban" (used to select a matching photo)
- seasonality: JSON object with:
  - best_months: array of best month names to visit
  - peak_season: string describing peak season
  - shoulder_season: string describing shoulder season
  - tip: A curated insider tip about when to visit
- logistics: JSON object with:
  - travel_tips: array of 2-3 practical travel tips
  - visa: visa requirements for US travelers
  - currency: local currency name and code
  - timezone: timezone string
  - language: primary language spoken
  - budget_notes: any budget-related notes, deals, or cost warnings from the data
- notes: any special notes, comments, ratings, or personal annotations from the spreadsheet data

PAST TRIP fields (for the travel history timeline and map):
- destination: The city or place name (required)
- country: The country
- startDate: When the trip started
- endDate: When the trip ended
- notes: Any notes, comments, ratings, or special details from the data
- lat: Latitude (provide for well-known cities even if not in data)
- lng: Longitude (provide for well-known cities even if not in data)

Return a JSON object with two arrays:
{
  "journeys": [ ...journey objects... ],
  "pastTrips": [ ...pastTrip objects... ]
}

Rules:
- Every imported row should create BOTH a journey AND a past trip entry
- ALWAYS preserve any budget, cost, price, notes, comments, ratings, or special annotations from the original data
- For well-known cities, always provide lat/lng coordinates
- For seasonality, use your knowledge of the destination's climate and tourism patterns
- For logistics, include practical, actionable travel information
- For destination_type, choose the category that best represents the primary vibe of the destination
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
        const DESTINATION_IMAGES: Record<string, string> = {
          city: "/images/destinations/city.jpg",
          beach: "/images/destinations/beach.jpg",
          mountain: "/images/destinations/mountain.jpg",
          historic: "/images/destinations/historic.jpg",
          nature: "/images/destinations/nature.jpg",
          desert: "/images/destinations/desert.jpg",
          coastal: "/images/destinations/coastal.jpg",
          urban: "/images/destinations/urban.jpg",
        };

        const journeyRecords: any[] = [];
        for (const j of parsed.journeys) {
          const destType = String(j.destination_type || "city").toLowerCase();
          const image = DESTINATION_IMAGES[destType] || DESTINATION_IMAGES.city;

          const budgetNotes = j.logistics?.budget_notes || j.notes || null;
          const logistics = typeof j.logistics === "object" && j.logistics !== null
            ? { ...j.logistics, budget_notes: budgetNotes ? String(budgetNotes) : j.logistics.budget_notes || null }
            : null;

          const candidate = {
            userId,
            title: j.title ? String(j.title).trim() : "",
            dates: j.dates ? String(j.dates).trim() : "TBD",
            days: Math.max(1, Math.min(365, Number(j.days) || 5)),
            cost: j.cost ? String(j.cost).trim() : "TBD",
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
