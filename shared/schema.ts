export * from "./models/auth";

import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export const journeys = pgTable("journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  dates: text("dates").notNull(),
  days: integer("days").notNull(),
  cost: text("cost").notNull(),
  status: text("status").notNull().default("Planning"),
  progress: integer("progress").notNull().default(0),
  image: text("image"),
  destinations: text("destinations").array(),
  seasonality: jsonb("seasonality"),
  priceAlert: jsonb("price_alert"),
  logistics: jsonb("logistics"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pastTrips = pgTable("past_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  destination: text("destination").notNull(),
  country: text("country"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  notes: text("notes"),
  lat: text("lat"),
  lng: text("lng"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  journeys: many(journeys),
  pastTrips: many(pastTrips),
}));

export const journeysRelations = relations(journeys, ({ one }) => ({
  user: one(users, { fields: [journeys.userId], references: [users.id] }),
}));

export const pastTripsRelations = relations(pastTrips, ({ one }) => ({
  user: one(users, { fields: [pastTrips.userId], references: [users.id] }),
}));

export const insertJourneySchema = createInsertSchema(journeys).omit({
  id: true,
  createdAt: true,
});

export const insertPastTripSchema = createInsertSchema(pastTrips).omit({
  id: true,
  createdAt: true,
});

export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Journey = typeof journeys.$inferSelect;
export type InsertPastTrip = z.infer<typeof insertPastTripSchema>;
export type PastTrip = typeof pastTrips.$inferSelect;
