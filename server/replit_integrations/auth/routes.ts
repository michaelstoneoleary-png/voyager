import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated, getUserId } from "./replitAuth";
import { registerSchema, loginSchema } from "@shared/models/auth";
import bcrypt from "bcryptjs";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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
      });

      req.login({ userId: user.id, authProvider: "local" }, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        const { passwordHash: _, ...safeUser } = user;
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
        const { passwordHash: _, ...safeUser } = user;
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
}
