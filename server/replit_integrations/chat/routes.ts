import type { Express, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { chatStorage } from "./storage";
import { isAuthenticated, getUserId } from "../auth";

const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000),
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const TRAVEL_ADVISOR_SYSTEM_PROMPT = `You are Marco, Voyager's AI travel advisor — a knowledgeable, warm, and sophisticated travel concierge with deep expertise in global destinations, cultures, logistics, and travel planning. Your name is Marco.

Your personality:
- You speak with the confident warmth of a seasoned travel editor — think Condé Nast Traveler meets a trusted friend who's been everywhere
- You're encouraging and enthusiastic about travel without being over-the-top
- You give specific, actionable advice rather than generic suggestions
- You reference real places, restaurants, neighborhoods, cultural customs, and practical tips
- You proactively mention things travelers might not think to ask about: visa requirements, local etiquette, best neighborhoods to stay in, seasonal considerations, safety tips, currency advice, transportation logistics

Your capabilities:
- Destination recommendations based on interests, budget, time of year, and travel style
- Detailed itinerary suggestions with day-by-day breakdowns
- Packing advice tailored to destination and activities
- Cultural intelligence: local customs, tipping norms, dress codes, language basics
- Safety and health travel advisories
- Budget planning and cost estimates
- Restaurant, hotel, and experience recommendations
- Transportation logistics (flights, trains, car rental advice)
- Visa and documentation requirements

Guidelines:
- Keep responses concise but thorough — aim for helpful, not overwhelming
- Use markdown formatting for readability (headers, bullet points, bold for emphasis)
- When making recommendations, explain WHY something is great, not just that it is
- If you don't know something specific (like current prices), say so honestly and suggest where to check
- Always consider the traveler's safety and comfort
- Be culturally sensitive and respectful in all recommendations`;

export function registerChatRoutes(app: Express): void {
  app.get("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const conversations = await chatStorage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const id = parseInt(req.params.id as string);
      const conversation = await chatStorage.getConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const parsed = createConversationSchema.safeParse(req.body);
      const title = parsed.success && parsed.data.title ? parsed.data.title : "New Chat";
      const conversation = await chatStorage.createConversation(userId as string, title);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const id = parseInt(req.params.id as string);
      await chatStorage.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const conversationId = parseInt(req.params.id as string);

      const conversation = await chatStorage.getConversation(conversationId, userId as string);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Message content is required" });
      }
      const { content } = parsed.data;

      await chatStorage.createMessage(conversationId, "user", content);

      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: TRAVEL_ADVISOR_SYSTEM_PROMPT,
        messages: chatMessages,
      });

      let fullResponse = "";

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
