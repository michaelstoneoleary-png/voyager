import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../db";

export type HealthStatus = "healthy" | "degraded" | "configured" | "unconfigured";

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  latency?: number;
  message?: string;
  checkedAt: string;
}

export interface HealthReport {
  services: ServiceHealth[];
  generatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms = 5000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

function envVarCheck(name: string, vars: string[]): ServiceHealth {
  const missing = vars.filter((v) => !process.env[v]);
  return {
    name,
    status: missing.length === 0 ? "configured" : "unconfigured",
    message: missing.length > 0 ? `Missing: ${missing.join(", ")}` : undefined,
    checkedAt: new Date().toISOString(),
  };
}

// ── Live checks ───────────────────────────────────────────────────────────────

async function checkAnthropic(): Promise<ServiceHealth> {
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { name: "Anthropic", status: "unconfigured", message: "Missing: ANTHROPIC_API_KEY", checkedAt: new Date().toISOString() };
  }
  const start = Date.now();
  try {
    const client = new Anthropic({
      apiKey,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || undefined,
    });
    await Promise.race([
      client.models.list(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
    ]);
    return { name: "Anthropic", status: "healthy", latency: Date.now() - start, checkedAt: new Date().toISOString() };
  } catch (err: any) {
    return { name: "Anthropic", status: "degraded", latency: Date.now() - start, message: err?.message ?? String(err), checkedAt: new Date().toISOString() };
  }
}

async function checkGooglePlaces(): Promise<ServiceHealth> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return { name: "Google Places", status: "unconfigured", message: "Missing: GOOGLE_PLACES_API_KEY", checkedAt: new Date().toISOString() };
  }
  const start = Date.now();
  try {
    const data = await withTimeout((signal) =>
      fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${key}`,
        { signal },
      ).then((r) => r.json()),
    );
    const ok = data.status === "OK" || data.status === "ZERO_RESULTS";
    if (ok) {
      return { name: "Google Places", status: "healthy", latency: Date.now() - start, checkedAt: new Date().toISOString() };
    }
    return { name: "Google Places", status: "degraded", latency: Date.now() - start, message: data.error_message || data.status, checkedAt: new Date().toISOString() };
  } catch (err: any) {
    return { name: "Google Places", status: "degraded", latency: Date.now() - start, message: err?.message ?? String(err), checkedAt: new Date().toISOString() };
  }
}

async function checkWikipedia(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const res = await withTimeout((signal) =>
      fetch(
        "https://en.wikipedia.org/w/api.php?action=query&titles=Paris&prop=pageimages&piprop=original&format=json&origin=*",
        { signal, headers: { "User-Agent": "Voyager-Travel-App/1.0" } },
      ),
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { name: "Wikipedia", status: "healthy", latency: Date.now() - start, checkedAt: new Date().toISOString() };
  } catch (err: any) {
    return { name: "Wikipedia", status: "degraded", latency: Date.now() - start, message: err?.message ?? String(err), checkedAt: new Date().toISOString() };
  }
}

async function checkRssFeed(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const res = await withTimeout((signal) =>
      fetch("https://www.nomadicmatt.com/travel-blog/feed/", { signal }),
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { name: "RSS Feed", status: "healthy", latency: Date.now() - start, checkedAt: new Date().toISOString() };
  } catch (err: any) {
    return { name: "RSS Feed", status: "degraded", latency: Date.now() - start, message: err?.message ?? String(err), checkedAt: new Date().toISOString() };
  }
}

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
    ]);
    return { name: "Database", status: "healthy", latency: Date.now() - start, checkedAt: new Date().toISOString() };
  } catch (err: any) {
    return { name: "Database", status: "degraded", latency: Date.now() - start, message: err?.message ?? String(err), checkedAt: new Date().toISOString() };
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function checkAllServices(): Promise<HealthReport> {
  const [anthropic, googlePlaces, wikipedia, rss, database] = await Promise.allSettled([
    checkAnthropic(),
    checkGooglePlaces(),
    checkWikipedia(),
    checkRssFeed(),
    checkDatabase(),
  ]);

  const liveNames = ["Anthropic", "Google Places", "Wikipedia", "RSS Feed", "Database"];
  const liveResults: ServiceHealth[] = [anthropic, googlePlaces, wikipedia, rss, database].map(
    (result, i) =>
      result.status === "fulfilled"
        ? result.value
        : { name: liveNames[i], status: "degraded" as HealthStatus, message: String((result as PromiseRejectedResult).reason), checkedAt: new Date().toISOString() },
  );

  const envResults: ServiceHealth[] = [
    envVarCheck("Resend", ["RESEND_API_KEY"]),
    envVarCheck("Twilio", ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]),
    envVarCheck("Google OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]),
    envVarCheck("Apple OAuth", ["APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"]),
    envVarCheck("Cloudinary", ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]),
  ];

  return { services: [...liveResults, ...envResults], generatedAt: new Date().toISOString() };
}
