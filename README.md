# Your Journey

A weight + food photo journal with username-based accounts (optional passphrase),
backed by Supabase, deployable to GitHub Pages.

## 1. Create the Supabase project

1. Go to https://supabase.com → New project (free tier is fine, no card needed).
2. Once it's ready, open **SQL Editor → New query**, paste in the entire contents
   of `supabase/schema.sql` from this repo, and click **Run**.
3. Go to **Storage** in the left sidebar → **New bucket** → name it exactly
   `photos` → toggle it **Public** → Create bucket.
   (Public means anyone with the exact file URL can view it. File paths include
   a random ID, so nobody can guess or list them without already knowing one.)
4. Go to **Settings → API**. You'll need two values from here in the next step:
   - **Project URL**
   - **anon public** key

## 2. Configure the app

Copy `.env.example` to `.env` and fill in the two values from step 1.4:

```
cp .env.example .env
```

Then edit `.env` in a text editor.

## 3. Run it locally (optional, to try it before deploying)

```
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## 4. Put it on GitHub

1. Create a new **public** repo on GitHub (any name — remember it, you'll need
   it in the next step).
2. Push this project to it:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```

## 5. Set the repo name in the build config

Open `vite.config.js` and change:
```js
base: "/your-journey/",
```
to match your actual repo name from step 4, e.g. `base: "/YOUR-REPO-NAME/",`
then commit and push that change.

## 6. Add your Supabase keys as GitHub secrets

In your repo on GitHub: **Settings → Secrets and variables → Actions → New
repository secret**. Add two secrets:

- `VITE_SUPABASE_URL` → your Project URL from step 1.4
- `VITE_SUPABASE_ANON_KEY` → your anon public key from step 1.4

## 7. Turn on GitHub Pages

In your repo: **Settings → Pages** → under "Build and deployment", set
**Source** to **GitHub Actions**.

## 8. Deploy

Push any commit to `main` (or re-run the "Deploy to GitHub Pages" workflow
from the **Actions** tab). After it finishes (~1–2 minutes), your site is live at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## How accounts work

- Creating an account just needs a **username** (unique) and an **optional
  passphrase**.
- If you set a passphrase, it's hashed with bcrypt in Postgres (via
  `pgcrypto`) — never stored or compared in plain text, and never sent
  anywhere except at the moment you type it in.
- If you don't set one, anyone who knows the username can log into that
  account from any device (no email, no recovery — that trade-off is
  intentional, matching "just a username, no email").
- Every table (`accounts`, `weight_logs`, `meal_photos`, `profiles`,
  `sessions`) has Row Level Security turned on with **no policies** — meaning
  the public anon key used by the browser cannot read or write them directly
  at all. The only way in is through the SQL functions in `schema.sql`, which
  check a session token (or passphrase) before touching anything. This keeps
  real access control on the server, not just in the React code.

## Project structure

```
supabase/schema.sql     — run this once in the Supabase SQL editor
src/supabaseClient.js   — Supabase client setup
src/lib/api.js          — every call to Supabase goes through here
src/pages/              — Auth, Onboarding, Today, Trend, Journal, Settings
src/App.jsx             — top-level routing/state
.github/workflows/      — auto-deploys to GitHub Pages on push to main
```
