# HeyVanilla — Setup Guide

Everything you need to go from a fresh machine to the app running locally, then live. Follow it top to bottom the first time. Later you'll only need Part 4 (run) and Part 7 (deploy).

---

## Part 0 — What you need installed first

| Tool | Version | Check it | Get it |
|---|---|---|---|
| Node.js | 20 or higher | `node -v` | https://nodejs.org (LTS) |
| npm | comes with Node | `npm -v` | — |
| Git | any recent | `git --version` | https://git-scm.com |
| Docker *(optional)* | any recent | `docker -v` | https://docker.com — only needed for the container run / Railway parity |

A free **Supabase** account is also required (the database + auth live there): https://supabase.com

> If `node -v` shows anything below 20, install Node 20 LTS first. On a Mac with Homebrew: `brew install node@20`. With nvm: `nvm install 20 && nvm use 20`.

---

## Part 1 — Get the code

```bash
git clone https://github.com/priyankabana/heyvanilla.git
cd heyvanilla
```

From here on, every command assumes you're inside the `heyvanilla/` folder.

---

## Part 2 — Install dependencies

```bash
npm install
```

This pulls in Next.js, Supabase, Tailwind, Framer Motion and the rest. It takes a minute or two the first time. When it's done you'll have a `node_modules/` folder (already git-ignored, so it never gets committed).

---

## Part 3 — Set up Supabase (the database + auth)

This is the one part that touches an external service, so take it slowly.

### 3.1 Create the project
1. Sign in at https://supabase.com and click **New project**.
2. Give it a name (e.g. `heyvanilla`), set a strong database password (save it somewhere), pick the region closest to you.
3. Wait for it to finish provisioning — a minute or so.

### 3.2 Grab your keys
1. In the project, go to **Project Settings → API**.
2. Copy these two values, you'll need them in Part 4:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *(Do **not** copy the service_role key — the app never needs it.)*

### 3.3 Build the database
1. Open the **SQL Editor** in the Supabase sidebar.
2. Open `supabase/schema.sql` from this project, copy the **entire** file.
3. Paste it into a new query and click **Run**.

That one file creates all 20 tables, turns on Row Level Security with owner-only policies, adds the trigger that auto-creates a profile when someone signs up, enables realtime on the live tables, and sets up the uploads storage bucket. You should see a success message and the tables appear under **Table Editor**.

### 3.4 Turn on email auth + set the URLs
1. Go to **Authentication → Sign In / Providers** and make sure **Email** is enabled (it is by default).
2. Go to **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/**`
   - (You'll add your real production URL here later, in Part 7.)

### 3.5 Google sign-in *(optional — skip if you only want email login)*
The app has a Google button. To make it work:
1. In **Google Cloud Console** (https://console.cloud.google.com) create a project, then go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorized redirect URIs**, add the callback URL Supabase gives you. You'll find it in Supabase under **Authentication → Providers → Google** — it looks like `https://<your-project>.supabase.co/auth/v1/callback`.
4. Copy the Google **Client ID** and **Client Secret** into that same Supabase Google provider screen and enable it.

If you skip this, email/password still works fine — the Google button just won't be configured.

---

## Part 4 — Configure and run locally

### 4.1 Create your env file
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in at least the Supabase values from step 3.2:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

The Spotify and TMDB values are optional — leave them as placeholders if you don't use those widgets. Weather needs no key.

> Note: `.env.local` is git-ignored on purpose. Never commit real keys.

### 4.2 Start the dev server
```bash
npm run dev
```

Open **http://localhost:3000**. You'll get the splash animation, then the login screen.

### 4.3 Make an account and test it
1. Switch to **Sign up**, register with an email + password.
2. Depending on your Supabase settings you may need to confirm via email (you can toggle email confirmation off in **Authentication → Sign In / Providers → Email** while developing).
3. Once in, you land on the dashboard home. That proves the whole chain works: signup → profile auto-created by the trigger → session set → protected route lets you through.

That's it running. 🍦

---

## Part 5 — The other commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (use this day to day) |
| `npm run typecheck` | Runs the TypeScript compiler in strict mode — **run this before committing** |
| `npm run lint` | ESLint check |
| `npm run build` | Production build |
| `npm start` | Serves the production build (run `npm run build` first) |

**Recommended check before any commit:**
```bash
npm run typecheck && npm run lint && npm run build
```
If all three pass, you're safe to push.

---

## Part 6 — Running the production build / Docker (optional)

Plain production build:
```bash
npm run build
npm start
# serves on http://localhost:3000
```

With Docker (matches how it runs on Railway):
```bash
docker compose up --build
```
This builds the multi-stage image and runs it as a non-root user, same as production. Stop it with `Ctrl+C`, or `docker compose down`.

---

## Part 7 — Deploy to Railway (live URL)

1. Push the repo to GitHub.
2. Go to https://railway.app, **New Project → Deploy from GitHub repo**, pick this repo. Railway reads `railway.json` and builds from the `Dockerfile` automatically.
3. In the Railway service → **Variables**, add the same env vars from your `.env.local`, but change:
   - `NEXT_PUBLIC_SITE_URL` → your Railway URL (e.g. `https://heyvanilla.up.railway.app`)
   - `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` → the production callback (when you wire Spotify up)
4. Back in **Supabase → Authentication → URL Configuration**, add your Railway URL:
   - Site URL → your Railway URL
   - Redirect URLs → add `https://your-app.up.railway.app/**`
   - If you set up Google, also add the production redirect in Google Cloud Console.
5. The healthcheck is already pointed at `/login`, so Railway knows when the app is up.

### Auto-deploy via GitHub Actions
There's a workflow at `.github/workflows/deploy.yml` that typechecks, lints and builds on every push, and deploys on push to `main`. For it to work, add these in your GitHub repo under **Settings → Secrets and variables → Actions**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RAILWAY_TOKEN` (from Railway account settings)

---

## Part 8 — When something breaks

| Symptom | Likely cause / fix |
|---|---|
| `npm install` fails on engine version | Node is below 20. Upgrade Node, delete `node_modules` and `package-lock.json`, run `npm install` again. |
| Login spins / "auth" errors | Supabase URL or anon key wrong in `.env.local`, or the redirect URL isn't whitelisted in Supabase → URL Configuration. |
| "relation does not exist" type DB errors | `schema.sql` didn't run (or only partly). Re-run the whole file in the SQL editor. |
| Signup works but you never get logged in | Email confirmation is on — either confirm via the email, or turn confirmation off in Supabase Email settings while developing. |
| Google button does nothing | Google provider not enabled in Supabase, or the redirect URI in Google Cloud doesn't match the Supabase callback exactly. |
| Styles look unstyled / wrong colours | Hard refresh. The theme is set via a cookie on first load; clearing cookies resets it to the default Princess Barbie theme. |
| Changes to env vars not picked up | Restart `npm run dev` — env files are only read at startup. |
| Port 3000 already in use | `npm run dev -- -p 3001` to run on another port (update Site URL accordingly). |

> Supabase occasionally renames menu items in its dashboard. If a label here doesn't match exactly, look for the nearest equivalent under **Project Settings**, **Authentication**, or **SQL Editor** — the steps themselves don't change.

---

That's the whole thing. First run takes maybe 15–20 minutes mostly because of the Supabase setup; after that it's just `npm run dev`.
