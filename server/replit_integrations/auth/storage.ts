import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, and, gt } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return user;
  }

  async setVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({ emailVerificationToken: token, emailVerificationExpiry: expiry, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async verifyEmailToken(token: string): Promise<User | null> {
    const now = new Date();
    const [user] = await db.select().from(users).where(
      and(
        eq(users.emailVerificationToken, token),
        gt(users.emailVerificationExpiry, now)
      )
    );
    if (!user) return null;
    const [updated] = await db.update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    return updated || null;
  }
}

export const authStorage = new AuthStorage();
