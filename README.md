# HeyVanilla

**Live demo:** https://heyvanilla.vercel.app

*"don't melt, Vanilla. you got this."*

> A soft, personal life-tracker — habits, tasks, journal, money, mood, health, study and goals in one themeable dashboard — built with Next.js 14, Supabase (Postgres + Auth + RLS) and TypeScript.

Open it in the morning, close it at night, and feel like you have your life together — in something warm and personal instead of another grey productivity dashboard. Project #1 of a personal 30-day portfolio challenge.

**Live demo:** _TODO — add URL after deploying (see [Deployment](#deployment-notes))._

## Screenshots

> _TODO: add screenshots to `docs/screenshots/` and link them here._
>
> | Dashboard | Habits | Finance | Themes |
> | --- | --- | --- | --- |
> | `dashboard.png` | `habits.png` | `finance.png` | `themes.png` |

## Features

- **Auth:** email/password and Google OAuth via Supabase Auth, password reset, OAuth callback route. Every route except `/login` is protected **server-side** in Next.js middleware.
- **Bento dashboard:** greeting, split-flap clock, quote of the day (100 affirmations), today's habits, pending tasks, water tracker, mood check-in, monthly balance, goal progress, weather (Open-Meteo), Spotify now-playing. Widgets are **drag-and-drop reorderable** (dnd-kit) and the layout is saved per user.
- **Habits** with emoji, daily tick-off, 28-day completion grid and streaks.
- **Tasks** with priorities, due dates and filters (to-do / due today / done).
- **Journal** (gratitude / reflection / free-write, with mood and inline `#tags`) and **sticky notes** (colour + pin).
- **Finance:** income, expenses, bills, monthly summary in ₹ and a category donut chart (Recharts).
- **Goals** with a why, deadline, subtask checklist and progress; **wishlist + bucket list**; **media library** with status, 5-star rating and optional TMDB posters.
- **Health** (water, sleep, food log), **study** timer + Pomodoro (Web Audio chime) + weekly-hours chart, **mood** history with a 14-day trend, **vision board**, **yearly review** page.
- **Achievements** that unlock automatically from activity, with confetti.
- **⌘K command palette** to search tasks, notes, journal and habits or jump to any page.
- **Nine themes** built purely from CSS variables; the choice syncs across devices.
- **PWA** (installable, `next-pwa`), themed 404/error pages, skeleton loaders, staggered animations.

## Architecture

```mermaid
flowchart LR
    B[Browser<br/>React 18 + Zustand + Framer Motion] -->|HTTPS| N[Next.js 14 App Router<br/>middleware: session refresh + route guard<br/>CSP & security headers]
    N --> P[Server components / route handlers<br/>/api/tmdb]
    B -->|supabase-js, anon key| S[(Supabase<br/>Postgres + Auth + Realtime + Storage)]
    N -->|@supabase/ssr cookies| S
    S --- R[RLS: auth.uid() = owner<br/>on all 20 tables]
    B --> X[Open-Meteo · Spotify PKCE]
    P --> T[TMDB API<br/>server-side key]
```

Data access goes straight from the client to Supabase through a typed `useRows` hook; **Row Level Security** is what keeps each user's rows private, so the anon key is safe in the browser.

## Security

- Server-side route protection in middleware (`@supabase/ssr`, `getUser()` revalidates the token).
- RLS enabled on all 20 tables with owner-only select/insert/update/delete policies; a signup trigger creates the profile row; storage bucket policies scope uploads to the user's folder.
- Strict Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer- and Permissions-Policy in `next.config.js`.
- No `dangerouslySetInnerHTML`; auth forms validated with zod; third-party keys (TMDB) stay server-side.
- Docker image runs as a non-root user and only receives public build args.

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Supabase (Postgres, Auth, Realtime, Storage, RLS) · Tailwind CSS + CSS variables · Zustand · Framer Motion · dnd-kit · Recharts · zod · next-pwa · Docker · GitHub Actions

## Quick start

Prerequisites: Node 20+, a free [Supabase](https://supabase.com) project.

```bash
git clone https://github.com/priyankabana/heyvanilla.git
cd heyvanilla
npm ci
cp .env.example .env.local     # fill in NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
```

In the Supabase dashboard → SQL editor, paste and run `supabase/schema.sql` (tables, RLS policies, trigger, realtime, storage bucket). Optionally enable Google under Authentication → Providers and add `http://localhost:3000/auth/callback` to the redirect URLs.

```bash
npm run dev                    # http://localhost:3000 → sign up → you're in
```

Step-by-step guide with screenshots-level detail: [SETUP.md](SETUP.md).

## Environment variables

| Variable | Required | Exposed to browser | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | Supabase anon key (safe because of RLS) |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | no | yes | Spotify now-playing widget (PKCE, no client secret) |
| `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` | no | yes | Must match the Spotify app's redirect URI |
| `TMDB_API_KEY` | no | **no** | Poster lookup in `/api/tmdb` |

Weather uses Open-Meteo (no key). No service-role key is needed by the app.

## Project structure

```
app/
  (auth)/login/          login / sign-up / reset
  (dashboard)/           protected pages: home + one folder per feature
  api/tmdb/              server-side poster lookup
  auth/callback/         OAuth / magic-link code exchange
components/              splash, command palette, layout (sidebar, nav), ui kit, widgets, providers
features/                one folder per feature (habits, tasks, finance, goals, mood, study, …)
lib/
  supabase/              browser + server clients, session middleware, DB types
  hooks/                 useRows (typed data hook), useWeather, …
  validations/           zod schemas
  utils/                 cn, dates, sanitize, rate-limit helper
styles/themes/           the 9 theme files
supabase/schema.sql      full schema + RLS, copy-paste ready
middleware.ts            auth guard
next.config.js           CSP + security headers, PWA, standalone output
Dockerfile · railway.json · docker-compose.yml
```

## Testing

No automated test suite yet. Quality gates (also run in CI, `.github/workflows/deploy.yml`):

```bash
npm run typecheck    # tsc --noEmit — passes
npm run lint         # next lint — no warnings or errors
npm run build        # production build — passes
```

## Deployment notes

- **Vercel (simplest):** import the repo, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ optional vars), deploy. Then add `https://<your-domain>/auth/callback` to Supabase → Authentication → URL Configuration (and to Google/Spotify if used).
- **Railway (Docker):** `railway.json` builds the `Dockerfile` (Next.js standalone output, non-root user). Pass the two `NEXT_PUBLIC_SUPABASE_*` values as build args/variables. The GitHub Actions deploy job is opt-in: set repo variable `DEPLOY_RAILWAY=true` and secret `RAILWAY_TOKEN`.
- **Backend:** Supabase is the backend — there is no separate server to host. There is **no offline/demo mode**; a Supabase project is required (the free tier is enough). For reviewers, consider creating a demo account and listing its credentials on the live site only.

## What I learned

- Building on Next.js 14 App Router: server vs client components, route groups, middleware and route handlers.
- Designing a multi-tenant Postgres schema where security lives in the database (RLS policies keyed on `auth.uid()`), not in UI checks.
- Cookie-based Supabase sessions with `@supabase/ssr` and server-side route protection.
- Shipping security headers and a real Content-Security-Policy, and what each third-party integration forces you to allow.
- Theming an entire app with CSS variables, and drag-and-drop layout persistence with dnd-kit.
- Containerising a Next.js app (standalone output, multi-stage Docker build, non-root runtime) and wiring CI for typecheck/lint/build.

## License

MIT © 2026 Priyanka Bana — see [LICENSE](LICENSE).
