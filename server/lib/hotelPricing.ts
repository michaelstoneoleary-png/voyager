// Focused Claude Haiku call to refine AI-estimated hotel prices.
// More accurate than inline estimates because the model reasons about
// each property individually with full date/season context.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || undefined,
});

interface HotelInput {
  name: string;
  category: string;
  neighborhood?: string;
  location: string;
}

export async function refinePricesWithClaude(
  hotels: HotelInput[],
  checkIn: string,
  checkOut: string,
): Promise<Map<string, string>> {
  if (!hotels.length) return new Map();

  const list = hotels
    .map((h, i) => `${i + 1}. ${h.name}, ${h.neighborhood ? `${h.neighborhood}, ` : ""}${h.location} (${h.category})`)
    .join("\n");

  const prompt = `You are a hotel pricing expert with up-to-date knowledge of accommodation costs worldwide.

For each hotel below, provide a realistic nightly rate RANGE in USD reflecting current market rates (2025–2026).
Consider: the hotel's specific reputation and prestige, its city and neighbourhood (historic districts, city centres, and resort areas cost more), seasonal demand for the travel dates, and whether it is a well-known premium property.

Travel dates: ${checkIn} to ${checkOut}

Hotels:
${list}

Return ONLY a JSON array in the same order, no other text:
[{"name":"exact hotel name","price_per_night":"$X–$Y"}]

Use realistic ranges — boutique and upscale hotels in popular destinations regularly exceed $300–600/night.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as any).text as string;
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return new Map();

    const parsed: Array<{ name: string; price_per_night: string }> = JSON.parse(match[0]);
    return new Map(parsed.map(p => [p.name, p.price_per_night]));
  } catch {
    return new Map();
  }
}
