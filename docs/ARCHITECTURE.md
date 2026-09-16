# Architecture

## Goals

- Maintainable, modular, testable, easy to extend.
- Data-driven game content (levels, enemies, weapons, aircraft, economy).
- Engine-agnostic game rules.
- Server-authoritative catalogs, prices and reward calculations.
- Small, incremental feature branches.

## High-level view

```
┌──────────────────────── Browser (client) ────────────────────────┐
│  React shell (routes, menus, shop, settings, auth)               │
│        │  REST /api/v1 (credentials: include)                    │
│        ▼                                                          │
│  Phaser adapter (renderer / input / audio)                       │
│        ▲                                   │ reads state, commands│
│        └──────── shared/core (pure simulation) ◄─────────────────┤
│  shared/config (game data + Zod schemas)                         │
└──────────────────────────────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼─────────────────────────────────────────────┐
│  Fastify: routes → services → Prisma                              │
│  auth · profile · levels · progress · economy · shop · upgrades   │
│  Uses shared/config as the authoritative catalog                  │
└────────────────────┬─────────────────────────────────────────────┘
                     ▼
              SQLite (dev) / PostgreSQL (prod)
```

## Separation of concerns

| Area | Location | Rule |
| --- | --- | --- |
| Game rules (pure) | `shared/src/core` | No Phaser, no DOM, no network |
| Game data | `shared/src/config` | Validated by Zod schemas |
| Shared types/schemas | `shared/src` | Imported by client and server |
| Rendering/input/audio | `client/src/game` | No game rules |
| Meta UI | `client/src/app` | React, talks to API |
| API | `server/src/routes` | Thin, validated handlers |
| Business logic | `server/src/services` | Economy, purchases, progression |
| Persistence | `server/src/db` + Prisma | Schema in `server/prisma` |

## Game loop architecture (target)

A deterministic fixed-timestep simulation in `shared/core`, driven by systems:

- `MovementSystem`, `WeaponSystem`, `SpawnSystem`, `CollisionSystem`
  (broad-phase grid), `DamageSystem`, `ScoreSystem`, `BossSystem`,
  `LevelDirector`, and an object `Pool` for projectiles/particles.

Phaser scenes read simulation state and draw it. Input is translated into
commands and fed into the simulation. Enemy behaviour is selected from a
strategy registry via data (`ai: { type, params }`), so adding an enemy is a
config change plus, at most, one small behaviour module.

Rendering depth is faked on a flat 2D gameplay plane: a virtual `z` drives sprite
scale, depth sorting, shadow offset and background parallax. Keeping collisions
on the plane makes them cheap and precise.

## Server authority and trust model

Browser clients cannot be fully trusted. Therefore:

- Level catalogs, economy values, upgrade and aircraft prices live in
  `shared/config` and are bundled into the server.
- The client submits a **level result** (level id, score, stats).
- The server validates plausibility (level exists and is unlocked, score within
  theoretical bounds, duration sane), recomputes rewards from the economy config
  and persists progress.
- Client-supplied balances, prices and unlock flags are never trusted.

## Data model (target)

Static catalogs (in `shared/config`): `LevelConfig`, `SpawnPhase`, `EnemyConfig`,
`WeaponConfig`, `AircraftConfig`, `UpgradeConfig`, `BossConfig`, `EconomyConfig`.

Per-user state (in the database): user credentials, refresh tokens, player
profile (coins, current level, scores, equipped aircraft, settings), level
progress, owned aircraft, upgrade levels.

## Authentication

- **Passwords** are hashed with Argon2id (19 MiB, 2 iterations). Only the hash is
  stored; passwords and hashes are never returned by any endpoint.
- **Access token**: short-lived JWT (HS256, `JWT_SECRET`), sent by the client as
  `Authorization: Bearer <token>` and held in memory only.
- **Refresh token**: opaque random value delivered as an `httpOnly`, `SameSite=Lax`
  cookie scoped to `/api/v1/auth` (`Secure` in production). Only its SHA-256 hash
  is stored, and it is rotated on every refresh. Reuse of a rotated token revokes
  all of that user's active sessions.
- **Authorization**: protected routes use the `requireAuth` preHandler, which
  attaches `request.authUser`. Ownership checks use the token subject, never
  client-supplied ids.
- **Error handling**: `AppError` and `ZodError` are mapped by a central Fastify
  error handler to structured, non-leaking responses.

## Current phase

Phase 2 adds authentication: `User`/`RefreshToken` models, Argon2id hashing,
JWT access tokens with rotating refresh cookies, `/api/v1/auth/*` routes, a
protected `/api/v1/auth/me` route, and frontend auth state with login/register
UI. Phase 1 delivered the skeleton (client/server boot, DB connectivity, shared
config). Gameplay architecture above describes the target and is implemented
incrementally.

