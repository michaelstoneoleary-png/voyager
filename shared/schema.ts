export * from "./models/auth";
export * from "./models/chat";

import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export const journeys = pgTable("journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  dates: text("dates"),
  days: integer("days"),
  cost: text("cost"),
  status: text("status").notNull().default("Planning"),
  progress: integer("progress").notNull().default(0),
  image: text("image"),
  destinations: text("destinations").array(),
  seasonality: jsonb("seasonality"),
  priceAlert: jsonb("price_alert"),
  logistics: jsonb("logistics"),
  itinerary: jsonb("itinerary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pastTrips = pgTable("past_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  journeyId: varchar("journey_id").references(() => journeys.id),
  destination: text("destination").notNull(),
  country: text("country"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  notes: text("notes"),
  lat: text("lat"),
  lng: text("lng"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  source: text("source"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  journeys: many(journeys),
  pastTrips: many(pastTrips),
  bookmarks: many(bookmarks),
}));

export const journeysRelations = relations(journeys, ({ one, many }) => ({
  user: one(users, { fields: [journeys.userId], references: [users.id] }),
  pastTrips: many(pastTrips),
}));

export const pastTripsRelations = relations(pastTrips, ({ one }) => ({
  user: one(users, { fields: [pastTrips.userId], references: [users.id] }),
  journey: one(journeys, { fields: [pastTrips.journeyId], references: [journeys.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
}));

export const insertJourneySchema = createInsertSchema(journeys).omit({
  id: true,
  createdAt: true,
});

export const insertPastTripSchema = createInsertSchema(pastTrips).omit({
  id: true,
  createdAt: true,
});

export const updateUserSettingsSchema = z.object({
  displayName: z.string().optional(),
  homeLocation: z.string().optional(),
  passportCountry: z.string().optional(),
  temperatureUnit: z.enum(["F", "C"]).optional(),
  currency: z.string().optional(),
  distanceUnit: z.enum(["mi", "km"]).optional(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY"]).optional(),
  travelStyles: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialBlogUrl: z.string().optional(),
  socialYoutube: z.string().optional(),
  socialTiktok: z.string().optional(),
  socialTwitter: z.string().optional(),
  publishBlog: z.boolean().optional(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Journey = typeof journeys.$inferSelect;
export type InsertPastTrip = z.infer<typeof insertPastTripSchema>;
export type PastTrip = typeof pastTrips.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
