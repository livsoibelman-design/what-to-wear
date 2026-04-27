"use client";

import { useState, useEffect, useMemo, useRef } from "react";

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
};

type Feedback = {
  rating: "like" | "dislike" | "wore";
  occasion: string;
  outfitText: string;
  itemIds: string[];
  ts: number;
};

type StylistMemory = {
  q: string;
  outfitText: string;
  taggedIds: string[];
  ts: number;
};

type RemovalReason = "returned" | "gave-away";

type Tab = "stylist" | "closet" | "add" | "returned" | "taste";

type Toast = { id: number; msg: string; undo?: () => void } | null;

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
const EMPTY_STYLIST_MEMORY: StylistMemory = { q: "", outfitText: "", taggedIds: [], ts: 0 };

// ============================================================
// MAIN
// ============================================================
export default function Page() {
  const [wardrobe, setWardrobe] = useState<Item[]>([]);
  const [returned, setReturned] = useState<Set<string>>(new Set());
  const [removalReasons, setRemovalReasons] = useState<Record<string, RemovalReason>>({});
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stylistMemory, setStylistMemory] = useState<StylistMemory>(EMPTY_STYLIST_MEMORY);
  const [tab, setTab] = useState<Tab>("stylist");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setWardrobe(s.wardrobe ?? SEED_WARDROBE);
        setReturned(new Set(s.returned ?? []));
        setRemovalReasons(s.removalReasons ?? {});
        setFeedback(s.feedback ?? []);
        setStylistMemory(s.stylistMemory ?? EMPTY_STYLIST_MEMORY);
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
      wardrobe, returned: [...returned], removalReasons, feedback, stylistMemory,
    }));
  }, [wardrobe, returned, removalReasons, feedback, stylistMemory, hydrated]);

  const activeItems = useMemo(() => wardrobe.filter(i => !returned.has(i.id)), [wardrobe, returned]);
  const returnedItems = useMemo(() => wardrobe.filter(i => returned.has(i.id)), [wardrobe, returned]);

  function showToast(msg: string, undo?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    const id = Date.now();
    setToast({ id, msg, undo });
    toastTimer.current = setTimeout(() => {
      setToast(t => (t && t.id === id ? null : t));
    }, 5000);
  }

  function markReturned(id: string, reason: RemovalReason = "returned") {
    setReturned(prev => { const n = new Set(prev); n.add(id); return n; });
    setRemovalReasons(prev => ({ ...prev, [id]: reason }));
    showToast(reason === "gave-away" ? "Marked gave away." : "Moved to Returns.", () => {
      setReturned(prev => { const n = new Set(prev); n.delete(id); return n; });
      setRemovalReasons(prev => { const n = { ...prev }; delete n[id]; return n; });
      setToast(null);
    });
  }
  function setReason(id: string, reason: RemovalReason) {
    setRemovalReasons(prev => ({ ...prev, [id]: reason }));
  }
  function restoreItem(id: string) {
    setReturned(prev => { const n = new Set(prev); n.delete(id); return n; });
    setRemovalReasons(prev => { const n = { ...prev }; delete n[id]; return n; });
    showToast("Back in rotation.");
  }
  function addItems(newItems: Item[]) {
    const existing = new Set(wardrobe.map(i => i.id));
    const stamped = newItems.map(i => ({ ...i, id: existing.has(i.id) ? i.id + "-" + Date.now() : i.id }));
    setWardrobe([...wardrobe, ...stamped]);
    showToast(`Added ${stamped.length} piece${stamped.length === 1 ? "" : "s"}.`);
  }
  function recordFeedback(f: Feedback) { setFeedback([...feedback, f]); }
  function rememberStylist(m: StylistMemory) { setStylistMemory(m); }
  function clearStylist() { setStylistMemory(EMPTY_STYLIST_MEMORY); }

  if (!hydrated) {
    return (
      <div className="phone-shell flex items-center justify-center">
        <div className="thinking text-terracotta text-sm tracking-[0.18em] uppercase">Setting the table…</div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <Wordmark />
      {tab === "stylist" && (
        <StylistScreen
          items={activeItems}
          feedback={feedback}
          memory={stylistMemory}
          onRemember={rememberStylist}
          onClearMemory={clearStylist}
          onFeedback={recordFeedback}
          onGoToAdd={() => setTab("add")}
        />
      )}
      {tab === "closet" && (
        <ClosetScreen
          items={activeItems}
          feedback={feedback}
          onReturn={markReturned}
          onGoToAdd={() => setTab("add")}
        />
      )}
      {tab === "add" && (
        <AddScreen onParsed={addItems} onDone={() => setTab("closet")} />
      )}
      {tab === "returned" && (
        <ReturnScreen
          items={returnedItems}
          reasons={removalReasons}
          onRestore={restoreItem}
          onSetReason={setReason}
        />
      )}
      {tab === "taste" && (
        <TasteScreen feedback={feedback} wardrobe={wardrobe} />
      )}
      <BottomNav tab={tab} setTab={setTab} />
      {toast && <ToastBar toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ============================================================
// SHARED — wordmark, accent row, bottom nav, toast
// ============================================================
function Wordmark() {
  return (
    <div className="px-6 pt-7 pb-1 rise rise-1">
      <div className="wordmark">What to Wear</div>
    </div>
  );
}

function AccentRow() {
  return (
    <div className="px-6 mt-4 accent-row rise rise-2">
      <div className="accent-dot" style={{ background: "var(--picante)" }} />
      <div className="accent-dot" style={{ background: "var(--hibiscus)" }} />
      <div className="accent-dot" style={{ background: "var(--citrus)" }} />
      <div className="accent-bar" />
    </div>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "stylist",  label: "Stylist" },
    { id: "closet",   label: "Closet" },
    { id: "add",      label: "Add" },
    { id: "returned", label: "Return" },
    { id: "taste",    label: "Taste" },
  ];
  return (
    <nav className="fixed left-0 right-0 bottom-0 bg-saltCream">
      <div className="phone-shell !pb-0 !min-h-0">
        <div className="relative h-[80px] px-6">
          <div className="nav-line top-[14px]" />
          <div className="flex items-start justify-between pt-[24px]">
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
                    className={`text-[10px] tracking-[0.16em] uppercase font-medium transition-colors ${
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

function ToastBar({ toast, onDismiss }: { toast: NonNullable<Toast>; onDismiss: () => void }) {
  return (
    <div className="fixed left-0 right-0 bottom-[88px] flex justify-center pointer-events-none px-4 z-50">
      <div className="bg-terracotta text-saltCream rounded-full pl-5 pr-2 py-2 text-[13px] flex items-center gap-3 shadow-lg pointer-events-auto max-w-[360px]">
        <span className="font-medium">{toast.msg}</span>
        {toast.undo && (
          <button
            onClick={() => { toast.undo!(); onDismiss(); }}
            className="bg-saltCream/15 hover:bg-saltCream/25 rounded-full px-3 py-1 text-[11px] tracking-[0.14em] uppercase font-medium transition-colors"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLIST SCREEN — frame 26:2
// ============================================================
function StylistScreen({
  items, feedback, memory, onRemember, onClearMemory, onFeedback, onGoToAdd,
}: {
  items: Item[];
  feedback: Feedback[];
  memory: StylistMemory;
  onRemember: (m: StylistMemory) => void;
  onClearMemory: () => void;
  onFeedback: (f: Feedback) => void;
  onGoToAdd: () => void;
}) {
  const [q, setQ] = useState(memory.q);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState("");

  const outfitText = memory.outfitText;
  const lastTaggedIds = memory.taggedIds;

  const chips: { label: string; q: string }[] = [
    { label: "Brunch",  q: "Brunch in the West Village. Casual but pulled together." },
    { label: "Drinks",  q: "Drinks at a rooftop, golden hour. Going out, elevated but easy." },
    { label: "Date",    q: "Dinner date downtown. Romantic, a little more dressed." },
  ];

  async function go(prompt?: string) {
    const text = (prompt ?? q).trim();
    if (!text) return;
    if (items.length === 0) {
      setError("Your closet is empty — add a piece first.");
      return;
    }
    setQ(text);
    setLoading(true); setError(""); setThanks("");
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion: text, items, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stylist hit an error");
      const txt = data.text || "";
      const lower = txt.toLowerCase();
      const tagged = items
        .filter(i => lower.includes(i.name.split("—")[0].trim().slice(0, 18).toLowerCase()))
        .map(i => i.id);
      onRemember({ q: text, outfitText: txt, taggedIds: tagged, ts: Date.now() });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function rate(rating: "like" | "dislike" | "wore") {
    onFeedback({ rating, occasion: q, outfitText, itemIds: lastTaggedIds, ts: Date.now() });
    const msgs = {
      like:    "Got it — banked. Next one will lean this direction.",
      dislike: "Filed under 'remix' — I'll try a different angle.",
      wore:    "Best signal there is. Weighted heavy.",
    };
    setThanks(msgs[rating]);
  }

  // Compose: top, bottom, shoe, plus one
  const lookItems = useMemo(() => {
    if (!outfitText) return [];
    const tagged = items.filter(i => lastTaggedIds.includes(i.id));
    const pool = tagged.length ? tagged : items;
    return composeOutfit(pool, items, q);
  }, [outfitText, lastTaggedIds, items, q]);

  function onPromptChange(next: string) {
    setQ(next);
    if (memory.outfitText) onClearMemory();
    setThanks("");
  }

  function remix() {
    onFeedback({ rating: "dislike", occasion: q, outfitText, itemIds: lastTaggedIds, ts: Date.now() });
    go(q); // re-fetch with current prompt; stylist will avoid disliked items
  }

  const empty = items.length === 0;

  return (
    <div className="rise rise-3">
      {/* Title block */}
      <div className="px-6 pt-2">
        <div className="section-num">01 · The Stylist</div>
        <h1 className="display-title mt-2">
          What&rsquo;s the<br />vibe?
        </h1>
      </div>

      <AccentRow />

      {empty && (
        <div className="px-6 mt-7">
          <div className="bg-swatchBeige rounded-2xl p-5">
            <div className="font-serif italic text-[16px] text-terracotta/80 leading-snug">
              Your closet is empty. Add a piece and I&rsquo;ll start styling.
            </div>
            <button
              onClick={onGoToAdd}
              className="cta-primary mt-4"
            >
              Add an item
            </button>
          </div>
        </div>
      )}

      {!empty && (
        <>
          {/* Inline GO textarea */}
          <div className="px-6 mt-6">
            <div className="go-wrap">
              <textarea
                value={q}
                onChange={e => onPromptChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } }}
                placeholder="rooftop dinner, golden hour…"
                rows={1}
              />
              <button
                onClick={() => go()}
                disabled={loading || !q.trim()}
                className="go-btn"
              >
                {loading ? "…" : "Go"}
              </button>
            </div>

            {/* 3 outlined chips */}
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {chips.map(c => (
                <button
                  key={c.label}
                  onClick={() => go(c.q)}
                  className="chip hover:chip-active transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-4 text-[12px] text-terracotta/60 font-serif italic thinking text-center">
                Reading your closet, weighing what you&rsquo;ve loved…
              </div>
            )}
            {error && <div className="mt-3 text-[12px] text-picante font-serif italic">{error}</div>}
          </div>

          {/* Stylist response */}
          {outfitText && (
            <>
              <div className="px-6 mt-7">
                <div className="eyebrow eyebrow-star">The stylist says</div>
                <div className="mt-3 stylist-prose">{outfitText}</div>
              </div>

              {/* The Look — list of swatch rows */}
              {lookItems.length > 0 && (
                <div className="px-6 mt-6">
                  <div className="eyebrow eyebrow-star">The look</div>
                  <div className="mt-2">
                    {lookItems.map(it => <LookRow key={it.id} item={it} />)}
                  </div>
                </div>
              )}

              {/* Action buttons: LOVE · REMIX · I WORE IT */}
              <div className="px-6 mt-5 grid grid-cols-3 gap-2">
                <ActionBtn label="♡ Love"      onClick={() => rate("like")} tone="picante-fill" />
                <ActionBtn label="↻ Remix"     onClick={remix}              tone="ghost" />
                <ActionBtn label="✓ Wore it"   onClick={() => rate("wore")} tone="ghost" />
              </div>
              {thanks && (
                <div className="px-6 mt-3 text-[13px] font-serif italic text-terracotta/70 text-center">
                  {thanks}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!outfitText && !loading && (
            <div className="px-6 mt-8">
              <div className="font-serif italic text-[16px] text-terracotta/75 leading-snug">
                Tell me where you&rsquo;re going and I&rsquo;ll pull from your closet.
                The more you react, the sharper I get.
              </div>
              <div className="mt-3 text-[10px] tracking-[0.18em] uppercase text-terracotta/50 font-medium">
                {feedback.length} signals · {items.length} pieces in rotation
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function composeOutfit(pool: Item[], allItems: Item[], prompt: string): Item[] {
  const promptLower = prompt.toLowerCase();
  const vibeWords = ["casual", "elevated", "going-out", "going out", "athleisure"];
  const matchedVibes = vibeWords.filter(v => promptLower.includes(v)).map(v => v.replace(" ", "-"));

  const score = (it: Item) => matchedVibes.length ? it.vibe.filter(v => matchedVibes.includes(v)).length : 0;
  const pickBest = (cs: Item[]) => cs.length ? [...cs].sort((a,b) => score(b) - score(a))[0] : undefined;

  const result: Item[] = [];
  const used = new Set<string>();

  for (const cat of ["top", "bottom", "shoe"]) {
    const fromPool = pool.filter(i => i.category === cat && !used.has(i.id));
    let pick = pickBest(fromPool);
    if (!pick) pick = pickBest(allItems.filter(i => i.category === cat && !used.has(i.id)));
    if (pick) { result.push(pick); used.add(pick.id); }
  }
  const extra = pickBest(pool.filter(i => !used.has(i.id)));
  if (extra) { result.push(extra); used.add(extra.id); }
  if (result.length < 4) {
    const rest = allItems.filter(i => !used.has(i.id));
    for (const it of [...rest].sort((a,b) => score(b) - score(a))) {
      if (result.length >= 4) break;
      result.push(it); used.add(it.id);
    }
  }
  return result.slice(0, 4);
}

function LookRow({ item }: { item: Item }) {
  return (
    <div className="list-row">
      <div className="swatch" style={{ background: item.colorHex }} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-terracotta truncate">{item.name}</div>
        <div className="text-[11px] text-terracotta/55 mt-0.5">{item.brand} · Size {item.size}</div>
      </div>
    </div>
  );
}

function ActionBtn({
  label, onClick, tone,
}: {
  label: string; onClick: () => void; tone: "picante-fill" | "ghost";
}) {
  const cls = tone === "picante-fill"
    ? "bg-picante text-saltCream border-picante hover:opacity-90"
    : "bg-transparent text-terracotta border-terracotta/35 hover:border-terracotta/55";
  return (
    <button
      onClick={onClick}
      className={`rounded-full border py-2.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-all ${cls}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// CLOSET SCREEN — frame 25:2
// ============================================================
function ClosetScreen({
  items, feedback, onReturn, onGoToAdd,
}: {
  items: Item[]; feedback: Feedback[]; onReturn: (id: string, reason?: RemovalReason) => void; onGoToAdd: () => void;
}) {
  const [activeCat, setActiveCat] = useState("all");
  const [activeBrand, setActiveBrand] = useState("all");

  const cats = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const brands = ["all", ...Array.from(new Set(items.map(i => i.brand)))];

  const filtered = items.filter(i =>
    (activeCat === "all" || i.category === activeCat) &&
    (activeBrand === "all" || i.brand === activeBrand)
  );

  const totalSpend = items.reduce((s, i) => s + (i.price || 0), 0);
  const wearMap = useMemo(() => {
    const m: Record<string, number> = {};
    feedback.filter(f => f.rating === "wore").forEach(f => {
      f.itemIds.forEach(id => { m[id] = (m[id] ?? 0) + 1; });
    });
    return m;
  }, [feedback]);

  if (items.length === 0) {
    return (
      <div className="rise rise-3">
        <div className="px-6 pt-2">
          <div className="section-num">02 · The Closet</div>
          <h1 className="display-title mt-2">Your<br />closet</h1>
        </div>
        <AccentRow />
        <div className="px-6 mt-7">
          <div className="font-serif italic text-[16px] text-terracotta/75 leading-snug">
            Empty for now. Tap Add to paste an order email — I&rsquo;ll extract the pieces.
          </div>
          <button onClick={onGoToAdd} className="cta-primary mt-5">Add an item</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rise rise-3">
      <div className="px-6 pt-2">
        <div className="section-num">02 · The Closet</div>
        <h1 className="display-title mt-2">Your<br />closet</h1>
      </div>

      <AccentRow />

      {/* 4 stats */}
      <div className="px-6 mt-5 flex items-baseline gap-4">
        <Stat n={items.length} l="In rotation" />
        <Stat n={new Set(items.map(i => i.brand)).size} l="Brands" />
        <Stat n={new Set(items.map(i => i.category)).size} l="Categories" />
        <Stat n={`$${Math.round(totalSpend)}`} l="Value" />
      </div>

      {/* Category row */}
      <div className="px-6 mt-6">
        <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium mb-2">Category</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`chip ${c === activeCat ? "chip-active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Brand row */}
      <div className="px-6 mt-3">
        <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium mb-2">Brand</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {brands.map(b => (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`chip ${b === activeBrand ? "chip-active" : ""}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Items header */}
      <div className="px-6 mt-6">
        <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">Items</div>
        <div className="mt-2">
          {filtered.map(it => (
            <ClosetRow
              key={it.id}
              item={it}
              wearCount={wearMap[it.id] ?? 0}
              onReturn={() => onReturn(it.id, "returned")}
              onGiveAway={() => onReturn(it.id, "gave-away")}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="mt-4 text-center font-serif italic text-terracotta/50 text-base">
            Nothing matches both filters.
          </div>
        )}
      </div>
    </div>
  );
}

function ClosetRow({
  item, wearCount, onReturn, onGiveAway,
}: {
  item: Item; wearCount: number; onReturn: () => void; onGiveAway: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="list-row relative">
      <div className="swatch" style={{ background: item.colorHex }} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-terracotta truncate">{item.name}</div>
        <div className="text-[11px] text-terracotta/55 mt-0.5">{item.brand} · Size {item.size}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="text-[10px] tracking-[0.16em] uppercase text-terracotta/55 font-medium">
          Worn {wearCount}x
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="More actions"
          className="text-terracotta/40 hover:text-terracotta text-base leading-none px-1"
        >
          ⋯
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-full -mt-1 z-10 bg-saltCream border border-terracotta/20 rounded-xl shadow-lg overflow-hidden text-[11px] tracking-[0.14em] uppercase">
          <button
            onClick={() => { onReturn(); setOpen(false); }}
            className="block w-full text-left px-4 py-2.5 hover:bg-swatchBeige text-terracotta"
          >
            I returned this
          </button>
          <button
            onClick={() => { onGiveAway(); setOpen(false); }}
            className="block w-full text-left px-4 py-2.5 hover:bg-swatchBeige text-terracotta"
          >
            I gave it away
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ n, l }: { n: any; l: string }) {
  return (
    <div>
      <div className="font-serif text-[22px] leading-none text-terracotta">{n}</div>
      <div className="text-[9px] tracking-[0.14em] uppercase text-terracotta/55 mt-1.5 font-medium">{l}</div>
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

  function updateParsed(idx: number, patch: Partial<Item>) {
    if (!parsed) return;
    const next = [...parsed];
    next[idx] = { ...next[idx], ...patch };
    setParsed(next);
  }
  function dropParsed(idx: number) {
    if (!parsed) return;
    const next = parsed.filter((_, i) => i !== idx);
    setParsed(next.length ? next : null);
  }
  function confirm() {
    if (parsed && parsed.length) onParsed(parsed);
    setEmailText(""); setParsed(null);
    onDone();
  }

  return (
    <div className="rise rise-3">
      <div className="px-6 pt-2">
        <div className="section-num">03 · Add an item</div>
        <h1 className="display-title mt-2">Add an<br />item</h1>
      </div>

      <AccentRow />

      <div className="px-6 mt-6">
        <p className="font-serif italic text-[15px] text-terracotta/75 leading-snug">
          Paste an order email — AI pulls the items into your closet.
        </p>

        <textarea
          value={emailText}
          onChange={e => setEmailText(e.target.value)}
          placeholder="paste your order email here…"
          className="w-full mt-5 bg-saltCream border border-terracotta/25 rounded-2xl px-4 py-3 text-[12px] font-mono leading-relaxed min-h-[200px] placeholder:text-terracotta/35 focus:border-terracotta/50 outline-none resize-y transition-colors"
        />

        <button
          onClick={parse}
          disabled={loading || !emailText.trim()}
          className="cta-primary mt-5"
        >
          {loading ? <span className="inline-flex items-center"><span className="spinner" style={{ borderTopColor: "#fff8ea", borderColor: "rgba(255,248,234,0.3)", borderTopWidth: "1.5px" }} />Reading…</span> : <>Extract Items <span className="text-base">→</span></>}
        </button>

        {loading && (
          <div className="mt-3 text-[12px] text-terracotta/60 font-serif italic thinking text-center">
            Parsing the order, naming the colors…
          </div>
        )}
        {error && <div className="mt-3 text-[12px] text-picante font-serif italic">{error}</div>}
      </div>

      {parsed && parsed.length > 0 && (
        <div className="px-6 mt-7">
          <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">
            Found {parsed.length} item{parsed.length === 1 ? "" : "s"}
          </div>
          <p className="mt-1 text-[11px] text-terracotta/55 italic">Tap a field to fix it before adding.</p>
          <div className="mt-3 flex flex-col gap-3">
            {parsed.map((it, idx) => (
              <ParsedRow
                key={it.id + idx}
                item={it}
                onChange={patch => updateParsed(idx, patch)}
                onDrop={() => dropParsed(idx)}
              />
            ))}
          </div>
          <button
            onClick={confirm}
            className="mt-4 cta-primary"
            style={{ background: "var(--citrus)", color: "var(--terracotta)" }}
          >
            Add to my closet
          </button>
        </div>
      )}

      {/* Helper retailer line */}
      {!parsed && !loading && (
        <div className="px-6 mt-6 text-center text-[10px] tracking-[0.16em] uppercase text-terracotta/45">
          Reformation · SKIMS · Sézane · Free People · Aritzia · Anthropologie
        </div>
      )}
    </div>
  );
}

function ParsedRow({
  item, onChange, onDrop,
}: {
  item: Item; onChange: (patch: Partial<Item>) => void; onDrop: () => void;
}) {
  return (
    <div className="list-row relative">
      <div className="swatch-lg" style={{ background: item.colorHex }} />
      <div className="flex-1 min-w-0 pr-7">
        <input
          value={item.name}
          onChange={e => onChange({ name: e.target.value })}
          className="w-full bg-transparent text-[12px] font-semibold tracking-[0.05em] uppercase text-terracotta border-b border-transparent focus:border-terracotta/40 outline-none"
        />
        <div className="flex gap-2 mt-1.5">
          <input
            value={item.color}
            onChange={e => onChange({ color: e.target.value })}
            className="flex-1 bg-transparent text-[11px] text-terracotta/65 italic border-b border-terracotta/10 focus:border-terracotta/30 outline-none pb-0.5"
            placeholder="color"
          />
          <input
            value={item.size}
            onChange={e => onChange({ size: e.target.value })}
            className="w-14 bg-transparent text-[11px] text-terracotta/65 border-b border-terracotta/10 focus:border-terracotta/30 outline-none pb-0.5"
            placeholder="size"
          />
        </div>
        <div className="mt-1 text-[9px] tracking-[0.14em] uppercase text-terracotta/45">
          {item.category} · ${item.price?.toFixed(0) ?? "—"}
        </div>
      </div>
      <button
        onClick={onDrop}
        aria-label="Remove this item"
        className="absolute top-2 right-0 w-6 h-6 rounded-full bg-terracotta/10 hover:bg-picante hover:text-saltCream text-terracotta/55 text-[14px] leading-none flex items-center justify-center transition-colors"
      >
        ×
      </button>
    </div>
  );
}

// ============================================================
// RETURN SCREEN — frame 25:97
// ============================================================
function ReturnScreen({
  items, reasons, onRestore, onSetReason,
}: {
  items: Item[];
  reasons: Record<string, RemovalReason>;
  onRestore: (id: string) => void;
  onSetReason: (id: string, reason: RemovalReason) => void;
}) {
  const [filter, setFilter] = useState<"all" | "returned" | "gave-away">("all");

  const filtered = items.filter(i => {
    if (filter === "all") return true;
    const r = reasons[i.id] ?? "returned";
    return r === filter;
  });

  const valueRemoved = items.reduce((s, i) => s + (i.price || 0), 0);

  return (
    <div className="rise rise-3">
      <div className="px-6 pt-2">
        <div className="section-num">04 · Returns</div>
        <h1 className="display-title mt-2">Returns</h1>
      </div>

      <AccentRow />

      {/* Stats */}
      <div className="px-6 mt-5 flex items-baseline gap-5">
        <Stat n={items.length} l="Out of rotation" />
        <Stat n={`$${Math.round(valueRemoved)}`} l="Value removed" />
      </div>

      {/* Filter chips */}
      <div className="px-6 mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {(["all","returned","gave-away"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? "chip-active" : ""}`}
          >
            {f === "gave-away" ? "Gave away" : f}
          </button>
        ))}
      </div>

      {/* Header + list */}
      <div className="px-6 mt-6">
        <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">
          ↓ No longer yours
        </div>
        {filtered.length === 0 ? (
          <div className="mt-5 font-serif italic text-[15px] text-terracotta/65 leading-snug">
            {items.length === 0
              ? "Nothing here yet. Tap a closet row's ⋯ menu to mark a piece returned or gave away."
              : "Nothing in this filter."}
          </div>
        ) : (
          <div className="mt-2">
            {filtered.map(it => (
              <ReturnRow
                key={it.id}
                item={it}
                reason={reasons[it.id] ?? "returned"}
                onRestore={() => onRestore(it.id)}
                onSetReason={r => onSetReason(it.id, r)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReturnRow({
  item, reason, onRestore, onSetReason,
}: {
  item: Item;
  reason: RemovalReason;
  onRestore: () => void;
  onSetReason: (r: RemovalReason) => void;
}) {
  return (
    <div className="list-row opacity-80">
      <div className="swatch relative" style={{ background: item.colorHex }}>
        <div className="absolute inset-0 bg-saltCream/35 rounded-[6px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-terracotta truncate">{item.name}</div>
        <div className="text-[11px] text-terracotta/55 mt-0.5">{item.brand} · Size {item.size}</div>
        <button
          onClick={() => onSetReason(reason === "returned" ? "gave-away" : "returned")}
          className="mt-1 text-[9px] tracking-[0.14em] uppercase text-terracotta/45 hover:text-terracotta"
        >
          {reason === "returned" ? "→ Mark gave away" : "→ Mark returned"}
        </button>
      </div>
      <button
        onClick={onRestore}
        className="text-[10px] tracking-[0.16em] uppercase text-terracotta/55 hover:text-citrus border border-terracotta/30 rounded-full px-3 py-1 transition-colors"
      >
        ↺ Restore
      </button>
    </div>
  );
}

// ============================================================
// TASTE SCREEN — frame 25:152
// ============================================================
function TasteScreen({ feedback, wardrobe }: { feedback: Feedback[]; wardrobe: Item[] }) {
  const liked = feedback.filter(f => f.rating === "like" || f.rating === "wore");
  const disliked = feedback.filter(f => f.rating === "dislike");
  const wore = feedback.filter(f => f.rating === "wore");

  const brandCount: Record<string, number> = {};
  const colorCount: Record<string, number> = {};
  const vibeCount: Record<string, number> = {};
  liked.forEach(f => f.itemIds.forEach(id => {
    const it = wardrobe.find(x => x.id === id); if (!it) return;
    brandCount[it.brand] = (brandCount[it.brand] ?? 0) + 1;
    colorCount[it.colorHex] = (colorCount[it.colorHex] ?? 0) + 1;
    it.vibe.forEach(v => vibeCount[v] = (vibeCount[v] ?? 0) + 1);
  }));

  const seedBrands: [string, number][] = [["Reformation", 8], ["Free People", 6], ["Sézane", 4], ["SKIMS", 3]];
  const seedVibes: [string, number][] = [["going-out", 9], ["casual", 7], ["elevated", 5]];
  const seedColors = ["#0a0a0a", "#5a3e2a", "#c9a37a", "#f5ecd9", "#2a3552", "#d4b896", "#ffffff", "#e0c79a"];

  const brands = Object.entries(brandCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const displayBrands = brands.length ? brands : seedBrands;
  const maxBrand = Math.max(...displayBrands.map(([,n]) => n));

  const vibes = Object.entries(vibeCount).sort((a,b) => b[1] - a[1]).slice(0, 4);
  const displayVibes = vibes.length ? vibes : seedVibes;

  const colors = Object.entries(colorCount).sort((a,b) => b[1] - a[1]).slice(0, 8);
  const displayColors = colors.length ? colors.map(([c]) => c) : seedColors;

  // Avoidance: aggregate from disliked itemIds
  const avoidance: string[] = [];
  const dislikedBrands: Record<string, number> = {};
  const dislikedCats: Record<string, number> = {};
  disliked.forEach(f => f.itemIds.forEach(id => {
    const it = wardrobe.find(x => x.id === id); if (!it) return;
    dislikedBrands[it.brand] = (dislikedBrands[it.brand] ?? 0) + 1;
    dislikedCats[it.category] = (dislikedCats[it.category] ?? 0) + 1;
  }));
  Object.entries(dislikedBrands).filter(([,n]) => n >= 2).slice(0,2).forEach(([b]) => avoidance.push(b));
  Object.entries(dislikedCats).filter(([,n]) => n >= 2).slice(0,2).forEach(([c]) => avoidance.push(`${c} pieces`));

  const barTones = ["var(--picante)", "var(--hibiscus)", "var(--citrus)", "var(--gold)", "var(--terracotta)"];

  return (
    <div className="rise rise-3">
      <div className="px-6 pt-2">
        <div className="section-num">05 · Taste</div>
        <h1 className="display-title mt-2">Taste</h1>
      </div>

      <AccentRow />

      <div className="px-6 mt-3">
        <p className="font-serif italic text-[15px] text-terracotta/75 leading-snug">
          What the stylist has learned about you so far.
        </p>
      </div>

      {/* 4 stats */}
      <div className="px-6 mt-5 flex items-baseline gap-3">
        <Stat n={liked.filter(f => f.rating === "like").length} l="Loved" />
        <Stat n={wore.length} l="Wore" />
        <Stat n={disliked.length} l="Not me" />
        <Stat n={feedback.length} l="Signals" />
      </div>

      {/* 2x2 grid of sections */}
      <div className="px-6 mt-7 grid grid-cols-2 gap-x-4 gap-y-7">
        {/* 01 — BRANDS */}
        <div className="col-span-2">
          <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">01 · Brands you love</div>
          <div className="mt-3 flex flex-col gap-2">
            {displayBrands.map(([b, n], i) => (
              <div key={b} className="flex items-center gap-3">
                <div className="text-[12px] text-terracotta w-[100px] truncate">{b}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(n / maxBrand) * 100}%`, background: barTones[i % barTones.length] }} />
                </div>
                <div className="text-[11px] text-terracotta/65 font-medium w-4 text-right">{n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 02 — VIBES */}
        <div className="col-span-2">
          <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">02 · Vibes that win</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {displayVibes.map(([v, n], i) => (
              <span key={v} className={`chip ${i === 0 ? "chip-citrus" : i === 1 ? "chip-hibiscus" : i === 2 ? "chip-gold" : "chip-picante"}`}>
                {v} <span className="ml-1.5 opacity-70">× {n}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 03 — COLORS */}
        <div className="col-span-2">
          <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">03 · Your colors</div>
          <div className="mt-3 grid grid-cols-8 gap-2">
            {displayColors.map((c, idx) => (
              <div
                key={c + idx}
                className="aspect-square rounded-full border border-terracotta/15"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* 04 — WON'T RECOMMEND */}
        <div className="col-span-2">
          <div className="text-[10px] tracking-[0.18em] uppercase text-terracotta/55 font-medium">04 · Won&rsquo;t recommend again</div>
          <div className="mt-3 font-serif italic text-[15px] text-terracotta/85 leading-relaxed">
            {avoidance.length === 0 ? (
              <span className="text-terracotta/55">
                Nothing yet. Mark outfits &ldquo;Remix&rdquo; and I&rsquo;ll catch the pattern.
              </span>
            ) : (
              avoidance.map(a => <div key={a}>— {a}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
