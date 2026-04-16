import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/** Idempotent: creates tables that may not exist yet (e.g. after schema additions). */
export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invites (
      id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      token       VARCHAR(64) UNIQUE NOT NULL,
      email       VARCHAR,
      invited_by  VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      note        VARCHAR(500),
      created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
      expires_at  TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      accepted_by VARCHAR REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS friendships (
      id           VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      requester_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status       TEXT NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMP DEFAULT NOW(),
      updated_at   TIMESTAMP DEFAULT NOW()
    )
  `);
}
