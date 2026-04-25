import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const CATEGORIES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoe",
  "bag",
  "accessory",
  "intimate",
  "swim",
  "activewear",
];

const VIBES = [
  "casual",
  "elevated",
  "going-out",
  "work",
  "weekend",
  "summer",
  "winter",
  "minimal",
  "feminine",
  "edgy",
  "sporty",
];

export async function POST(req: Request) {
  try {
    const { emailText } = (await req.json()) as { emailText: string };
    if (!emailText || emailText.trim().length < 20) {
      return NextResponse.json({ error: "Paste the full order email" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Add it in Vercel → Settings → Environment Variables." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const system = `You extract clothing items from order confirmation emails. Return ONLY valid JSON — no commentary, no markdown, no code fences. JSON shape:

{
  "retailer": "string (e.g. Reformation, Free People)",
  "items": [
    {
      "brand": "string",
      "name": "concise item name",
      "color": "human color (e.g. cream, black, dusty blue)",
      "colorHex": "#hex approximating that color",
      "size": "string or null",
      "price": number or null (USD),
      "category": "one of: ${CATEGORIES.join(", ")}",
      "vibe": ["1-3 of: ${VIBES.join(", ")}"]
    }
  ]
}

Rules:
- Skip taxes, shipping, gift cards, returns. Only actual clothing items.
- If brand is unclear, use the retailer name as brand.
- Color must be a real word, never "n/a" — guess from item name if needed.
- colorHex should reasonably match the color (cream → #F5EFE0, black → #1a1a1a, etc).
- Never invent items not in the email.`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system,
      messages: [
        {
          role: "user",
          content: `Extract items from this order email:\n\n${emailText.slice(0, 12000)}`,
        },
      ],
    });

    const text = msg.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();

    // strip code fences if Claude added them despite instructions
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Couldn't parse this email. Try a cleaner copy/paste of just the order block." },
        { status: 422 }
      );
    }

    const retailer: string = parsed.retailer || "Unknown";
    const items = (parsed.items || []).map((it: any, idx: number) => ({
      id: `${Date.now()}_${idx}`,
      brand: it.brand || retailer,
      name: it.name || "Item",
      color: it.color || "neutral",
      colorHex: it.colorHex || "#c9b896",
      size: it.size || undefined,
      price: typeof it.price === "number" ? it.price : undefined,
      category: CATEGORIES.includes(it.category) ? it.category : "top",
      vibe: Array.isArray(it.vibe) ? it.vibe.slice(0, 3) : [],
      retailer,
      date: new Date().toISOString().slice(0, 10),
    }));

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Parsing failed. Try again." },
      { status: 500 }
    );
  }
}
