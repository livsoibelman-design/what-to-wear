import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

type Item = {
  id: string;
  brand: string;
  name: string;
  color: string;
  size?: string;
  price?: number;
  category: string;
  vibe?: string[];
  retailer?: string;
};

type Feedback = {
  rating: "like" | "dislike" | "wore";
  occasion: string;
  outfitText: string;
  itemIds: string[];
  ts: number;
};

function tasteSummary(feedback: Feedback[]): string {
  if (!feedback.length) return "";

  const wins = feedback.filter((f) => f.rating === "like" || f.rating === "wore");
  const losses = feedback.filter((f) => f.rating === "dislike");

  const winLines = wins
    .slice(-8)
    .map((f) => `- "${f.occasion}" → ${f.rating === "wore" ? "WORE IT" : "loved"}: ${f.outfitText.slice(0, 180)}`)
    .join("\n");
  const lossLines = losses
    .slice(-6)
    .map((f) => `- "${f.occasion}" → not her: ${f.outfitText.slice(0, 180)}`)
    .join("\n");

  let out = "\n\nHER TASTE — recent feedback:\n";
  if (winLines) out += `What worked:\n${winLines}\n`;
  if (lossLines) out += `What did NOT work:\n${lossLines}\n`;
  out +=
    "\nLean into the patterns from what worked. Avoid the patterns from what didn't. Don't apologize, just style.";
  return out;
}

function closetListing(items: Item[]): string {
  return items
    .map(
      (i) =>
        `- [${i.id}] ${i.brand} ${i.name} (${i.color}${i.size ? `, ${i.size}` : ""}) — ${i.category}${
          i.vibe?.length ? ` — vibe: ${i.vibe.join(", ")}` : ""
        }`
    )
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const { occasion, items, feedback } = (await req.json()) as {
      occasion: string;
      items: Item[];
      feedback?: Feedback[];
    };

    if (!occasion || !items?.length) {
      return NextResponse.json({ error: "Missing occasion or items" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Add it in Vercel → Settings → Environment Variables." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const system = `You are a sharp, warm personal stylist. You only style with items from the user's actual closet — never invent pieces she doesn't own.

Format every recommendation as 2-3 short outfit options. For each option:
1. Lead with a one-line vibe ("Easy Saturday lunch energy.")
2. List the pieces, one per line, formatted as "Brand Item — note on why" (use an em-dash, exact brand+item name from the closet so we can match items)
3. Add one line of styling notes (shoes, jewelry, hair) if relevant

Keep it tight — under 180 words total. Confident, never preachy. Don't list every piece in the closet — pick.`;

    const user = `Closet:\n${closetListing(items)}${tasteSummary(
      feedback || []
    )}\n\nOccasion: ${occasion}\n\nGive me 2-3 outfit options.`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = msg.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Stylist failed. Try again in a sec." },
      { status: 500 }
    );
  }
}
