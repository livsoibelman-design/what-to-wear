# What to Wear

Your closet, reasoned over by AI.

Paste an order email → Claude pulls out the items → your closet builds itself. Then ask the stylist what to wear, give it thumbs up/down/wore, and watch it learn your taste.

## What's in here

- **`app/page.tsx`** — the whole app (closet, stylist, taste profile, returns, paste-an-email-to-add-an-item)
- **`app/api/stylist/route.ts`** — Claude generates outfit recs from your closet + taste profile
- **`app/api/parse-email/route.ts`** — Claude extracts items from an order email
- **`app/globals.css` + `tailwind.config.ts`** — cream/sand/cocoa palette, Playfair Display serif

State lives in your browser's localStorage under `wtw_state_v1`. No database, no login. v1 is single-device — that's intentional, we ship first and add accounts when the India build picks up.

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # then paste your Anthropic key into .env.local
npm run dev
```

Open http://localhost:3000.

## Going live

See **`DEPLOY.md`** — a step-by-step walkthrough written for non-developers. You'll end up with a real URL like `whattowear-liv.vercel.app` to text to friends.

## The architecture, in plain English

- The app is just a React page that lives in your browser.
- When you paste an order email, the page sends it to a small server function (`/api/parse-email`) that asks Claude to pull out the items and hands them back as JSON.
- When you ask the stylist for an outfit, the page sends your closet + recent feedback to a server function (`/api/stylist`) that asks Claude to style you.
- Your closet and your taste are stored in your browser. Clearing browser data wipes them. That's fine for v1.

## What's deliberately not here yet

- No accounts, no syncing across devices.
- No automatic Gmail connection — you paste emails for now (the magic-address forwarding gateway is the next move once a friend has used the app).
- No friend layer — that's the India build.
- No real product images — gradient color cards stand in. Images come from order email HTML or retailer scrapes later.
