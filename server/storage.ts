import {
  users, type User,
  journeys, type Journey, type InsertJourney,
  journeyMembers, type JourneyMember, type InsertJourneyMember,
  pastTrips, type PastTrip, type InsertPastTrip,
  bookmarks, type Bookmark, type InsertBookmark,
  packingLists, type PackingList, type InsertPackingList,
  journeyPhotos, type JourneyPhoto, type InsertJourneyPhoto,
  voyages, type Voyage, type InsertVoyage,
  userActivityFeedback,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function normalizeJourney(j: Journey): Journey {
  return {
    ...j,
    title: j.title ? toTitleCase(j.title) : j.title,
    origin: j.origin ? toTitleCase(j.origin) : j.origin,
    finalDestination: j.finalDestination ? toTitleCase(j.finalDestination) : j.finalDestination,
    destinations: Array.isArray(j.destinations) ? (j.destinations as string[]).map(toTitleCase) : j.destinations,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getJourneys(userId: string): Promise<Journey[]>;
  getJourney(id: string, userId: string): Promise<Journey | undefined>;
  getJourneyPublic(id: string): Promise<Omit<Journey, "userId"> | undefined>;
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

  getJourneyPhotos(journeyId: string): Promise<JourneyPhoto[]>;
  getJourneyPhoto(id: string, userId: string): Promise<JourneyPhoto | undefined>;
  createJourneyPhoto(photo: InsertJourneyPhoto): Promise<JourneyPhoto>;
  updateJourneyPhoto(id: string, userId: string, data: Pick<InsertJourneyPhoto, "caption" | "dayIndex">): Promise<JourneyPhoto | undefined>;
  deleteJourneyPhoto(id: string, userId: string): Promise<JourneyPhoto | undefined>;

  recordActivityFeedback(data: { userId: string; journeyId?: string; activityTitle: string; activityType?: string; location?: string; signal: "liked" | "hard_reject" }): Promise<void>;
  getHardRejectedTitles(userId: string): Promise<string[]>;
  getActivityFeedbackSignals(userId: string): Promise<Array<{ signal: string; activityType: string | null }>>;
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
    const rows = await db.select().from(journeys).where(eq(journeys.userId, userId));
    return rows.map(normalizeJourney);
  }

  async getJourney(id: string, userId: string): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys)
      .where(eq(journeys.id, id));
    if (journey && journey.userId !== userId) return undefined;
    return journey ? normalizeJourney(journey) : undefined;
  }

  async getJourneyPublic(id: string): Promise<Omit<Journey, "userId"> | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, id));
    if (!journey) return undefined;
    const { userId: _uid, ...publicFields } = normalizeJourney(journey) as any;
    return publicFields;
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
    const [updated] = await db.update(journeys).set({ ...data, updatedAt: new Date() }).where(eq(journeys.id, id)).returning();
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

  async getJourneyPhotos(journeyId: string): Promise<JourneyPhoto[]> {
    return db.select().from(journeyPhotos)
      .where(eq(journeyPhotos.journeyId, journeyId))
      .orderBy(journeyPhotos.takenAt, journeyPhotos.createdAt);
  }

  async getJourneyPhoto(id: string, userId: string): Promise<JourneyPhoto | undefined> {
    const [photo] = await db.select().from(journeyPhotos).where(eq(journeyPhotos.id, id));
    if (photo && photo.userId !== userId) return undefined;
    return photo || undefined;
  }

  async createJourneyPhoto(photo: InsertJourneyPhoto): Promise<JourneyPhoto> {
    const [created] = await db.insert(journeyPhotos).values(photo).returning();
    return created;
  }

  async updateJourneyPhoto(id: string, userId: string, data: Pick<InsertJourneyPhoto, "caption" | "dayIndex">): Promise<JourneyPhoto | undefined> {
    const existing = await this.getJourneyPhoto(id, userId);
    if (!existing) return undefined;
    const [updated] = await db.update(journeyPhotos).set(data).where(eq(journeyPhotos.id, id)).returning();
    return updated || undefined;
  }

  async deleteJourneyPhoto(id: string, userId: string): Promise<JourneyPhoto | undefined> {
    const existing = await this.getJourneyPhoto(id, userId);
    if (!existing) return undefined;
    await db.delete(journeyPhotos).where(eq(journeyPhotos.id, id));
    return existing;
  }

  async getVoyages(userId: string): Promise<Voyage[]> {
    return db.select().from(voyages)
      .where(eq(voyages.userId, userId))
      .orderBy(desc(voyages.startedAt));
  }

  async getActiveVoyage(userId: string): Promise<Voyage | undefined> {
    const [voyage] = await db.select().from(voyages)
      .where(and(eq(voyages.userId, userId), eq(voyages.status, "active")));
    return voyage || undefined;
  }

  async createVoyage(data: InsertVoyage): Promise<Voyage> {
    const [created] = await db.insert(voyages).values(data).returning();
    return created;
  }

  async updateVoyage(id: string, userId: string, data: Partial<InsertVoyage>): Promise<Voyage | undefined> {
    const [existing] = await db.select().from(voyages)
      .where(and(eq(voyages.id, id), eq(voyages.userId, userId)));
    if (!existing) return undefined;
    const [updated] = await db.update(voyages).set(data)
      .where(eq(voyages.id, id)).returning();
    return updated || undefined;
  }

  async recordActivityFeedback(data: { userId: string; journeyId?: string; activityTitle: string; activityType?: string; location?: string; signal: "liked" | "hard_reject" }): Promise<void> {
    await db.insert(userActivityFeedback).values({
      userId: data.userId,
      journeyId: data.journeyId,
      activityTitle: data.activityTitle,
      activityType: data.activityType,
      location: data.location,
      signal: data.signal,
    });
  }

  async getHardRejectedTitles(userId: string): Promise<string[]> {
    const rows = await db.select({ activityTitle: userActivityFeedback.activityTitle })
      .from(userActivityFeedback)
      .where(and(eq(userActivityFeedback.userId, userId), eq(userActivityFeedback.signal, "hard_reject")));
    return rows.map(r => r.activityTitle);
  }

  async getActivityFeedbackSignals(userId: string): Promise<Array<{ signal: string; activityType: string | null }>> {
    return db.select({ signal: userActivityFeedback.signal, activityType: userActivityFeedback.activityType })
      .from(userActivityFeedback)
      .where(eq(userActivityFeedback.userId, userId));
  }
}

export const storage = new DatabaseStorage();
