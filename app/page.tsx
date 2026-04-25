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

// ============================================================
// SEED CLOSET — the demo wardrobe (Liv's actual order history)
// New users start with this so they can play immediately, then
// add their own via "Paste an email."
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

function gradient(item: Item) {
  const dark = ["#0a0a0a","#161616","#1a1a1a","#2a3552","#5a3e2a","#3d2818"].includes(item.colorHex);
  const text = dark ? "#f5f5f5" : "#2a2a2a";
  return { bg: `linear-gradient(135deg, ${item.colorHex} 0%, ${shade(item.colorHex, dark ? 0.15 : -0.1)} 100%)`, text };
}
function shade(hex: string, p: number): string {
  const n = parseInt(hex.replace("#",""),16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = Math.max(0, Math.min(255, Math.round(r + (p > 0 ? 255 - r : r) * p)));
  g = Math.max(0, Math.min(255, Math.round(g + (p > 0 ? 255 - g : g) * p)));
  b = Math.max(0, Math.min(255, Math.round(b + (p > 0 ? 255 - b : b) * p)));
  return "#" + [r,g,b].map(x => x.toString(16).padStart(2,"0")).join("");
}

// ============================================================
// MAIN
// ============================================================
export default function Page() {
  const [wardrobe, setWardrobe] = useState<Item[]>([]);
  const [returned, setReturned] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [tab, setTab] = useState<"stylist"|"closet"|"returned"|"taste"|"add">("stylist");
  const [hydrated, setHydrated] = useState(false);

  // Load state from localStorage
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

  // Persist
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

  function resetAll() {
    if (!confirm("Reset your closet to the demo wardrobe? This deletes any items you've added.")) return;
    setWardrobe(SEED_WARDROBE);
    setReturned(new Set());
    setFeedback([]);
  }

  if (!hydrated) {
    return (
      <div className="p-10 text-center font-editorial italic text-tea text-lg thinking">
        Setting the table…
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 md:py-14">
      <Header
        itemCount={activeItems.length}
        brandCount={new Set(activeItems.map(i => i.brand)).size}
        signalCount={feedback.length}
        onReset={resetAll}
      />
      <Tabs tab={tab} setTab={setTab} counts={{ closet: activeItems.length, returned: returnedItems.length, taste: feedback.length }} />

      {tab === "stylist" && (
        <Stylist
          items={activeItems}
          feedback={feedback}
          onFeedback={recordFeedback}
        />
      )}
      {tab === "closet" && (
        <Closet items={activeItems} onReturn={markReturned} />
      )}
      {tab === "returned" && (
        <Returned items={returnedItems} onRestore={restoreItem} />
      )}
      {tab === "taste" && (
        <Taste feedback={feedback} wardrobe={wardrobe} />
      )}
      {tab === "add" && (
        <AddItem onParsed={addItems} />
      )}
    </div>
  );
}

// ============================================================
// HEADER — editorial masthead
// ============================================================
function Header({
  itemCount, brandCount, signalCount, onReset,
}: {
  itemCount: number; brandCount: number; signalCount: number; onReset: () => void;
}) {
  return (
    <header className="mb-10 md:mb-14 rise rise-1">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="font-editorial italic text-tea text-base mb-2">
            a closet that knows you
          </div>
          <h1 className="font-serif text-[44px] md:text-[64px] leading-[0.95] m-0 -tracking-[1px] font-semibold text-ink">
            What&nbsp;to&nbsp;Wear
          </h1>
        </div>
        <button
          onClick={onReset}
          className="eyebrow text-tea hover:text-claret transition-colors mt-2"
          title="Wipe and reload the demo closet"
        >
          Reset closet
        </button>
      </div>

      {/* Editorial dateline — italic Cormorant tells the small story */}
      <div className="mt-5 font-editorial text-soot/80 text-[17px] leading-snug max-w-[520px]">
        <span className="font-serif font-medium text-ink">{itemCount}</span>
        <span className="italic"> pieces in rotation,</span>{" "}
        <span className="font-serif font-medium text-ink">{brandCount}</span>
        <span className="italic"> brands,</span>{" "}
        <span className="font-serif font-medium text-ink">{signalCount}</span>
        <span className="italic"> signals learned. Quietly building your taste.</span>
      </div>

      {/* Hairline rule */}
      <div className="mt-8 h-px bg-ink/15" />
    </header>
  );
}

// ============================================================
// TABS
// ============================================================
function Tabs({ tab, setTab, counts }: any) {
  const tabs = [
    { id: "stylist",  label: "The Stylist" },
    { id: "closet",   label: "Closet",   count: counts.closet },
    { id: "add",      label: "Add" },
    { id: "returned", label: "Returns",  count: counts.returned },
    { id: "taste",    label: "Taste",    count: counts.taste },
  ];
  return (
    <nav className="flex gap-6 md:gap-9 border-b border-ink/10 mb-10 overflow-x-auto rise rise-2">
      {tabs.map((t, i) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-underline ${active ? "is-active" : ""} pb-3 -mb-px whitespace-nowrap text-left transition-colors ${
              active ? "text-ink" : "text-tea hover:text-soot"
            }`}
          >
            <span className="block eyebrow">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-serif text-[17px] md:text-[19px] -tracking-[0.3px]">
              {t.label}
              {t.count !== undefined && (
                <sup className="ml-1.5 font-editorial italic text-[11px] text-tea">
                  {t.count}
                </sup>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ============================================================
// CLOSET
// ============================================================
function Closet({ items, onReturn }: { items: Item[]; onReturn: (id: string) => void }) {
  const [activeCat, setActiveCat] = useState("all");
  const [activeBrand, setActiveBrand] = useState("all");
  const cats = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const brands = ["all", ...Array.from(new Set(items.map(i => i.brand))).sort()];
  const filtered = items.filter(i =>
    (activeCat === "all" || i.category === activeCat) &&
    (activeBrand === "all" || i.brand === activeBrand)
  );
  const totalSpend = items.reduce((s,i) => s + (i.price || 0), 0);

  return (
    <div className="rise rise-3">
      <Stats stats={[
        { num: items.length, lbl: "In rotation" },
        { num: new Set(items.map(i=>i.brand)).size, lbl: "Brands" },
        { num: new Set(items.map(i=>i.category)).size, lbl: "Categories" },
        { num: `$${totalSpend.toFixed(0)}`, lbl: "Closet value" },
      ]} />
      <div className="space-y-2 mb-7">
        <FilterBar options={cats} active={activeCat} onChange={setActiveCat} />
        <FilterBar options={brands} active={activeBrand} onChange={setActiveBrand} />
      </div>
      <div className="grid gap-5 md:gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
        {filtered.map(item => <Card key={item.id} item={item} onReturn={onReturn} />)}
      </div>
      {filtered.length === 0 && (
        <div className="font-editorial italic text-tea text-lg py-12 text-center">
          Nothing here in this filter — try clearing it.
        </div>
      )}
    </div>
  );
}

function Returned({ items, onRestore }: { items: Item[]; onRestore: (id: string) => void }) {
  return (
    <div className="rise rise-3">
      <p className="font-editorial italic text-tea text-lg mb-7">
        Items you returned, sent back, or no longer have. The stylist won't suggest these.
      </p>
      {items.length === 0 ? (
        <div className="font-editorial italic text-tea/80 text-base py-12 text-center">
          No returns yet. Tap &ldquo;I don&apos;t have this&rdquo; on a closet card to move it here.
        </div>
      ) : (
        <div className="grid gap-5 md:gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
          {items.map(item => <Card key={item.id} item={item} returned onRestore={onRestore} />)}
        </div>
      )}
    </div>
  );
}

function Card({ item, returned, onReturn, onRestore }: {
  item: Item; returned?: boolean;
  onReturn?: (id: string) => void; onRestore?: (id: string) => void;
}) {
  const g = gradient(item);
  return (
    <div className={`group bg-paper relative lift ${returned ? "opacity-55" : ""}`}>
      {/* Image */}
      <div
        className="relative w-full aspect-[4/5] flex items-end justify-start"
        style={{ background: g.bg }}
      >
        {/* Subtle inner texture for the gradient */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(at 30% 20%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(at 80% 90%, rgba(0,0,0,0.18), transparent 55%)",
          }}
        />
        <div
          className="relative font-serif italic text-[15px] tracking-wide px-5 py-5"
          style={{ color: g.text, opacity: 0.78 }}
        >
          {item.brand}
        </div>
        {returned && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px] bg-black/35 text-cream text-[10px] tracking-[0.4em] font-medium">
            RETURNED
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="eyebrow text-tea truncate">{item.brand}</div>
          {item.price ? (
            <div className="font-editorial italic text-[13px] text-tea shrink-0">
              ${item.price.toFixed(0)}
            </div>
          ) : null}
        </div>
        <div className="font-serif text-[15px] leading-snug mt-1 text-soot">
          {item.name}
        </div>
        <div className="font-editorial italic text-[13px] text-cocoa mt-1.5">
          {item.color} · size {item.size}
        </div>

        {item.vibe.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1">
            {item.vibe.map(v => (
              <span key={v} className="font-editorial italic text-[12px] text-tea">
                {v}
              </span>
            ))}
          </div>
        )}

        {!returned && onReturn && (
          <button
            onClick={() => onReturn(item.id)}
            className="mt-4 pt-3 w-full border-t border-ink/8 eyebrow text-tea hover:text-claret transition-colors"
            title="Move to Returns"
          >
            I don&apos;t have this
          </button>
        )}
        {returned && onRestore && (
          <button
            onClick={() => onRestore(item.id)}
            className="mt-4 pt-3 w-full border-t border-ink/8 eyebrow text-tea hover:text-soot transition-colors"
          >
            Restore to closet
          </button>
        )}
      </div>
    </div>
  );
}

function FilterBar({ options, active, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {options.map((o: string) => {
        const isActive = o === active;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`text-[13px] tracking-wide pb-0.5 transition-colors ${
              isActive
                ? "text-ink border-b border-ink"
                : "text-tea hover:text-soot border-b border-transparent"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Stats({ stats }: { stats: { num: any; lbl: string }[] }) {
  return (
    <div className="grid gap-x-8 gap-y-5 mb-9 grid-cols-2 md:grid-cols-4">
      {stats.map((s,i) => (
        <div key={i} className="border-l border-ink/15 pl-4">
          <div className="font-serif text-[34px] leading-none font-semibold text-ink">{s.num}</div>
          <div className="eyebrow text-tea mt-2">{s.lbl}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STYLIST
// ============================================================
function Stylist({ items, feedback, onFeedback }: { items: Item[]; feedback: Feedback[]; onFeedback: (f: Feedback) => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [outfitText, setOutfitText] = useState("");
  const [error, setError] = useState("");
  const [lastTaggedIds, setLastTaggedIds] = useState<string[]>([]);
  const [thanks, setThanks] = useState("");

  const suggestions = [
    { label: "Dinner out", q: "Dinner Saturday in West Hollywood — going out, elevated but comfortable. No jeans, no leather." },
    { label: "Pilates → coffee", q: "Pilates → coffee → casual lunch with a friend. Athleisure that doesn't look like I just rolled out of bed." },
    { label: "Beach day", q: "Beach day in Manhattan Beach. Bring something to throw on if it gets cool." },
    { label: "Date night", q: "Date night, somewhere romantic. Feminine and a little flirty, not too dressy." },
    { label: "WFH + Zoom", q: "WFH all day but a Zoom in the afternoon. Top-half-only matters." },
  ];

  async function go() {
    if (!q.trim()) return;
    setLoading(true); setOutfitText(""); setError(""); setThanks("");
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion: q, items, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stylist hit an error");
      setOutfitText(data.text || "");
      // Heuristically tag items mentioned in the outfit
      const text = (data.text || "").toLowerCase();
      const tagged = items
        .filter(i => text.includes(i.name.split("—")[0].trim().slice(0, 18).toLowerCase()))
        .map(i => i.id);
      setLastTaggedIds(tagged);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function rate(rating: "like"|"dislike"|"wore") {
    onFeedback({ rating, occasion: q, outfitText, itemIds: lastTaggedIds, ts: Date.now() });
    const msgs = {
      like: "Got it — banked. The next one will lean this direction.",
      dislike: "Filed under 'not me' — I'll steer clear next time.",
      wore: "Best signal there is. I'll weight this heavy.",
    };
    setThanks(msgs[rating]);
  }

  return (
    <section className="rise rise-3">
      <div className="grid md:grid-cols-[1fr_auto] gap-3 items-baseline mb-3">
        <div className="font-editorial italic text-tea text-lg">
          Tell me about the occasion. The more I know your taste, the better I get.
        </div>
        <div className="eyebrow text-tea hidden md:block">Volume {feedback.length + 1}</div>
      </div>

      <textarea
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Dinner Saturday in West Hollywood, going-out vibe, no leather, no jeans…"
        className="w-full font-editorial text-[20px] italic placeholder:italic placeholder:text-tea/70 leading-snug bg-transparent border-0 border-b border-ink/20 focus:border-ink py-3 outline-none transition-colors resize-none min-h-[90px]"
      />

      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {suggestions.map(s => (
          <button
            key={s.label}
            onClick={() => setQ(s.q)}
            className="font-editorial italic text-[15px] text-cocoa hover:text-claret transition-colors"
          >
            — {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-7">
        <button
          onClick={go}
          disabled={loading || !q.trim()}
          className="bg-ink text-cream px-7 py-3.5 text-sm tracking-[0.18em] uppercase font-medium hover:bg-soot disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center"><span className="spinner" />Considering…</span>
          ) : (
            "Style me"
          )}
        </button>
        {loading && (
          <span className="font-editorial italic text-tea thinking">
            Reading your closet, weighing what you've loved…
          </span>
        )}
      </div>

      {error && <div className="text-claret text-sm mt-4 font-editorial italic">{error}</div>}

      {outfitText && (
        <article className="mt-12 grid md:grid-cols-[auto_1fr] gap-x-10">
          <aside className="hidden md:block">
            <div className="eyebrow text-tea writing-mode-vertical-rl pt-2" style={{ writingMode: "vertical-rl" }}>
              The recommendation · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </div>
          </aside>
          <div>
            <div className="eyebrow text-claret mb-3 md:hidden">The recommendation</div>
            <div className="bg-paper px-7 md:px-10 py-9 md:py-12 border-y border-ink/10 outfit-prose">
              {outfitText}
            </div>
            <div className="flex gap-3 mt-7 items-center flex-wrap">
              <span className="eyebrow text-tea mr-2">How was that?</span>
              <FeedbackPill onClick={() => rate("like")}    label="Love it" />
              <FeedbackPill onClick={() => rate("dislike")} label="Not me" muted />
              <FeedbackPill onClick={() => rate("wore")}    label="I wore this" accent />
              {thanks && (
                <span className="font-editorial italic text-claret text-base">{thanks}</span>
              )}
            </div>
          </div>
        </article>
      )}
    </section>
  );
}

function FeedbackPill({ label, onClick, muted, accent }: { label: string; onClick: () => void; muted?: boolean; accent?: boolean; }) {
  const base = "px-5 py-2 text-[13px] tracking-wider uppercase border transition-colors";
  const tone = accent
    ? "bg-claret text-cream border-claret hover:bg-[#5a2025]"
    : muted
    ? "bg-transparent text-tea border-ink/15 hover:border-ink/40 hover:text-soot"
    : "bg-transparent text-soot border-ink/25 hover:bg-ink hover:text-cream";
  return <button onClick={onClick} className={`${base} ${tone}`}>{label}</button>;
}

// ============================================================
// TASTE
// ============================================================
function Taste({ feedback, wardrobe }: { feedback: Feedback[]; wardrobe: Item[] }) {
  if (feedback.length === 0) {
    return (
      <div className="rise rise-3 py-16 text-center max-w-[480px] mx-auto">
        <div className="eyebrow text-claret mb-4">The taste profile</div>
        <p className="font-editorial italic text-soot text-2xl leading-snug">
          Nothing yet — react to a few outfits and the stylist starts learning what's
          actually <em>you</em> versus what just looks nice on paper.
        </p>
      </div>
    );
  }

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
  const avoidance = new Set<string>();
  disliked.forEach(f => {
    if (/leather/i.test(f.occasion + " " + f.outfitText)) avoidance.add("leather");
    if (/jean|denim/i.test(f.occasion)) avoidance.add("denim when she said no jeans");
  });

  const brands = Object.entries(brandCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxBrand = Math.max(...brands.map(b => b[1]), 1);
  const vibes = Object.entries(vibeCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxVibe = Math.max(...vibes.map(v => v[1]), 1);
  const colors = Object.entries(colorCount).sort((a,b)=>b[1]-a[1]).slice(0,8);

  return (
    <div className="rise rise-3">
      <Stats stats={[
        { num: liked.length, lbl: "Loved" },
        { num: feedback.filter(f=>f.rating==="wore").length, lbl: "Actually wore" },
        { num: disliked.length, lbl: "Not me" },
        { num: feedback.length, lbl: "Signals total" },
      ]} />
      <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
        <TasteCard title="Brands you reach for" number="01">
          {brands.length === 0 && <Empty>No brand signal yet.</Empty>}
          {brands.map(([b,c]) => <Bar key={b} label={b} val={c} max={maxBrand} />)}
        </TasteCard>
        <TasteCard title="Vibes that win" number="02">
          {vibes.length === 0 && <Empty>No vibe signal yet.</Empty>}
          {vibes.map(([v,c]) => <Bar key={v} label={v} val={c} max={maxVibe} />)}
        </TasteCard>
        <TasteCard title="Your colorway" number="03">
          {colors.length === 0 ? <Empty>—</Empty> : (
            <div className="flex flex-wrap gap-2 mt-1">
              {colors.map(([c,n]) => (
                <div
                  key={c}
                  className="w-9 h-9 rounded-full border border-ink/10"
                  style={{ background: c }}
                  title={`${n} hits`}
                />
              ))}
            </div>
          )}
        </TasteCard>
        <TasteCard title="What I won't recommend again" number="04">
          {[...avoidance].length === 0 ? (
            <Empty>Mark some things &ldquo;Not me&rdquo; and I&apos;ll catch the pattern.</Empty>
          ) : (
            <div className="font-editorial italic text-[17px] text-soot leading-relaxed">
              {[...avoidance].map(a => <div key={a}>— {a}</div>)}
            </div>
          )}
        </TasteCard>
      </div>
    </div>
  );
}
const TasteCard = ({ title, number, children }: any) => (
  <section>
    <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-ink/15">
      <span className="font-serif text-[28px] font-semibold text-ink leading-none">{number}</span>
      <h4 className="m-0 font-editorial italic text-[19px] text-soot">{title}</h4>
    </div>
    {children}
  </section>
);
const Empty = ({ children }: any) => (
  <div className="font-editorial italic text-tea text-[15px] py-4">{children}</div>
);
const Bar = ({ label, val, max }: any) => (
  <div className="flex items-center gap-3 mb-3 text-sm">
    <div className="w-28 shrink-0 font-editorial italic text-soot text-[15px]">{label}</div>
    <div className="flex-1 h-px bg-ink/10 relative">
      <div
        className="absolute inset-y-[-1px] left-0 bg-claret"
        style={{ width: `${(val/max)*100}%`, height: "3px", top: "-1px" }}
      />
    </div>
    <div className="w-6 text-right font-editorial italic text-[13px] text-tea">{val}</div>
  </div>
);

// ============================================================
// ADD ITEM (paste an order email)
// ============================================================
function AddItem({ onParsed }: { onParsed: (items: Item[]) => void }) {
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
    alert(`Added ${parsed?.length || 0} item${parsed?.length === 1 ? "" : "s"} to your closet!`);
  }

  return (
    <section className="rise rise-3">
      <div className="eyebrow text-claret mb-3">Submission</div>
      <h3 className="font-serif text-[32px] md:text-[40px] leading-tight mt-0 mb-3 font-semibold text-ink -tracking-[0.5px]">
        Add an item by pasting an order email.
      </h3>
      <p className="font-editorial italic text-soot/80 text-[18px] leading-snug mb-7 max-w-[640px]">
        Open your last Reformation, SKIMS, Free People, Selkie, Sézane, Anthropologie, or Aritzia
        order confirmation. Select all, paste below — Claude extracts the items.
      </p>

      <textarea
        value={emailText}
        onChange={e => setEmailText(e.target.value)}
        placeholder="Paste the entire order email here…"
        className="w-full text-[13px] font-mono resize-y min-h-[200px] bg-paper border border-ink/15 focus:border-ink/40 outline-none p-5 leading-relaxed transition-colors"
      />

      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={parse}
          disabled={loading || !emailText.trim()}
          className="bg-ink text-cream px-7 py-3.5 text-sm tracking-[0.18em] uppercase font-medium hover:bg-soot disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center"><span className="spinner" />Reading…</span>
          ) : (
            "Extract items"
          )}
        </button>
        {loading && (
          <span className="font-editorial italic text-tea thinking">
            Parsing the order, naming the colors…
          </span>
        )}
      </div>

      {error && <div className="text-claret text-sm mt-4 font-editorial italic">{error}</div>}

      {parsed && (
        <div className="mt-12 pt-10 border-t border-ink/15">
          <div className="flex items-baseline justify-between mb-7 flex-wrap gap-3">
            <div>
              <div className="eyebrow text-claret mb-2">Extracted</div>
              <h4 className="font-serif text-[26px] m-0 font-semibold text-ink">
                Found {parsed.length} item{parsed.length === 1 ? "" : "s"}.
              </h4>
            </div>
            <button
              onClick={confirm}
              className="bg-ink text-cream px-6 py-3 text-sm tracking-[0.18em] uppercase font-medium hover:bg-soot transition-colors"
            >
              Add to my closet
            </button>
          </div>
          <div className="grid gap-5 md:gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
            {parsed.map(item => <Card key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </section>
  );
}
