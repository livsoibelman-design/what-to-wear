"use client";

import { useState, useEffect, useMemo } from "react";

// ============================================================
// TYPES
// ============================================================
type Item = {
  id: string;
  brand: string;
  name: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  category: string;
  vibe: string[];
  retailer?: string;
  date?: string;
  returned?: boolean;
};

type Feedback = {
  rating: "like" | "dislike" | "wore";
  occasion: string;
  outfitText: string;
  itemIds: string[];
  ts: number;
};

type Tab = "stylist" | "closet" | "add" | "returned" | "taste";

// ============================================================
// SEED CLOSET — Liv's actual order history
// ============================================================
const SEED_WARDROBE: Item[] = [
  { id: "alo-1", brand: "Alo Yoga", name: "Alosoft Suns Out Onesie", color: "Black", colorHex: "#0a0a0a", size: "XS", price: 128, category: "activewear", vibe: ["athleisure","going-out"] },
  { id: "alo-2", brand: "Alo Yoga", name: "Alosoft Sincere Micro Short", color: "Black", colorHex: "#0a0a0a", size: "XS", price: 64, category: "bottom", vibe: ["athleisure"] },
  { id: "alo-3", brand: "Alo Yoga", name: "Alosoft Sincere Bra", color: "Black", colorHex: "#0a0a0a", size: "S", price: 68, category: "activewear", vibe: ["athleisure"] },
  { id: "ref-1", brand: "Reformation", name: "Mia Low Waist Linen Skort", color: "Black", colorHex: "#0a0a0a", size: "0", price: 128, category: "bottom", vibe: ["casual","going-out"] },
  { id: "ref-2", brand: "Reformation", name: "Henri Linen Short", color: "Sugar (cream)", colorHex: "#f5ecd9", size: "0", price: 128, category: "bottom", vibe: ["casual"] },
  { id: "ref-3", brand: "Reformation", name: "Sylvie Short", color: "White", colorHex: "#ffffff", size: "XS", price: 128, category: "bottom", vibe: ["casual","elevated"] },
  { id: "fp-1", brand: "Free People", name: "Beck Buckle Clogs", color: "Tan Suede", colorHex: "#c9a37a", size: "EU 36", price: 158, category: "shoe", vibe: ["casual","elevated"] },
  { id: "fp-2", brand: "Free People", name: "Hot Shot Easy Pants", color: "Ivory", colorHex: "#f3eee0", size: "XS", price: 70, category: "bottom", vibe: ["casual","athleisure"] },
  { id: "fp-3", brand: "Free People", name: "Retreat Yoga Pants", color: "Black", colorHex: "#0a0a0a", size: "XS", price: 98, category: "bottom", vibe: ["athleisure"] },
  { id: "fp-4", brand: "Free People", name: "Hot Shot Easy Pants", color: "Cocoa", colorHex: "#5a3e2a", size: "XS", price: 70, category: "bottom", vibe: ["casual","athleisure"] },
  { id: "fp-5", brand: "Free People", name: "Breathe Deeper Crop Tank", color: "Black", colorHex: "#0a0a0a", size: "XS", price: 48, category: "top", vibe: ["athleisure"] },
  { id: "roth-1", brand: "Rothy's", name: "The Casual Clog", color: "Dune", colorHex: "#d4b896", size: "5", price: 139, category: "shoe", vibe: ["casual","elevated"] },
  { id: "moth-1", brand: "Mother Denim", name: "Lil Reifler — Starry Eyed", color: "Indigo", colorHex: "#2a3552", size: "25", price: 268, category: "bottom", vibe: ["casual","going-out"] },
  { id: "lr-1", brand: "Loeffler Randall", name: "Margot Raffia Bow Mule", color: "Natural", colorHex: "#e0c79a", size: "5.5", price: 159.97, category: "shoe", vibe: ["going-out","elevated"] },
  { id: "sk-1", brand: "SKIMS", name: "Fits Everybody Square Neck Bodysuit", color: "Cocoa", colorHex: "#5a3e2a", size: "S", price: 60, category: "top", vibe: ["going-out","casual"] },
];

const STORAGE_KEY = "wtw_state_v1";

// ============================================================
// MAIN
// ============================================================
export default function Page() {
  const [wardrobe, setWardrobe] = useState<Item[]>([]);
  const [returned, setReturned] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [tab, setTab] = useState<Tab>("stylist");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setWardrobe(s.wardrobe ?? SEED_WARDROBE);
        setReturned(new Set(s.returned ?? []));
        setFeedback(s.feedback ?? []);
      } else {
        setWardrobe(SEED_WARDROBE);
      }
    } catch {
      setWardrobe(SEED_WARDROBE);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      wardrobe, returned: [...returned], feedback,
    }));
  }, [wardrobe, returned, feedback, hydrated]);

  const activeItems = useMemo(() => wardrobe.filter(i => !returned.has(i.id)), [wardrobe, returned]);
  const returnedItems = useMemo(() => wardrobe.filter(i => returned.has(i.id)), [wardrobe, returned]);

  function markReturned(id: string) { const n = new Set(returned); n.add(id); setReturned(n); }
  function restoreItem(id: string)  { const n = new Set(returned); n.delete(id); setReturned(n); }
  function addItems(newItems: Item[]) {
    const existing = new Set(wardrobe.map(i => i.id));
    const stamped = newItems.map(i => ({ ...i, id: existing.has(i.id) ? i.id + "-" + Date.now() : i.id }));
    setWardrobe([...wardrobe, ...stamped]);
  }
  function recordFeedback(f: Feedback) { setFeedback([...feedback, f]); }

  if (!hydrated) {
    return (
      <div className="phone-shell flex items-center justify-center">
        <div className="thinking font-serif italic text-terracotta text-lg">Setting the table…</div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <Wordmark />
      {tab === "stylist"  && <StylistScreen items={activeItems} feedback={feedback} onFeedback={recordFeedback} />}
      {tab === "closet"   && <ClosetScreen items={activeItems} onReturn={markReturned} />}
      {tab === "add"      && <AddScreen onParsed={addItems} onDone={() => setTab("closet")} />}
      {tab === "returned" && <ReturnScreen items={returnedItems} onRestore={restoreItem} />}
      {tab === "taste"    && <TasteScreen feedback={feedback} wardrobe={wardrobe} />}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

// ============================================================
// SHARED — wordmark, color accent row, bottom nav
// ============================================================
function Wordmark() {
  return (
    <div className="px-6 pt-6 pb-2 flex items-center justify-between rise rise-1">
      <div className="wordmark">what to wear</div>
      <div className="text-[11px] tracking-[0.2em] uppercase text-terracotta/55 font-medium">
        SS&nbsp;26
      </div>
    </div>
  );
}

function AccentRow() {
  return (
    <div className="px-6 mt-5 accent-row rise rise-2">
      <div className="accent-dot" style={{ background: "var(--picante)" }} />
      <div className="accent-dot" style={{ background: "var(--hibiscus)" }} />
      <div className="accent-dot" style={{ background: "var(--citrus)" }} />
      <div className="accent-bar" />
      <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">
        Issue&nbsp;01
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "stylist",  label: "Stylist" },
    { id: "closet",   label: "Closet" },
    { id: "add",      label: "Add" },
    { id: "returned", label: "Returns" },
    { id: "taste",    label: "Taste" },
  ];
  return (
    <nav className="fixed left-0 right-0 bottom-0 bg-saltCream">
      <div className="phone-shell !pb-0 !min-h-0">
        <div className="relative h-[80px] px-6">
          <div className="nav-line top-[12px]" />
          <div className="flex items-start justify-between pt-[20px]">
            {tabs.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-[6px] h-[6px] rounded-full transition-all ${
                      active ? "bg-picante scale-100" : "bg-terracotta/25 scale-75 group-hover:bg-terracotta/50"
                    }`}
                  />
                  <span
                    className={`text-[11px] tracking-[0.06em] font-medium transition-colors ${
                      active ? "text-terracotta" : "text-terracotta/55 group-hover:text-terracotta/80"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// STYLIST SCREEN — frame 26:2 spec
// ============================================================
function StylistScreen({
  items, feedback, onFeedback,
}: {
  items: Item[]; feedback: Feedback[]; onFeedback: (f: Feedback) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [outfitText, setOutfitText] = useState("");
  const [error, setError] = useState("");
  const [lastTaggedIds, setLastTaggedIds] = useState<string[]>([]);
  const [thanks, setThanks] = useState("");

  const chips = [
    { label: "Drinks Saturday", q: "Drinks Saturday in SoHo, going out, elevated but easy." },
    { label: "Pilates → coffee", q: "Pilates → coffee → casual lunch. Athleisure that doesn't look like I rolled out of bed." },
    { label: "Flying back to LA", q: "Flying back to LA tomorrow — comfortable, layered, looks pulled-together at LAX." },
  ];

  async function go(prompt?: string) {
    const text = (prompt ?? q).trim();
    if (!text) return;
    setQ(text);
    setLoading(true); setOutfitText(""); setError(""); setThanks("");
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion: text, items, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stylist hit an error");
      setOutfitText(data.text || "");
      const lower = (data.text || "").toLowerCase();
      const tagged = items
        .filter(i => lower.includes(i.name.split("—")[0].trim().slice(0, 18).toLowerCase()))
        .map(i => i.id);
      setLastTaggedIds(tagged);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function rate(rating: "like" | "dislike" | "wore") {
    onFeedback({ rating, occasion: q, outfitText, itemIds: lastTaggedIds, ts: Date.now() });
    const msgs = {
      like: "Got it — banked. The next one will lean this direction.",
      dislike: "Filed under 'not me' — I'll steer clear next time.",
      wore: "Best signal there is. I'll weight this heavy.",
    };
    setThanks(msgs[rating]);
  }

  // Pick 4 items to show as the "outfit" — first 4 from tagged, fall back to seed picks
  const outfitItems = (() => {
    if (outfitText && lastTaggedIds.length) {
      return items.filter(i => lastTaggedIds.includes(i.id)).slice(0, 4);
    }
    if (outfitText) return items.slice(0, 4);
    return [];
  })();

  return (
    <div className="rise rise-3">
      {/* Title block */}
      <div className="px-6 pt-3">
        <div className="section-num">01 · The Stylist</div>
        <h1 className="display-title mt-2">
          What&rsquo;s the<br />
          <em className="not-italic">vibe?</em>
        </h1>
      </div>

      <AccentRow />

      {/* Vibe input */}
      <div className="px-6 mt-7">
        <textarea
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } }}
          placeholder="drinks Saturday in SoHo…"
          rows={2}
          className="w-full bg-swatchBeige border border-terracotta/15 rounded-2xl px-4 py-3 text-[15px] placeholder:text-terracotta/40 focus:border-terracotta/40 outline-none resize-none transition-colors"
        />

        {/* Suggestion chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {chips.map((c, i) => (
            <button
              key={c.label}
              onClick={() => go(c.q)}
              className={`chip ${i === 0 ? "chip-hibiscus" : i === 1 ? "chip-citrus" : "chip-picante"} hover:opacity-90 transition-opacity`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Style me button */}
        <button
          onClick={() => go()}
          disabled={loading || !q.trim()}
          className="mt-4 w-full bg-terracotta text-saltCream rounded-2xl py-3.5 text-[13px] tracking-[0.16em] uppercase font-medium hover:bg-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <span className="inline-flex items-center"><span className="spinner" style={{ borderTopColor: "#fff8ea", borderColor: "rgba(255,248,234,0.3)", borderTopWidth: "1.5px" }} />Considering…</span> : "Style me"}
        </button>
        {loading && (
          <div className="mt-3 text-[12px] text-terracotta/60 font-serif italic thinking text-center">
            Reading your closet, weighing what you&rsquo;ve loved…
          </div>
        )}
        {error && <div className="mt-3 text-[12px] text-picante font-serif italic">{error}</div>}
      </div>

      {/* Stylist prose response */}
      {outfitText && (
        <>
          <div className="px-6 mt-8">
            <div className="section-num">02 · The recommendation</div>
            <div className="mt-3 bg-swatchBeige rounded-2xl p-5 stylist-prose">
              {outfitText}
            </div>
          </div>

          {/* 4-item outfit row */}
          {outfitItems.length > 0 && (
            <div className="px-6 mt-6">
              <div className="section-num">03 · Pulling from your closet</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {outfitItems.map(it => <OutfitItemCard key={it.id} item={it} />)}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 mt-6 grid grid-cols-3 gap-2">
            <ActionBtn label="Love it"      onClick={() => rate("like")}    tone="hibiscus" />
            <ActionBtn label="Not me"       onClick={() => rate("dislike")} tone="ghost" />
            <ActionBtn label="I wore this"  onClick={() => rate("wore")}    tone="picante" />
          </div>
          {thanks && (
            <div className="px-6 mt-3 text-[13px] font-serif italic text-terracotta/70 text-center">
              {thanks}
            </div>
          )}
        </>
      )}

      {/* Empty state — soft prompt */}
      {!outfitText && !loading && (
        <div className="px-6 mt-10">
          <div className="bg-swatchBeige rounded-2xl p-5">
            <div className="font-serif italic text-[16px] text-terracotta/80 leading-snug">
              Tell me where you&rsquo;re going and I&rsquo;ll pull from your closet.
              The more you react to outfits, the sharper I get.
            </div>
            <div className="mt-3 text-[11px] tracking-[0.16em] uppercase text-terracotta/50 font-medium">
              {feedback.length} signals · {items.length} pieces in rotation
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OutfitItemCard({ item }: { item: Item }) {
  return (
    <div className="bg-swatchBeige rounded-2xl overflow-hidden border border-terracotta/8">
      <div
        className="aspect-[4/5] flex items-end justify-start p-3"
        style={{ background: item.colorHex }}
      >
        <div
          className="font-serif italic text-[12px] tracking-wide"
          style={{ color: isDark(item.colorHex) ? "#fff8ea" : "#71241a", opacity: 0.85 }}
        >
          {item.brand}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12px] font-medium leading-tight text-terracotta truncate">{item.name}</div>
        <div className="text-[11px] text-terracotta/55 font-serif italic mt-0.5">{item.color}</div>
      </div>
    </div>
  );
}

function ActionBtn({
  label, onClick, tone,
}: {
  label: string; onClick: () => void; tone: "hibiscus" | "picante" | "ghost";
}) {
  const cls = tone === "picante"
    ? "bg-picante text-saltCream border-picante hover:opacity-90"
    : tone === "hibiscus"
    ? "bg-hibiscus text-saltCream border-hibiscus hover:opacity-90"
    : "bg-transparent text-terracotta border-terracotta/25 hover:border-terracotta/50";
  return (
    <button
      onClick={onClick}
      className={`rounded-full border py-2.5 text-[12px] font-medium tracking-[0.04em] transition-all ${cls}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// CLOSET SCREEN — frame 25:2
// ============================================================
function ClosetScreen({ items, onReturn }: { items: Item[]; onReturn: (id: string) => void }) {
  const [activeCat, setActiveCat] = useState("all");
  const cats = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = activeCat === "all" ? items : items.filter(i => i.category === activeCat);
  const totalSpend = items.reduce((s, i) => s + (i.price || 0), 0);

  return (
    <div className="rise rise-3">
      <div className="px-6 pt-3">
        <div className="section-num">02 · The Closet</div>
        <h1 className="display-title mt-2">
          {items.length}<br />
          <em className="not-italic">pieces.</em>
        </h1>
      </div>

      <AccentRow />

      {/* Stats line */}
      <div className="px-6 mt-5 flex items-baseline gap-5">
        <Stat n={new Set(items.map(i => i.brand)).size} l="brands" />
        <Stat n={new Set(items.map(i => i.category)).size} l="categories" />
        <Stat n={`$${Math.round(totalSpend)}`} l="value" />
      </div>

      {/* Category chips */}
      <div className="px-6 mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {cats.map((c, i) => {
          const active = c === activeCat;
          const tone = i === 0 ? "" : i === 1 ? "chip-hibiscus" : i === 2 ? "chip-citrus" : i === 3 ? "chip-picante" : "chip-gold";
          return (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`chip ${active ? tone : ""} ${active ? "" : "opacity-60 hover:opacity-100"} transition-opacity`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Item grid */}
      <div className="px-6 mt-5 grid grid-cols-2 gap-3">
        {filtered.map(it => <ClosetCard key={it.id} item={it} onReturn={onReturn} />)}
      </div>
      {filtered.length === 0 && (
        <div className="px-6 mt-10 text-center font-serif italic text-terracotta/50 text-base">
          Nothing here in this filter.
        </div>
      )}
    </div>
  );
}

function ClosetCard({ item, onReturn }: { item: Item; onReturn: (id: string) => void }) {
  return (
    <div className="bg-swatchBeige rounded-2xl overflow-hidden border border-terracotta/8 group">
      <div className="aspect-[4/5] relative" style={{ background: item.colorHex }}>
        <div
          className="absolute bottom-3 left-3 font-serif italic text-[12px] tracking-wide"
          style={{ color: isDark(item.colorHex) ? "#fff8ea" : "#71241a", opacity: 0.85 }}
        >
          {item.brand}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12px] font-medium leading-tight text-terracotta truncate">{item.name}</div>
        <div className="flex items-baseline justify-between mt-0.5">
          <div className="text-[11px] text-terracotta/55 font-serif italic">{item.color} · {item.size}</div>
          {item.price ? <div className="text-[11px] text-terracotta/45">${item.price.toFixed(0)}</div> : null}
        </div>
        <button
          onClick={() => onReturn(item.id)}
          className="mt-2 w-full text-[10px] tracking-[0.14em] uppercase text-terracotta/45 hover:text-picante transition-colors"
        >
          I don&apos;t have this
        </button>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: any; l: string }) {
  return (
    <div>
      <div className="font-serif text-[20px] leading-none text-terracotta">{n}</div>
      <div className="text-[10px] tracking-[0.14em] uppercase text-terracotta/55 mt-1 font-medium">{l}</div>
    </div>
  );
}

// ============================================================
// ADD SCREEN — frame 25:74
// ============================================================
function AddScreen({ onParsed, onDone }: { onParsed: (items: Item[]) => void; onDone: () => void }) {
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Item[] | null>(null);
  const [error, setError] = useState("");

  async function parse() {
    if (!emailText.trim()) return;
    setLoading(true); setError(""); setParsed(null);
    try {
      const res = await fetch("/api/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse");
      setParsed(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function confirm() {
    if (parsed) onParsed(parsed);
    setEmailText(""); setParsed(null);
    onDone();
  }

  return (
    <div className="rise rise-3">
      <div className="px-6 pt-3">
        <div className="section-num">03 · Add an item</div>
        <h1 className="display-title mt-2">
          Paste an<br />
          <em className="not-italic">order email.</em>
        </h1>
      </div>

      <AccentRow />

      <div className="px-6 mt-7">
        <p className="font-serif italic text-[15px] text-terracotta/75 leading-snug">
          Open your last Reformation, SKIMS, Free People, Sézane, or Aritzia receipt.
          Select all, paste below — I&rsquo;ll extract the pieces.
        </p>

        <textarea
          value={emailText}
          onChange={e => setEmailText(e.target.value)}
          placeholder="Paste the entire order email here…"
          className="w-full mt-4 bg-swatchBeige border border-terracotta/15 rounded-2xl px-4 py-3 text-[12px] font-mono leading-relaxed min-h-[180px] placeholder:text-terracotta/40 focus:border-terracotta/40 outline-none resize-y transition-colors"
        />

        <button
          onClick={parse}
          disabled={loading || !emailText.trim()}
          className="mt-4 w-full bg-terracotta text-saltCream rounded-2xl py-3.5 text-[13px] tracking-[0.16em] uppercase font-medium hover:bg-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <span className="inline-flex items-center"><span className="spinner" style={{ borderTopColor: "#fff8ea", borderColor: "rgba(255,248,234,0.3)", borderTopWidth: "1.5px" }} />Reading…</span> : "Extract items"}
        </button>

        {loading && (
          <div className="mt-3 text-[12px] text-terracotta/60 font-serif italic thinking text-center">
            Parsing the order, naming the colors…
          </div>
        )}
        {error && <div className="mt-3 text-[12px] text-picante font-serif italic">{error}</div>}
      </div>

      {parsed && (
        <div className="px-6 mt-8">
          <div className="section-num">04 · Found {parsed.length} item{parsed.length === 1 ? "" : "s"}</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {parsed.map(it => <OutfitItemCard key={it.id} item={it} />)}
          </div>
          <button
            onClick={confirm}
            className="mt-4 w-full bg-citrus text-terracotta rounded-2xl py-3.5 text-[13px] tracking-[0.16em] uppercase font-medium hover:opacity-90 transition-opacity"
          >
            Add to my closet
          </button>
        </div>
      )}

      {/* Helper chips */}
      {!parsed && !loading && (
        <div className="px-6 mt-6 flex flex-wrap gap-2">
          <span className="chip chip-hibiscus">Reformation</span>
          <span className="chip chip-citrus">Free People</span>
          <span className="chip chip-picante">SKIMS</span>
          <span className="chip chip-gold">Sézane</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// RETURN SCREEN — frame 25:97
// ============================================================
function ReturnScreen({ items, onRestore }: { items: Item[]; onRestore: (id: string) => void }) {
  return (
    <div className="rise rise-3">
      <div className="px-6 pt-3">
        <div className="section-num">04 · Returns</div>
        <h1 className="display-title mt-2">
          Sent<br />
          <em className="not-italic">back.</em>
        </h1>
      </div>

      <AccentRow />

      <div className="px-6 mt-6">
        <p className="font-serif italic text-[15px] text-terracotta/75 leading-snug">
          Pieces you returned or no longer have. The stylist won&rsquo;t suggest these.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="px-6 mt-10 bg-swatchBeige rounded-2xl mx-6 p-6 text-center">
          <div className="font-serif italic text-[16px] text-terracotta/70 leading-snug">
            No returns yet. Tap &ldquo;I don&rsquo;t have this&rdquo; on a closet card to move it here.
          </div>
        </div>
      ) : (
        <div className="px-6 mt-5 grid grid-cols-2 gap-3">
          {items.map(it => <ReturnCard key={it.id} item={it} onRestore={onRestore} />)}
        </div>
      )}
    </div>
  );
}

function ReturnCard({ item, onRestore }: { item: Item; onRestore: (id: string) => void }) {
  return (
    <div className="bg-swatchBeige rounded-2xl overflow-hidden border border-terracotta/8 opacity-70">
      <div className="aspect-[4/5] relative" style={{ background: item.colorHex }}>
        <div className="absolute inset-0 bg-saltCream/40" />
        <div
          className="absolute bottom-3 left-3 font-serif italic text-[12px] tracking-wide"
          style={{ color: isDark(item.colorHex) ? "#fff8ea" : "#71241a", opacity: 0.85 }}
        >
          {item.brand}
        </div>
        <div className="absolute top-3 right-3 chip chip-picante text-[10px] py-1 px-2.5">
          returned
        </div>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12px] font-medium leading-tight text-terracotta truncate">{item.name}</div>
        <div className="text-[11px] text-terracotta/55 font-serif italic mt-0.5">{item.color}</div>
        <button
          onClick={() => onRestore(item.id)}
          className="mt-2 w-full text-[10px] tracking-[0.14em] uppercase text-terracotta/45 hover:text-citrus transition-colors"
        >
          Restore
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TASTE SCREEN — frame 25:152
// ============================================================
function TasteScreen({ feedback, wardrobe }: { feedback: Feedback[]; wardrobe: Item[] }) {
  const liked = feedback.filter(f => f.rating === "like" || f.rating === "wore");
  const disliked = feedback.filter(f => f.rating === "dislike");

  const brandCount: Record<string, number> = {};
  const colorCount: Record<string, number> = {};
  const vibeCount: Record<string, number> = {};
  liked.forEach(f => f.itemIds.forEach(id => {
    const it = wardrobe.find(x => x.id === id); if (!it) return;
    brandCount[it.brand] = (brandCount[it.brand] ?? 0) + 1;
    colorCount[it.colorHex] = (colorCount[it.colorHex] ?? 0) + 1;
    it.vibe.forEach(v => vibeCount[v] = (vibeCount[v] ?? 0) + 1);
  }));

  // Default seed vibes/brands so the screen looks alive even pre-feedback
  const seedVibes = ["casual", "athleisure", "elevated"];
  const vibes = Object.entries(vibeCount).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const displayVibes = vibes.length ? vibes.map(([v]) => v) : seedVibes;

  const brands = Object.entries(brandCount).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const seedBrands = ["Reformation", "Alo Yoga", "Free People", "SKIMS"];
  const displayBrands = brands.length ? brands.map(([b]) => b) : seedBrands;

  const colors = Object.entries(colorCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const seedColors = ["#0a0a0a", "#5a3e2a", "#c9a37a", "#f5ecd9", "#2a3552", "#d4b896"];
  const displayColors = colors.length ? colors.map(([c]) => c) : seedColors;

  const avoidance: string[] = [];
  disliked.forEach(f => {
    const blob = (f.occasion + " " + f.outfitText).toLowerCase();
    if (/leather/.test(blob) && !avoidance.includes("leather")) avoidance.push("leather");
    if (/(jean|denim)/.test(f.occasion.toLowerCase()) && !avoidance.includes("denim when she said no jeans")) {
      avoidance.push("denim when she said no jeans");
    }
  });

  return (
    <div className="rise rise-3">
      <div className="px-6 pt-3">
        <div className="section-num">05 · Your Taste</div>
        <h1 className="display-title mt-2">
          What you<br />
          <em className="not-italic">actually wear.</em>
        </h1>
      </div>

      <AccentRow />

      <div className="px-6 mt-5 flex items-baseline gap-5">
        <Stat n={liked.length} l="loved" />
        <Stat n={feedback.filter(f => f.rating === "wore").length} l="worn" />
        <Stat n={disliked.length} l="not me" />
      </div>

      {/* Section 01 — brands */}
      <div className="px-6 mt-7">
        <div className="text-[11px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">01 · Brands you reach for</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {displayBrands.map((b, i) => (
            <span
              key={b}
              className={`chip ${i === 0 ? "chip-hibiscus" : i === 1 ? "chip-citrus" : i === 2 ? "chip-picante" : "chip-gold"}`}
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Section 02 — vibes */}
      <div className="px-6 mt-6">
        <div className="text-[11px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">02 · Vibes that win</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {displayVibes.map((v, i) => (
            <span
              key={v}
              className={`chip ${i === 0 ? "chip-citrus" : i === 1 ? "chip-hibiscus" : "chip-gold"}`}
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Section 03 — colorway */}
      <div className="px-6 mt-6">
        <div className="text-[11px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">03 · Your colorway</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {displayColors.map(c => (
            <div
              key={c}
              className="w-9 h-9 rounded-full border border-terracotta/15"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Section 04 — what I won't recommend */}
      <div className="px-6 mt-6">
        <div className="text-[11px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">04 · What I won&rsquo;t suggest</div>
        <div className="mt-2 bg-swatchBeige rounded-2xl p-4">
          {avoidance.length === 0 ? (
            <div className="font-serif italic text-[14px] text-terracotta/65 leading-snug">
              Nothing yet. Mark a few outfits &ldquo;Not me&rdquo; and I&rsquo;ll catch the pattern.
            </div>
          ) : (
            <div className="font-serif italic text-[15px] text-terracotta/85 leading-relaxed">
              {avoidance.map(a => <div key={a}>— {a}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// UTIL
// ============================================================
function isDark(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}
