# Air Combat

A desktop-first, single-player, browser-based arcade air combat game built as a
modern web application. Top-down 2D gameplay with pseudo-depth (parallax,
scaling, layering), a 50-level campaign, persistent progression, upgrades and an
aircraft shop.

> Status: **Phase 3 — Core Gameplay Prototype.** Account auth plus a playable
> test level: fly, shoot enemies, take damage, die and restart. Later phases add
> enemies, levels, progression and bosses.

## Overview

- **Genre:** top-down arcade air combat with visual depth.
- **Platform:** desktop browsers (Chrome/Firefox/Edge), keyboard + mouse.
- **Roadmap:** 50 single-player levels, score → coins, upgrades, aircraft shop,
  boss fights, persistent accounts.
- **Out of scope:** multiplayer, PvP, leaderboards, social features, mobile app,
  real-money purchases, ads, 3D/open-world gameplay.

## Technology stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript (everywhere) |
| Repository | pnpm workspaces monorepo (`shared`, `client`, `server`) |
| Game engine | Phaser 3 |
| Meta UI | React 18 + Vite |
| Backend | Node.js + Fastify |
| Validation | Zod |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma |
| Tests | Vitest |

See [`docs/DECISIONS.md`](docs/DECISIONS.md) for the rationale behind each choice.

## Controls

| Action | Input |
| --- | --- |
| Move | `W` `A` `S` `D` or move the mouse (the aircraft follows the pointer) |
| Fire | `Space` or left mouse button |
| Restart (on game over) | `R` |

The last movement device used takes over: pressing WASD switches to keyboard
control, moving the mouse switches back. Mouse control needs no clicking.

## Architecture

```
client (React shell + Phaser canvas)
   │  REST /api
   ▼
server (Fastify → services → Prisma)
   │
   ▼
SQLite (dev) / PostgreSQL (prod)
```

Gameplay **rules** live in the shared, framework-free simulation
(`shared/src/core`) and are unit-tested headlessly. Phaser only renders the
simulation, reads input and plays effects. Game data (player, enemies, weapons,
levels) lives in `shared/src/config` so content is added as data. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).


## Project structure

```
.
├── shared/   # framework-free game logic, schemas and static game data
├── client/   # Vite + React shell, Phaser game
├── server/   # Fastify API, Prisma database access
└── docs/     # architecture, decisions, roadmap
```

## Prerequisites

- Node.js >= 18.18 (Node 20/22 LTS recommended)
- pnpm (`npm install -g pnpm` or the standalone installer)

## Setup

```bash
# 1. Install dependencies for all workspaces
pnpm install

# 2. Configure environment
cp server/.env.example server/.env

# 3. Create the SQLite database and generate the Prisma client
pnpm db:push
```

## Running

```bash
# Run client and server together
pnpm dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001 (`/api/health`, `/api/health/db`)

Or run them individually:

```bash
pnpm --filter @game/client dev
pnpm --filter @game/server dev
```

## Environment variables

`server/.env` (never commit the real file):

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | Prisma database connection string |
| `PORT` | `3001` | API server port |
| `HOST` | `0.0.0.0` | API bind address |
| `NODE_ENV` | `development` | Runtime environment |
| `JWT_SECRET` | – (required) | Signing secret for access tokens, min 32 chars |
| `ACCESS_TOKEN_TTL` | `15m` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Refresh token/cookie lifetime in days |

Generate a strong `JWT_SECRET`, for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## API

All endpoints are under `/api/v1`. JSON request/response bodies. Authentication
uses a short-lived access token (`Authorization: Bearer <token>`) plus an
httpOnly refresh cookie.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | – | Create an account, returns access token + user |
| `POST` | `/api/v1/auth/login` | – | Log in, returns access token + user |
| `POST` | `/api/v1/auth/refresh` | cookie | Rotate refresh token, returns new access token |
| `POST` | `/api/v1/auth/logout` | cookie | Revoke refresh token and clear cookie |
| `GET` | `/api/v1/auth/me` | Bearer | Return the authenticated user |
| `GET` | `/api/health` | – | Server health |
| `GET` | `/api/health/db` | – | Database connectivity |

Passwords are hashed with Argon2id and never returned by any endpoint.


## Testing

```bash
pnpm test        # all workspaces
pnpm typecheck   # TypeScript project checks
pnpm lint        # ESLint
pnpm build       # production builds
```

## Git workflow

- `main` is always runnable and protected.
- One coherent feature per branch: `feature/<phase-or-feature>`.
- Squash-merge into `main` after acceptance criteria and tests pass.
- Conventional commit messages.
- Never commit secrets or `.env` files.

## Development roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phase plan. Current phase:
**Phase 2 — Authentication** (complete).
