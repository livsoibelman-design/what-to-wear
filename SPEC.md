# What to Wear — Dev Spec (Palm Springs / Issue 01)

This is the source of truth for how the app behaves. The Figma is the source of truth for how it looks. If Figma and code drift, this document is what reconciles them.

---

## Stack

- Next.js 14 app router, React 18, TypeScript
- Tailwind 3 + custom Palm Springs token set
- Anthropic SDK (`claude-sonnet-4-5`) called from `/api/stylist` and `/api/parse-email`
- localStorage for state persistence (key `wtw_state_v1`)
- No backend, no auth, no database — single-browser experience

---

## State model

Top-level state lives on the `<Page>` component. Five fields, all persisted:

```ts
wardrobe: Item[]               // every item ever added (returns kept here)
returned: Set<string>          // ids of items currently in returns
feedback: Feedback[]           // every Love it / Not me / Wore signal
tab: Tab                       // 'stylist' | 'closet' | 'add' | 'returned' | 'taste'
stylistMemory: StylistMemory   // last prompt, last response, last tagged ids
```

Persisted as JSON to `localStorage["wtw_state_v1"]` on every change. Hydrated on mount inside a `useEffect`. Until hydration completes, the app shows a `Setting the table…` flash so we don't render seed data over saved data.

### `Item` shape

```ts
{
  id: string;            // unique, stable
  brand: string;
  name: string;
  color: string;         // human label ("Sugar (cream)")
  colorHex: string;      // for the color block
  size: string;
  price: number;
  category: 'top'|'bottom'|'shoe'|'activewear'|'outerwear'|'accessory';
  vibe: string[];        // 'casual'|'elevated'|'going-out'|'athleisure'
  retailer?: string;
  date?: string;
}
```

### `Feedback` shape

```ts
{
  rating: 'like' | 'dislike' | 'wore';
  occasion: string;       // the prompt the user typed
  outfitText: string;     // the prose the stylist returned
  itemIds: string[];      // items the stylist referenced
  ts: number;             // Date.now()
}
```

### `StylistMemory` shape

```ts
{
  q: string;              // last prompt
  outfitText: string;     // last AI prose
  taggedIds: string[];    // items extracted from prose
  ts: number;
}
```

Persisted so the user can switch tabs and come back to their last recommendation without re-running the AI call.

---

## Bottom nav (global)

Fixed to the bottom of the phone shell. 5 tabs: Stylist · Closet · Add · Returns · Taste. Active tab gets a 6×6 picante dot above the label. Inactive tabs are 75% scale, 25% terracotta opacity. Tap to switch — no animation between screens beyond a `rise` reveal.

---

## Screen 01 — Stylist (Figma frame `26:2`)

The marquee surface. Where the AI does work the user can see.

### Layout

1. Wordmark + SS 26 (top)
2. `01 · The Stylist` eyebrow + display title `What's the vibe?`
3. Accent row (3 dots + bar + Issue 01)
4. Vibe input — beige rounded textarea, 2 rows, terracotta placeholder `drinks Saturday in SoHo…`
5. 3 suggestion chips, horizontally scrollable: hibiscus, citrus, picante
6. `Style me` CTA — terracotta fill, full width, uppercase tracking
7. (After response) `02 · The recommendation` — beige panel with stylist prose in DM Serif italic
8. (After response) `03 · Pulling from your closet` — 2-col grid of 4 outfit cards
9. (After response) Action row — Love it (hibiscus) · Not me (ghost) · I wore this (picante)
10. (After action) Single-line italic confirmation message

### Suggestion chips (locked copy)

```
Drinks Saturday          → "Drinks Saturday in SoHo, going out, elevated but easy."
Pilates → coffee         → "Pilates → coffee → casual lunch. Athleisure that doesn't look like I rolled out of bed."
Flying back to LA        → "Flying back to LA tomorrow — comfortable, layered, looks pulled-together at LAX."
```

### Behavior

**On `Style me` or chip tap:**
- POST to `/api/stylist` with `{ occasion, items: activeItems, feedback }`
- Show loading spinner + thinking line `Reading your closet, weighing what you've loved…`
- On response: render prose, parse it for item-name substring matches against `activeItems`, store the matched ids in `taggedIds`
- Persist `{ q, outfitText, taggedIds, ts }` into `stylistMemory`

**Outfit grid composition:**
- Take `taggedIds`. Filter to active items.
- Build a balanced outfit: try to include one item per category (top, bottom, shoe, plus one extra — outerwear/activewear/accessory).
- If fewer than 4 tagged items, backfill with category-balanced picks from active wardrobe biased to vibes that overlap the prompt.
- Display up to 4 cards. If wardrobe has < 4 items total, show however many exist.

**Action buttons:**
- `Love it` → `recordFeedback({ rating: 'like', ... })` → toast `Got it — banked. The next one will lean this direction.`
- `Not me` → `recordFeedback({ rating: 'dislike', ... })` → toast `Filed under 'not me' — I'll steer clear next time.`
- `I wore this` → `recordFeedback({ rating: 'wore', ... })` → toast `Best signal there is. I'll weight this heavy.`
- All three persist `itemIds = taggedIds` so the Taste screen can aggregate.

**Empty state (no response yet):**
- Beige panel. Italic copy: `Tell me where you're going and I'll pull from your closet. The more you react to outfits, the sharper I get.`
- Stat line: `{N} signals · {M} pieces in rotation`

**Persistence:**
- If the user navigates away and returns, the last response renders from `stylistMemory` — no re-fetch.
- Editing the prompt clears the stylist memory (so the new prompt's response replaces the last one).

### API contract — `POST /api/stylist`

Request:
```json
{ "occasion": "string", "items": [Item], "feedback": [Feedback] }
```

Response:
```json
{ "text": "string" }   // prose, ~3-5 sentences, references items by name
```

Errors return `{ "error": "string" }` with non-200 status. Most common: `Server is missing ANTHROPIC_API_KEY` (caught and shown inline in picante italic).

---

## Screen 02 — Closet (Figma frame `25:2`)

The user's wardrobe view.

### Layout

1. `02 · The Closet` eyebrow + display title `{N} pieces.`
2. Accent row
3. Stats row — `{brands} brands · {categories} categories · ${value} value`
4. Category chips, horizontally scrollable: `all` (default), then unique categories from active items
5. 2-col grid of `ClosetCard`s

### `ClosetCard`

- 4:5 aspect color block tinted with `item.colorHex`
- Brand name in bottom-left of the block, DM Serif italic, color contrast based on luminance of `colorHex`
- Below the block: item name (truncate 1 line), color · size, price
- Footer: `I don't have this` — small uppercase tracking, terracotta/45 → picante on hover

### Behavior

- `all` chip shows everything. Tap a category chip → filter grid.
- Tap `I don't have this` on a card → mark `returned`, slide-down inline toast above the bottom nav: `Moved to Returns. Undo` (5-second dismissal). Tap `Undo` to restore immediately.
- Empty filter result → italic line `Nothing here in this filter.`
- If `wardrobe.length === 0` → empty state CTA: `Your closet is empty. Tap Add to paste an order email.` + button that switches `tab` to `add`.

---

## Screen 03 — Add (Figma frame `25:74`)

How items get into the wardrobe.

### Layout

1. `03 · Add an item` eyebrow + display title `Paste an order email.`
2. Accent row
3. Helper italic: `Open your last Reformation, SKIMS, Free People, Sézane, or Aritzia receipt. Select all, paste below — I'll extract the pieces.`
4. Mono textarea, min-h 180px, auto-grow
5. `Extract items` CTA — terracotta fill
6. (After parse) `04 · Found N item(s)` + grid of parsed items with edit affordance
7. (After parse) `Add to my closet` CTA — citrus fill
8. (Empty / pre-parse) Helper retailer chips: Reformation · Free People · SKIMS · Sézane

### Behavior

**On `Extract items`:**
- POST `/api/parse-email` with `{ emailText }`
- Show spinner + `Parsing the order, naming the colors…`
- Response: `{ items: Item[] }`. Render each as a parsed card.

**Edit-before-add:**
- Each parsed card has tap-to-edit on `name`, `color`, `size`. Inline editable fields, no modal.
- User can also tap an X in the corner to drop a parsed item before confirming.

**On `Add to my closet`:**
- Append confirmed parsed items to `wardrobe` (with collision-safe ids)
- Clear textarea, clear parsed state
- Switch `tab` to `closet`
- Toast `Added N piece{s}. Welcome to the closet.`

### API contract — `POST /api/parse-email`

Request: `{ "emailText": "string" }`
Response: `{ "items": [Item] }` — ids generated server-side, all required Item fields populated.

---

## Screen 04 — Returns (Figma frame `25:97`)

Where items go when the user no longer has them.

### Layout

1. `04 · Returns` eyebrow + display title `Sent back.`
2. Accent row
3. Helper italic: `Pieces you returned or no longer have. The stylist won't suggest these.`
4. Empty state OR 2-col grid of `ReturnCard`s

### `ReturnCard`

- Same color block as `ClosetCard` but with a salt-cream 40% overlay (washed out)
- Picante `returned` chip pinned top-right
- Footer: `Restore` button — terracotta/45 → citrus on hover

### Behavior

- Tap `Restore` → remove from `returned` set, item reappears in Closet. Toast: `Back in rotation.`
- Empty state: beige panel `No returns yet. Tap "I don't have this" on a closet card to move it here.`

---

## Screen 05 — Taste (Figma frame `25:152`)

The user's profile, derived from feedback signals.

### Layout

1. `05 · Your Taste` eyebrow + display title `What you actually wear.`
2. Accent row
3. Stats row — `{loved} loved · {worn} worn · {notMe} not me`
4. Section `01 · Brands you reach for` — colored chips (top 4 brands)
5. Section `02 · Vibes that win` — chips (top 3 vibes)
6. Section `03 · Your colorway` — row of color circles (top 8)
7. Section `04 · What I won't suggest` — beige panel with avoidance lines

### Aggregation logic

Walk `feedback` filtered to `like` or `wore`. For each `itemId`, look up the item in `wardrobe` and increment counters for brand, colorHex, and each vibe.

- **Brands**: top 4 by count. If empty, seed with `Reformation, Alo Yoga, Free People, SKIMS`.
- **Vibes**: top 3 by count. If empty, seed with `casual, athleisure, elevated`.
- **Colors**: top 8 hex codes by count. If empty, seed with the dominant 6 hexes from `SEED_WARDROBE`.
- **Avoidance**: walk `feedback` filtered to `dislike`. Aggregate disliked items' brands and categories. Surface as `— avoid {X}` lines. If no dislikes, italic copy: `Nothing yet. Mark a few outfits "Not me" and I'll catch the pattern.`

The screen renders something useful even with zero feedback. As the user reacts, real signal replaces the seed.

---

## Storage schema (`localStorage["wtw_state_v1"]`)

```json
{
  "wardrobe": [Item],
  "returned": ["id1", "id2", ...],
  "feedback": [Feedback],
  "stylistMemory": { "q": "", "outfitText": "", "taggedIds": [], "ts": 0 }
}
```

Hydration: `JSON.parse` with try/catch — on error, fall back to `SEED_WARDROBE` and empty everything else.

---

## Visual tokens (locked, do not drift)

| Token        | Hex      | Use                              |
|--------------|----------|----------------------------------|
| salt-cream   | `#fff8ea`| Page background                  |
| terracotta   | `#71241a`| Primary ink, headlines           |
| picante      | `#f84e37`| Hot accent (active dot, key CTA) |
| hibiscus     | `#e35db0`| Pink accent (chips, highlights)  |
| citrus       | `#bdd470`| Green accent (chips, success)    |
| swatch-beige | `#f6eddb`| Card / panel surface             |
| gold         | `#d6b052`| Muted accent                     |

Type:
- Wordmark: DM Serif Display italic, 22px
- Display titles: DM Serif Display, 40px, line-height 0.95
- Stylist prose: DM Serif Display italic, 17px, line-height 1.45
- Eyebrows / section nums: Inter 11–13px, tracking 0.18em uppercase
- Body / chips / buttons: Inter

---

## Edge cases

- **No internet / API key missing**: Stylist screen shows error inline in picante italic. App still works for closet management.
- **Empty wardrobe**: Closet shows CTA to Add. Stylist shows `0 pieces in rotation` and the `Style me` button is disabled until at least one item exists.
- **Wardrobe with only returned items**: Stylist treats `activeItems = []` and prompts the user to restore something.
- **Hydration race**: Don't render real screens until `hydrated === true`. Otherwise seed data flashes over saved data on refresh.
- **Duplicate parse**: If a parsed item shares an id with an existing item, suffix the new id with `-{Date.now()}`.
- **Long stylist response**: Prose panel grows. No max-height, scrolls with the page.

---

## What's deliberately NOT built

These are real questions but explicitly out of scope for v1:

- Real product images (no scraping from order email HTML, no retailer API)
- Multi-device sync / accounts (single-browser localStorage only)
- Friend layer (vibe-match across closets) — comes after 3 friends use v1
- Calendar awareness (weather, location) — manual prompts only
- Push notifications / email digests
- Edit/delete an item from the closet (use `I don't have this` as the only soft-delete)
- Currency or international formatting

---

## What to do when behavior diverges from this spec

Update this spec first. Then update the code to match. Don't backfill the spec from the code — drift the other direction.
