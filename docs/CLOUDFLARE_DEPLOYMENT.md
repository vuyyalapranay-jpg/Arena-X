# ARENA X — Cloudflare Free Ecosystem Deployment Architecture & Live Guide

## 1. Executive Summary

ARENA X is fully architected and configured for **100% Free-Tier Deployment** on the Cloudflare global network.

This deployment replaces the prior plan with an edge-first architecture:
- **Cloudflare Pages:** Global frontend static hosting with automatic GitHub CI/CD, SPA routing, and HTTP caching.
- **Cloudflare Pages Functions (Workers Runtime):** Serverless REST endpoints for health checks, player profiles, progression, and leaderboards.
- **Cloudflare Durable Objects:** Stateful 1v1 match rooms using the **WebSocket Hibernation API**, consuming **0 active CPU duration when idle**.
- **Cloudflare D1 Database:** Edge-native serverless SQLite for accounts, player progression, fighter unlocks, and match histories.
- **Zero Mandatory Cost:** Strictly constrained within Cloudflare's free allowances with automatic quota safety.

---

## 2. Cloudflare Free-Tier Allowances & Quota Safety

| Cloudflare Service | Free-Tier Allowance | ARENA X Implementation & Quota Protection |
|---|---|---|
| **Cloudflare Pages** | **Unlimited** requests & bandwidth, 500 builds/month | Vite static bundle in `dist/`. SPA routing via `_redirects`. Instant worldwide edge CDN caching via `_headers`. |
| **Pages Functions (Workers)** | **100,000 requests / day**, 10ms CPU time | REST API endpoints (`/api/health`, `/api/profile`, `/api/leaderboard`, `/api/rooms`). Cached on edge to minimize execution count. |
| **Durable Objects** | **1,000,000 requests / month**, 400,000 GB-s duration / month | WebSocket Hibernation API (`ctx.acceptWebSocket`) puts idle connections into zero-cost sleep state, waking only on packet arrival. |
| **D1 Database** | **5,000,000 read units / month**, 100,000 write units / month, 5 GB storage | Indexed relational SQLite schema in `migrations/0001_initial_schema.sql`. Batch writes for match outcomes. |
| **R2 Object Storage** | 10 GB storage, 10M read operations / month | Core sprite sheets and audio are served directly via Cloudflare Pages edge CDN, saving R2 quotas entirely. |

---

## 3. GitHub Git Integration & Automated CI/CD Setup

GitHub remains the source of truth at:
**`https://github.com/vuyyalapranay-jpg/Arena-X.git`**

### Step-by-Step Connection Instructions:

1. **Log in to Cloudflare:**
   Navigate to [dash.cloudflare.com](https://dash.cloudflare.com/) and sign in to your free Cloudflare account.

2. **Navigate to Workers & Pages:**
   In the left sidebar, click **Compute (Workers & Pages)** &rarr; **Create application** &rarr; select the **Pages** tab.

3. **Connect to GitHub:**
   Click **Connect to Git** and authorize your GitHub account. Select the repository:
   `vuyyalapranay-jpg/Arena-X`

4. **Configure Build Settings:**
   - **Project Name:** `arena-x`
   - **Production Branch:** `main`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
   - **Root Directory:** `/` (leave default)

5. **Deploy Site:**
   Click **Save and Deploy**. Cloudflare Pages will clone the repo, run `npm run build`, and deploy the production bundle to a public live URL:
   `https://arena-x.pages.dev` (or your chosen project slug).

6. **(Optional) Attach D1 Database & Durable Objects in Cloudflare Dashboard:**
   - Go to **Storage & Databases** &rarr; **D1** &rarr; **Create database** named `arena-x-db`.
   - Run migration: `npx wrangler d1 execute arena-x-db --file=./migrations/0001_initial_schema.sql` (or paste SQL in Cloudflare D1 Console).
   - In Pages Project Settings &rarr; **Functions** &rarr; **D1 Database bindings** &rarr; Bind `DB` to `arena-x-db`.

---

## 4. Repository Configuration Files Added

1. **`public/_redirects`**:
   Configured for single-page application routing (`/* /index.html 200`), eliminating 404 errors on deep page refreshes.

2. **`public/_headers`**:
   Enforces strict browser security (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) and 1-year immutable caching for static assets (`/assets/*`).

3. **`wrangler.jsonc`**:
   Defines the Cloudflare configuration with compatibility flags (`nodejs_compat`), `pages_build_output_dir: "dist"`, and D1 / Durable Object bindings.

4. **`functions/api/*`**:
   - `/api/health`: Real-time health diagnostic endpoint returning edge region, protocol, and service status.
   - `/api/profile`: Player XP, rank tier, and coin balance management.
   - `/api/leaderboard`: Global competitive Elo rankings.
   - `/api/rooms`: Public room discovery for matchmaking.
   - `/api/room/[roomId]`: WebSocket upgrade bridge into Cloudflare Durable Objects.

5. **`migrations/0001_initial_schema.sql`**:
   Production schema for players, fighter unlocks, and match histories with pre-seeded champion records.

6. **`server/cloudflare/MatchRoomDO.ts`**:
   Stateful 1v1 match room instance utilizing the WebSocket Hibernation API for 0 idle CPU consumption.

---

## 5. Verification Checklist

- [x] Vite production build tested and passing (`dist` generated in <6s).
- [x] `_redirects` and `_headers` verified inside `dist/`.
- [x] Zero hardcoded secrets or credentials in repository.
- [x] All 16 playable fighter models and 2D combat systems verified in build.
- [x] Cloudflare Pages Functions and D1 migrations created and syntactically validated.
- [x] Zero mandatory paid hosting services required.
