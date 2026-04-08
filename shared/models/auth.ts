import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  authProvider: varchar("auth_provider").default("replit"),
  displayName: varchar("display_name"),
  homeLocation: varchar("home_location"),
  passportCountry: varchar("passport_country"),
  temperatureUnit: varchar("temperature_unit").default("F"),
  weightUnit: varchar("weight_unit").default("kg"),
  currency: varchar("currency").default("USD"),
  distanceUnit: varchar("distance_unit").default("mi"),
  dateFormat: varchar("date_format").default("MM/DD/YYYY"),
  travelStyles: text("travel_styles").array(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  disabled: boolean("disabled").notNull().default(false),
  role: varchar("role").notNull().default("user"),
  socialInstagram: varchar("social_instagram"),
  socialBlogUrl: varchar("social_blog_url"),
  socialYoutube: varchar("social_youtube"),
  socialTiktok: varchar("social_tiktok"),
  socialTwitter: varchar("social_twitter"),
  gender: varchar("gender"),
  phoneNumber: varchar("phone_number"),
  publishBlog: boolean("publish_blog").default(false),
  cuisinePreferences: text("cuisine_preferences").array(),
  dietaryRestrictions: text("dietary_restrictions").array(),
  diningPriceRange: varchar("dining_price_range"),
  expoPushToken: varchar("expo_push_token"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  googleId: varchar("google_id").unique(),
  appleId: varchar("apple_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
