import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import AppleStrategy from "passport-apple";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // ── Google OAuth ──────────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Existing Google-linked user
        let user = await authStorage.getUserByGoogleId(profile.id);
        if (user) return done(null, { userId: user.id, authProvider: "google" } as any);

        // 2. Email matches existing local account — link it
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await authStorage.getUserByEmail(email);
          if (user) {
            await authStorage.updateUser(user.id, { googleId: profile.id, emailVerified: true });
            return done(null, { userId: user.id, authProvider: "google" } as any);
          }
        }

        // 3. New user
        user = await authStorage.upsertUser({
          email: email || null,
          firstName: profile.name?.givenName || profile.displayName?.split(" ")[0] || null,
          lastName: profile.name?.familyName || null,
          profileImageUrl: profile.photos?.[0]?.value || null,
          googleId: profile.id,
          authProvider: "google",
          emailVerified: true,
        });
        return done(null, { userId: user.id, authProvider: "google" } as any);
      } catch (err) {
        return done(err as Error);
      }
    }));
  }

  // ── Apple OAuth ───────────────────────────────────────────────────────────
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      callbackURL: "/api/auth/apple/callback",
      scope: ["name", "email"],
    } as any, async (accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
      try {
        const appleId = idToken?.sub || profile?.id;
        const email = idToken?.email || profile?.email;
        const firstName = profile?.name?.firstName || null;
        const lastName = profile?.name?.lastName || null;

        if (!appleId) return done(new Error("No Apple ID in token"));

        let user = await authStorage.getUserByAppleId(appleId);
        if (user) return done(null, { userId: user.id, authProvider: "apple" });

        if (email) {
          user = await authStorage.getUserByEmail(email);
          if (user) {
            await authStorage.updateUser(user.id, { appleId, emailVerified: true });
            return done(null, { userId: user.id, authProvider: "apple" });
          }
        }

        user = await authStorage.upsertUser({
          email: email || null,
          firstName,
          lastName,
          appleId,
          authProvider: "apple",
          emailVerified: true,
        });
        return done(null, { userId: user.id, authProvider: "apple" });
      } catch (err) {
        return done(err as Error);
      }
    }));
  }

  // ── Replit OIDC (legacy) ──────────────────────────────────────────────────
  if (!process.env.REPL_ID) {
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        req.session.destroy(() => {
          res.redirect("/");
        });
      });
    });
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const user = req.user as any;
    const isLocalUser = user?.authProvider === "local" || user?.authProvider === "google" || user?.authProvider === "apple";

    req.logout(() => {
      if (isLocalUser) {
        req.session.destroy(() => {
          res.redirect("/");
        });
      } else {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      }
    });
  });
}

export function getUserId(req: any): string | null {
  const user = req.user as any;
  if (!user) return null;
  if (user.userId) return user.userId; // local, google, apple
  if (user.claims?.sub) return user.claims.sub; // Replit OIDC
  return null;
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Local, Google, Apple — session-based, no token refresh needed
  if (user.authProvider === "local" || user.authProvider === "google" || user.authProvider === "apple") {
    if (user.userId) return next();
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Replit OIDC — token refresh
  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
