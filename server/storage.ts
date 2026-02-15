import {
  users, type User,
  journeys, type Journey, type InsertJourney,
  pastTrips, type PastTrip, type InsertPastTrip,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getJourneys(userId: string): Promise<Journey[]>;
  getJourney(id: string, userId: string): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  createJourneys(journeyList: InsertJourney[]): Promise<Journey[]>;
  updateJourney(id: string, userId: string, data: Partial<InsertJourney>): Promise<Journey | undefined>;
  deleteJourney(id: string, userId: string): Promise<boolean>;

  getPastTrips(userId: string): Promise<PastTrip[]>;
  createPastTrip(trip: InsertPastTrip): Promise<PastTrip>;
  createPastTrips(trips: InsertPastTrip[]): Promise<PastTrip[]>;
  deletePastTrip(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const { id: _, createdAt, ...updateData } = data as any;
    const [updated] = await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getJourneys(userId: string): Promise<Journey[]> {
    return db.select().from(journeys).where(eq(journeys.userId, userId));
  }

  async getJourney(id: string, userId: string): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys)
      .where(eq(journeys.id, id));
    if (journey && journey.userId !== userId) return undefined;
    return journey || undefined;
  }

  async createJourney(journey: InsertJourney): Promise<Journey> {
    const [created] = await db.insert(journeys).values(journey).returning();
    return created;
  }

  async createJourneys(journeyList: InsertJourney[]): Promise<Journey[]> {
    if (journeyList.length === 0) return [];
    return db.insert(journeys).values(journeyList).returning();
  }

  async updateJourney(id: string, userId: string, data: Partial<InsertJourney>): Promise<Journey | undefined> {
    const existing = await this.getJourney(id, userId);
    if (!existing) return undefined;
    const [updated] = await db.update(journeys).set(data).where(eq(journeys.id, id)).returning();
    return updated;
  }

  async deleteJourney(id: string, userId: string): Promise<boolean> {
    const existing = await this.getJourney(id, userId);
    if (!existing) return false;
    await db.delete(pastTrips).where(eq(pastTrips.journeyId, id));
    await db.delete(journeys).where(eq(journeys.id, id));
    return true;
  }

  async getPastTrips(userId: string): Promise<PastTrip[]> {
    return db.select().from(pastTrips).where(eq(pastTrips.userId, userId));
  }

  async createPastTrip(trip: InsertPastTrip): Promise<PastTrip> {
    const [created] = await db.insert(pastTrips).values(trip).returning();
    return created;
  }

  async createPastTrips(trips: InsertPastTrip[]): Promise<PastTrip[]> {
    if (trips.length === 0) return [];
    return db.insert(pastTrips).values(trips).returning();
  }

  async deletePastTrip(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(pastTrips).where(eq(pastTrips.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(pastTrips).where(eq(pastTrips.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
