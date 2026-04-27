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
  returned?: boolean;
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
      wardrobe, returned: [...returned], feedback, stylistMemory,
    }));
  }, [wardrobe, returned, feedback, stylistMemory, hydrated]);

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

  function markReturned(id: string) {
    const n = new Set(returned);
    n.add(id);
    setReturned(n);
    showToast("Moved to Returns.", () => {
      setReturned(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setToast(null);
    });
  }
  function restoreItem(id: string) {
    const n = new Set(returned);
    n.delete(id);
    setReturned(n);
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
        <div className="thinking font-serif italic text-terracotta text-lg">Setting the table…</div>
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
          onReturn={markReturned}
          onGoToAdd={() => setTab("add")}
        />
      )}
      {tab === "add" && (
        <AddScreen onParsed={addItems} onDone={() => setTab("closet")} />
      )}
      {tab === "returned" && (
        <ReturnScreen items={returnedItems} onRestore={restoreItem} />
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
// STYLIST SCREEN — frame 26:2 spec
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

  const chips = [
    { label: "Drinks Saturday", q: "Drinks Saturday in SoHo, going out, elevated but easy." },
    { label: "Pilates → coffee", q: "Pilates → coffee → casual lunch. Athleisure that doesn't look like I rolled out of bed." },
    { label: "Flying back to LA", q: "Flying back to LA tomorrow — comfortable, layered, looks pulled-together at LAX." },
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
      like: "Got it — banked. The next one will lean this direction.",
      dislike: "Filed under 'not me' — I'll steer clear next time.",
      wore: "Best signal there is. I'll weight this heavy.",
    };
    setThanks(msgs[rating]);
  }

  // Outfit composition: aim for one item per category (top, bottom, shoe, +1)
  const outfitItems = useMemo(() => {
    if (!outfitText) return [];
    const tagged = items.filter(i => lastTaggedIds.includes(i.id));
    const pool = tagged.length ? tagged : items;
    return composeOutfit(pool, items, q);
  }, [outfitText, lastTaggedIds, items, q]);

  // Editing the prompt clears the memory
  function onPromptChange(next: string) {
    setQ(next);
    if (memory.outfitText) onClearMemory();
    setThanks("");
  }

  const empty = items.length === 0;

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

      {empty && (
        <div className="px-6 mt-7">
          <div className="bg-swatchBeige rounded-2xl p-5">
            <div className="font-serif italic text-[16px] text-terracotta/80 leading-snug">
              Your closet is empty. Add a piece and I&rsquo;ll start styling.
            </div>
            <button
              onClick={onGoToAdd}
              className="mt-4 w-full bg-terracotta text-saltCream rounded-2xl py-3 text-[12px] tracking-[0.16em] uppercase font-medium hover:bg-terracotta/90 transition-colors"
            >
              Add an item
            </button>
          </div>
        </div>
      )}

      {!empty && (
        <>
          {/* Vibe input */}
          <div className="px-6 mt-7">
            <textarea
              value={q}
              onChange={e => onPromptChange(e.target.value)}
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
        </>
      )}
    </div>
  );
}

// Compose a balanced outfit: try one per category (top, bottom, shoe, plus one extra).
// Bias toward items whose vibes overlap any vibe word found in the prompt.
function composeOutfit(pool: Item[], allItems: Item[], prompt: string): Item[] {
  const promptLower = prompt.toLowerCase();
  const vibeWords = ["casual", "elevated", "going-out", "going out", "athleisure"];
  const matchedVibes = vibeWords
    .filter(v => promptLower.includes(v))
    .map(v => v.replace(" ", "-"));

  function score(it: Item): number {
    if (!matchedVibes.length) return 0;
    return it.vibe.filter(v => matchedVibes.includes(v)).length;
  }

  function pickBest(candidates: Item[]): Item | undefined {
    if (!candidates.length) return undefined;
    return [...candidates].sort((a, b) => score(b) - score(a))[0];
  }

  const result: Item[] = [];
  const usedIds = new Set<string>();
  const need = ["top", "bottom", "shoe"];

  for (const cat of need) {
    const fromPool = pool.filter(i => i.category === cat && !usedIds.has(i.id));
    let chosen = pickBest(fromPool);
    if (!chosen) {
      const fromAll = allItems.filter(i => i.category === cat && !usedIds.has(i.id));
      chosen = pickBest(fromAll);
    }
    if (chosen) {
      result.push(chosen);
      usedIds.add(chosen.id);
    }
  }

  // Plus one — outerwear, activewear, accessory, or whatever's left in pool
  const extras = pool.filter(i => !usedIds.has(i.id));
  const extra = pickBest(extras);
  if (extra) {
    result.push(extra);
    usedIds.add(extra.id);
  }

  // Backfill if we still don't have 4
  if (result.length < 4) {
    const rest = allItems.filter(i => !usedIds.has(i.id));
    for (const it of [...rest].sort((a, b) => score(b) - score(a))) {
      if (result.length >= 4) break;
      result.push(it);
      usedIds.add(it.id);
    }
  }

  return result.slice(0, 4);
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
function ClosetScreen({
  items, onReturn, onGoToAdd,
}: {
  items: Item[]; onReturn: (id: string) => void; onGoToAdd: () => void;
}) {
  const [activeCat, setActiveCat] = useState("all");
  const cats = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = activeCat === "all" ? items : items.filter(i => i.category === activeCat);
  const totalSpend = items.reduce((s, i) => s + (i.price || 0), 0);

  if (items.length === 0) {
    return (
      <div className="rise rise-3">
        <div className="px-6 pt-3">
          <div className="section-num">02 · The Closet</div>
          <h1 className="display-title mt-2">
            Empty<br />
            <em className="not-italic">for now.</em>
          </h1>
        </div>
        <AccentRow />
        <div className="px-6 mt-7">
          <div className="bg-swatchBeige rounded-2xl p-5">
            <div className="font-serif italic text-[16px] text-terracotta/80 leading-snug">
              Your closet is empty. Tap Add to paste an order email — I&rsquo;ll extract the pieces.
            </div>
            <button
              onClick={onGoToAdd}
              className="mt-4 w-full bg-terracotta text-saltCream rounded-2xl py-3 text-[12px] tracking-[0.16em] uppercase font-medium hover:bg-terracotta/90 transition-colors"
            >
              Add an item
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {parsed && parsed.length > 0 && (
        <div className="px-6 mt-8">
          <div className="section-num">04 · Found {parsed.length} item{parsed.length === 1 ? "" : "s"}</div>
          <p className="mt-2 text-[12px] text-terracotta/55 font-serif italic">
            Tap a field to fix it before adding.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {parsed.map((it, idx) => (
              <ParsedItemCard
                key={it.id + idx}
                item={it}
                onChange={patch => updateParsed(idx, patch)}
                onDrop={() => dropParsed(idx)}
              />
            ))}
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

function ParsedItemCard({
  item, onChange, onDrop,
}: {
  item: Item; onChange: (patch: Partial<Item>) => void; onDrop: () => void;
}) {
  return (
    <div className="bg-swatchBeige rounded-2xl border border-terracotta/8 p-3 flex gap-3 relative">
      <div
        className="w-20 h-24 rounded-xl flex-shrink-0 flex items-end p-2"
        style={{ background: item.colorHex }}
      >
        <div
          className="font-serif italic text-[10px] tracking-wide"
          style={{ color: isDark(item.colorHex) ? "#fff8ea" : "#71241a", opacity: 0.85 }}
        >
          {item.brand}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <input
          value={item.name}
          onChange={e => onChange({ name: e.target.value })}
          className="w-full bg-transparent text-[13px] font-medium text-terracotta border-b border-terracotta/15 focus:border-terracotta/40 outline-none pb-1"
        />
        <div className="flex gap-2 mt-2">
          <input
            value={item.color}
            onChange={e => onChange({ color: e.target.value })}
            className="flex-1 bg-transparent text-[11px] text-terracotta/70 font-serif italic border-b border-terracotta/10 focus:border-terracotta/30 outline-none pb-1"
            placeholder="color"
          />
          <input
            value={item.size}
            onChange={e => onChange({ size: e.target.value })}
            className="w-16 bg-transparent text-[11px] text-terracotta/70 border-b border-terracotta/10 focus:border-terracotta/30 outline-none pb-1"
            placeholder="size"
          />
        </div>
        <div className="mt-1 text-[10px] tracking-[0.14em] uppercase text-terracotta/45">
          {item.category} · ${item.price?.toFixed(0) ?? "—"}
        </div>
      </div>
      <button
        onClick={onDrop}
        aria-label="Remove this item"
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-terracotta/10 hover:bg-picante hover:text-saltCream text-terracotta/55 text-[14px] leading-none flex items-center justify-center transition-colors"
      >
        ×
      </button>
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

  // Avoidance: aggregate disliked items' brands and categories
  const avoidance: string[] = [];
  const dislikedBrandCount: Record<string, number> = {};
  const dislikedCatCount: Record<string, number> = {};
  disliked.forEach(f => {
    f.itemIds.forEach(id => {
      const it = wardrobe.find(x => x.id === id); if (!it) return;
      dislikedBrandCount[it.brand] = (dislikedBrandCount[it.brand] ?? 0) + 1;
      dislikedCatCount[it.category] = (dislikedCatCount[it.category] ?? 0) + 1;
    });
  });
  Object.entries(dislikedBrandCount)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([b]) => avoidance.push(`${b} for now`));
  Object.entries(dislikedCatCount)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([c]) => avoidance.push(`${c} pieces you've passed on`));

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
