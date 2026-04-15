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

// Short-lived one-time codes for mobile OAuth session exchange (2-min TTL)
const mobileCodes = new Map<string, { sessionId: string; expires: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [code, val] of mobileCodes) {
    if (now > val.expires) mobileCodes.delete(code);
  }
}, 5 * 60 * 1000);

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
    // Web flow
    app.get("/api/auth/google",
      passport.authenticate("google", { scope: ["openid", "email", "profile"] })
    );

    // Mobile flow — sets session flag so callback deep-links back to the app
    app.get("/api/auth/google/mobile", (req: any, _res, next) => {
      (req.session as any).oauthMobile = true;
      req.session.save(next);
    }, passport.authenticate("google", { scope: ["openid", "email", "profile"] }));

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login?error=google" }),
      (req: any, res) => {
        if ((req.session as any).oauthMobile) {
          delete (req.session as any).oauthMobile;
          const code = crypto.randomBytes(24).toString("hex");
          mobileCodes.set(code, { sessionId: req.sessionID, expires: Date.now() + 120_000 });
          req.session.save(() => res.redirect(`bonvoyager://auth-callback?code=${code}`));
        } else {
          res.redirect("/");
        }
      }
    );
  }

  // ── Mobile OAuth session exchange ─────────────────────────────────────────
  // Exchanges a short-lived one-time code (from Google callback deep link) for
  // a signed session cookie that the mobile app stores in SecureStore.
  app.get("/api/auth/mobile/exchange", (req: any, res) => {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Missing code" });
    }
    const stored = mobileCodes.get(code);
    if (!stored || Date.now() > stored.expires) {
      mobileCodes.delete(code);
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    mobileCodes.delete(code);
    // cookie-signature is a transitive dep of express-session
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { sign } = require("cookie-signature") as { sign: (v: string, s: string) => string };
    const signedSid = "s:" + sign(stored.sessionId, process.env.SESSION_SECRET!);
    const cookieValue = `connect.sid=${encodeURIComponent(signedSid)}`;
    res.json({ cookie: cookieValue });
  });

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
