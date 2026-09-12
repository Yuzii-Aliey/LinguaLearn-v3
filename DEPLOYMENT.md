# LinguaLearn v2 — Cloud Sync Deployment Guide (Phase 4)

## Architecture

- **Auth**: Netlify Identity (GoTrue) — chosen because the site already
  deploys on Netlify, so auth, JWT verification (`context.clientContext.user`),
  and Functions all live on one platform with zero additional vendors.
- **Database**: any Postgres (Neon / Supabase / RDS) accessed from Netlify
  Functions via Drizzle ORM.
- **Conflict strategy**: merge-max — numeric fields take the max of local vs
  cloud, lesson sets union, per-lesson stars take the max, and the streak
  record with the later active date wins. A stale or malicious client can
  never regress stored progress (the server re-merges on every write).

## One-time setup

1. **Enable Identity**: Netlify UI → Site settings → Identity → Enable.
   Optionally restrict signups / add external providers as desired.
2. **Create the database** and copy its connection string.
3. **Set environment variables** (Netlify UI → Site settings → Environment variables):
   - `DATABASE_URL` — the Postgres connection string
4. **Create tables** — run once against your database:
   ```bash
   npx drizzle-kit push   # reads netlify/shared/schema.js
   ```
   (Add a `drizzle.config.js` pointing at `netlify/shared/schema.js`.)
5. Deploy. The Functions at `netlify/functions/*.js` are auto-detected and
   served under `/api/*` via the redirect in `netlify.toml`.

## Environment variables reference

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Netlify env | Postgres connection for Functions |
| `NETLIFY_IDENTITY_URL` | auto (platform) | Not needed — JWT claims arrive via `context.clientContext.user` |

## API surface

| Endpoint | Auth | Behavior |
|---|---|---|
| `GET /api/get-progress` | required | 404 `{progress:null}` if never synced |
| `POST /api/save-progress` | required | server-side merge-max upsert |
| `POST /api/track-event` | optional | whitelisted event types, ≤2KB payload, 90-day retention |
| `GET /api/leaderboard` | public | top 10 by streak (tie-break XP), anonymized names, per-language learner counts; cached 5 min |

The leaderboard emails are masked server-side (`jane.doe@…` → `Jane Doe.`)
before the response is built — raw emails never leave the database. The
welcome screen hydrates its learner counts from the same endpoint and
keeps the static strings as an offline/first-paint fallback.

## Client behavior without Identity

`AuthManager` degrades to a signed-out no-op when the widget script is
unavailable (localhost, offline, non-Netlify host): no login UI action, no
sync calls, full local-only functionality.
