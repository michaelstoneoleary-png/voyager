import {
  users, type User,
  journeys, type Journey, type InsertJourney,
  journeyMembers, type JourneyMember, type InsertJourneyMember,
  pastTrips, type PastTrip, type InsertPastTrip,
  bookmarks, type Bookmark, type InsertBookmark,
  packingLists, type PackingList, type InsertPackingList,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getJourneys(userId: string): Promise<Journey[]>;
  getJourney(id: string, userId: string): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  createJourneys(journeyList: InsertJourney[]): Promise<Journey[]>;
  updateJourney(id: string, userId: string, data: Partial<InsertJourney>): Promise<Journey | undefined>;
  deleteJourney(id: string, userId: string): Promise<boolean>;

  createJourneyMember(member: InsertJourneyMember): Promise<JourneyMember>;
  getJourneyMembers(journeyId: string): Promise<JourneyMember[]>;

  getPastTrips(userId: string): Promise<PastTrip[]>;
  createPastTrip(trip: InsertPastTrip): Promise<PastTrip>;
  createPastTrips(trips: InsertPastTrip[]): Promise<PastTrip[]>;
  deletePastTrip(id: string, userId: string): Promise<boolean>;

  getBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string, userId: string): Promise<boolean>;

  getPackingLists(userId: string): Promise<PackingList[]>;
  getPackingList(id: string, userId: string): Promise<PackingList | undefined>;
  getPackingListByDestination(userId: string, destination: string): Promise<PackingList | undefined>;
  createPackingList(data: InsertPackingList): Promise<PackingList>;
  updatePackingList(id: string, userId: string, data: Partial<InsertPackingList>): Promise<PackingList | undefined>;
  deletePackingList(id: string, userId: string): Promise<boolean>;
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

  async createJourneyWithOwner(journey: InsertJourney): Promise<Journey> {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(journeys).values(journey).returning();
      await tx.insert(journeyMembers).values({
        journeyId: created.id,
        userId: created.userId,
        role: "owner",
        origin: created.origin || null,
        finalDestination: created.finalDestination || null,
      });
      return created;
    });
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
    await db.transaction(async (tx) => {
      await tx.delete(journeyMembers).where(eq(journeyMembers.journeyId, id));
      await tx.delete(pastTrips).where(eq(pastTrips.journeyId, id));
      await tx.delete(journeys).where(eq(journeys.id, id));
    });
    return true;
  }

  async createJourneyMember(member: InsertJourneyMember): Promise<JourneyMember> {
    const [created] = await db.insert(journeyMembers).values(member).returning();
    return created;
  }

  async getJourneyMembers(journeyId: string): Promise<JourneyMember[]> {
    return db.select().from(journeyMembers).where(eq(journeyMembers.journeyId, journeyId));
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

  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [created] = await db.insert(bookmarks).values(bookmark).returning();
    return created;
  }

  async deleteBookmark(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
    return true;
  }

  async getPackingLists(userId: string): Promise<PackingList[]> {
    return db.select().from(packingLists).where(eq(packingLists.userId, userId)).orderBy(desc(packingLists.updatedAt));
  }

  async getPackingList(id: string, userId: string): Promise<PackingList | undefined> {
    const [pl] = await db.select().from(packingLists).where(eq(packingLists.id, id));
    if (pl && pl.userId !== userId) return undefined;
    return pl || undefined;
  }

  async getPackingListByDestination(userId: string, destination: string): Promise<PackingList | undefined> {
    const [pl] = await db.select().from(packingLists)
      .where(and(eq(packingLists.userId, userId), eq(packingLists.destination, destination)))
      .orderBy(desc(packingLists.updatedAt));
    return pl || undefined;
  }

  async createPackingList(data: InsertPackingList): Promise<PackingList> {
    const [created] = await db.insert(packingLists).values(data).returning();
    return created;
  }

  async updatePackingList(id: string, userId: string, data: Partial<InsertPackingList>): Promise<PackingList | undefined> {
    const existing = await this.getPackingList(id, userId);
    if (!existing) return undefined;
    const [updated] = await db.update(packingLists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(packingLists.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePackingList(id: string, userId: string): Promise<boolean> {
    const existing = await this.getPackingList(id, userId);
    if (!existing) return false;
    await db.delete(packingLists).where(eq(packingLists.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
