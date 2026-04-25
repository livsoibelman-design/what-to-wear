# Get this thing live (no dev experience needed)

Goal: a real URL like `whattowear-liv.vercel.app` you can text to friends.
Time: ~20 minutes.
Cost: $0.

You will not touch a terminal. Everything below is point-and-click.

---

## What you need before you start

1. **A GitHub account** — github.com (free, sign up if you don't have one).
2. **A Vercel account** — vercel.com (free, sign in with GitHub).
3. **An Anthropic API key** — console.anthropic.com → Settings → API Keys → Create Key. Copy the key (starts with `sk-ant-…`). Paste it somewhere safe; you'll need it in step 4.

---

## Step 1 — Put the code on GitHub

GitHub is where the code lives. Vercel reads from there.

1. Open github.com and sign in.
2. Click the **`+`** in the top right → **`New repository`**.
3. Name it `what-to-wear`. Leave everything else default. Click **`Create repository`**.
4. On the next page, look for the option **`uploading an existing file`** (it's a small link in the middle of the page).
5. In Finder, open the folder `what-to-wear-app/`. Select EVERYTHING inside it (Cmd+A) and drag it into the GitHub upload area in your browser.
   - ⚠️ Do NOT drag the folder itself — drag the contents.
   - ⚠️ It is fine if you don't see the `.gitignore` or `.env.example` files in Finder — they're hidden. Press Cmd+Shift+. (period) in Finder to show hidden files, then re-select.
6. Scroll down. Add a commit message like `initial commit`. Click **`Commit changes`**.
7. Wait until the upload finishes. You should now see all the files (`app/`, `package.json`, `README.md`, etc.) listed on the repo page.

---

## Step 2 — Connect to Vercel

Vercel is what turns the code into a live website.

1. Open vercel.com and sign in (use "Continue with GitHub" — it's the easiest).
2. On the dashboard, click **`Add New…`** → **`Project`**.
3. You'll see a list of your GitHub repos. Find `what-to-wear` and click **`Import`**.
4. On the next screen, leave all the defaults alone. **DO NOT click Deploy yet.** Scroll down to find **`Environment Variables`** and expand it.

---

## Step 3 — Paste your Anthropic key

This is the only secret the app needs.

1. In the Environment Variables section, you'll see two empty boxes: `Key` and `Value`.
2. In the **Key** box, type exactly: `ANTHROPIC_API_KEY`
3. In the **Value** box, paste your Anthropic key (the `sk-ant-…` thing).
4. Click **`Add`**.

---

## Step 4 — Deploy

1. Click the big **`Deploy`** button at the bottom.
2. Wait ~2 minutes. You'll see a build progress screen.
3. When it's done, you'll see confetti and a URL like `what-to-wear-xyz123.vercel.app`. Click it. That's your live app.

---

## Step 5 — Use it / send it to friends

- Open the live URL.
- Hit the **`Add an item`** button → paste any order email from Reformation/Free People/etc → watch items appear.
- Tap **`Ask the stylist`** and try "drinks Saturday in SoHo" or "flying back to LA tomorrow."
- Thumbs up / down / "I wore this" — the stylist learns from those.
- Send the URL to one friend. Tell her to do the same. (Her closet will be hers, on her browser — they don't mix yet. That's the next build.)

---

## If something goes wrong

**Build failed on Vercel?**
Click into the failed deployment → Logs tab → copy the error and send it to me. 90% of the time it's a typo in the env variable name (it must be exactly `ANTHROPIC_API_KEY`, all caps, with the underscore).

**Stylist says "Server is missing ANTHROPIC_API_KEY"?**
You skipped Step 3, or the key is misspelled. Go to Vercel → your project → Settings → Environment Variables → fix it → then Deployments tab → click the `…` next to the latest deployment → Redeploy.

**You change your Anthropic key later?**
Same flow: Settings → Environment Variables → edit value → Redeployments → Redeploy.

**You want a custom domain (whattowear.app instead of vercel.app)?**
Buy the domain (Namecheap, Cloudflare). In Vercel → Settings → Domains → Add → follow the DNS instructions Vercel gives. Free on Vercel's side.

---

## What this costs you

- Vercel: free tier, plenty of headroom for the friend group.
- Anthropic: pay-per-call. With Sonnet 4.5, an outfit rec costs roughly $0.01-$0.03. Email parsing is similar. 100 friends × 10 outfits/week ≈ $10-30/week. Set a billing limit at console.anthropic.com → Usage.
- GitHub: free.

---

## What's next once a few friends are using it

This is the order of moves, ranked by leverage:

1. **Email forwarding gateway** — a magic address `closet@whattowear.app` that auto-ingests forwarded order emails. Beats asking friends to copy/paste. ~$200 Upwork hire or one weekend with the India partner.
2. **Real accounts + cross-device sync** — Supabase, login by email magic link. The India build.
3. **Real product images** — pull from the HTML of the order email or scrape the retailer page. Already have the URLs in inboxes.
4. **Friend layer** — vibe-match across friends' closets, "what's everyone wearing tonight" view.

Don't build any of those yet. Get 3 friends actually using v1 first. That tells you which one matters most.
