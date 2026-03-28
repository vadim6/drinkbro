# DrinkBro

A drink ordering app for small gatherings (e.g. dinner parties). Guests order drinks via a secret URL; the host manages the queue on a barista screen.

> **IMPORTANT:** This Next.js version may have breaking changes vs. training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Tech Stack

- **Framework:** Next.js (App Router, server components), React, TypeScript
- **Database:** SQLite via `better-sqlite3` (WAL mode), file at `orders.db` (or `$DB_PATH` in prod)
- **Styling:** Tailwind CSS v4, custom warm coffee-shop color theme
- **Real-time:** Server-Sent Events (SSE) via Node.js `EventEmitter`
- **Deployment:** Docker (multi-stage Alpine), Fly.io

## Project Structure

```
drinkbro/
├── app/
│   ├── layout.tsx                       # Global layout (fonts, metadata)
│   ├── globals.css                      # Tailwind + custom theme colors + animations
│   ├── page.tsx                         # Root → returns 404
│   ├── drink/[slug]/
│   │   ├── page.tsx                     # Server component — validates slug, renders DrinkView
│   │   └── DrinkView.tsx                # Guest ordering UI (client component)
│   ├── barista/[slug]/
│   │   ├── page.tsx                     # Server component — validates slug, renders BaristaView
│   │   └── BaristaView.tsx              # Barista dashboard, SSE listener (client component)
│   └── api/
│       ├── menu/route.ts                # GET /api/menu — serves menu.json
│       ├── orders/route.ts              # GET (all orders), POST (create), DELETE (reset)
│       ├── orders/stream/route.ts       # GET /api/orders/stream — SSE feed
│       └── orders/[id]/route.ts         # PATCH /api/orders/:id — update status
├── lib/
│   ├── db.ts                            # getDb() singleton, Order type, schema init
│   ├── menu.ts                          # Menu/DrinkDef/CustomizationDef types, menu loader
│   └── emitter.ts                       # Global orderEmitter (EventEmitter) for SSE broadcast
├── public/                              # Static assets (logo.svg, barista.png)
├── menu.json                            # Drink definitions + customization options
├── next.config.ts                       # better-sqlite3 as server-only, standalone output, CORS
├── Dockerfile                           # Multi-stage Alpine build
└── fly.toml                             # Fly.io deployment config
```

## Key Concepts

**Secret slug:** Access is gated by a URL slug (`/drink/<slug>`, `/barista/<slug>`). Set via `HASH_SLUG` env var. The server component validates it and returns 404 on mismatch. If unset, any slug is accepted (dev convenience). Root `/` always returns 404.

**Menu:** Defined in `menu.json`. Each drink lists customization IDs. Two customization types: `toggle` (checkbox) and `select` (dropdown), with defaults.

**Orders:** Stored in SQLite. `customizations` column is a JSON string. Status field tracks order lifecycle (`pending` → `done`, revertible).

**Real-time flow:** `POST /api/orders` → writes to DB → emits on `orderEmitter` → SSE stream pushes event → barista page updates live.

**DB singleton:** `getDb()` in `lib/db.ts` caches the connection on `globalThis` to survive hot reloads in dev.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `HASH_SLUG` | Secret URL slug. Generate with `openssl rand -hex 8`. Set via `fly secrets set` in prod. |
| `DB_PATH` | Path to SQLite file. Defaults to `orders.db` in project root. |

## Commands

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint
```

## Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).
