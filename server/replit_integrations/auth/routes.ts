import type { Express } from "express";
import crypto from "crypto";
import { authStorage } from "./storage";
import { isAuthenticated, getUserId } from "./replitAuth";
import { registerSchema, loginSchema } from "@shared/models/auth";
import bcrypt from "bcryptjs";
import passport from "passport";
import { sendVerificationEmail } from "../../lib/email";
import { storage } from "../../storage";

// Simple in-memory rate limit for resend verification (per userId)
const resendRateLimit = new Map<string, number>();

export function registerAuthRoutes(app: Express): void {
  // ── Get current user ──────────────────────────────────────────────────────
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { passwordHash, emailVerificationToken, ...safeUser } = user as any;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ── Register ──────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const parsed = registerSchema.parse(req.body);

      const existing = await authStorage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(parsed.password, 12);

      const user = await authStorage.upsertUser({
        email: parsed.email,
        firstName: parsed.firstName,
        lastName: parsed.lastName || null,
        passwordHash,
        authProvider: "local",
        emailVerified: false,
      });

      // Send verification email (fire-and-forget)
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      authStorage.setVerificationToken(user.id, token, expiry)
        .then(() => sendVerificationEmail(user.email!, user.firstName || "", token))
        .catch((err) => console.error("Verification email error:", err));

      // Accept invite if token provided
      const inviteToken = req.body.inviteToken;
      if (inviteToken) {
        storage.acceptInvite(inviteToken, user.id).catch(() => {});
      }

      req.login({ userId: user.id, authProvider: "local" }, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        const { passwordHash: _, emailVerificationToken: __, ...safeUser } = user as any;
        res.status(201).json(safeUser);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const parsed = loginSchema.parse(req.body);

      const user = await authStorage.getUserByEmail(parsed.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.disabled) {
        return res.status(403).json({ message: "This account has been suspended. Please contact support." });
      }

      req.login({ userId: user.id, authProvider: "local" }, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        const { passwordHash: _, emailVerificationToken: __, ...safeUser } = user as any;
        res.json(safeUser);
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ── Email verification ────────────────────────────────────────────────────
  app.get("/api/auth/verify-email", async (req: any, res) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.redirect("/login?error=invalid-token");
    }
    const user = await authStorage.verifyEmailToken(token);
    if (!user) {
      return res.redirect("/login?error=expired-token");
    }
    res.redirect("/?verified=1");
  });

  // ── Resend verification email ─────────────────────────────────────────────
  app.post("/api/auth/resend-verification", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await authStorage.getUser(userId);
      if (!user || user.emailVerified || user.authProvider !== "local") {
        return res.status(400).json({ message: "Not applicable" });
      }

      // Rate limit: 1 per minute per user
      const lastSent = resendRateLimit.get(userId) || 0;
      if (Date.now() - lastSent < 60_000) {
        return res.status(429).json({ message: "Please wait before requesting another verification email" });
      }
      resendRateLimit.set(userId, Date.now());

      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await authStorage.setVerificationToken(user.id, token, expiry);
      await sendVerificationEmail(user.email!, user.firstName || "", token);

      res.json({ ok: true });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // ── Google OAuth ──────────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google",
      passport.authenticate("google", { scope: ["openid", "email", "profile"] })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login?error=google" }),
      (req, res) => res.redirect("/")
    );
  }

  // ── Apple OAuth ───────────────────────────────────────────────────────────
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    app.get("/api/auth/apple", passport.authenticate("apple"));

    // Apple sends a POST callback
    app.post("/api/auth/apple/callback",
      passport.authenticate("apple", { failureRedirect: "/login?error=apple" }),
      (req, res) => res.redirect("/")
    );
  }
}
