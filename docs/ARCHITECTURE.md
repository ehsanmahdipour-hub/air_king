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

## Game simulation

The core is a deterministic, fixed-step simulation in `shared/src/core` that is
completely free of Phaser, DOM and network code:

- `world.ts` — world state (`World`) and `createWorld` / `stepWorld`.
- `combat.ts`, `score.ts`, `weapons.ts`, `math.ts` — small pure rule modules.
- `config/` — player, enemy, weapon and level data (`shared/src/config`).

`stepWorld(world, input, delta)` mutates the world and appends `GameEvent`s
(shot fired, enemy destroyed, player hit, player destroyed) which the
presentation layer consumes for effects. This keeps rendering, input, audio and
gameplay rules independently testable and replaceable.

The Phaser adapter (`client/src/game`) is split by concern:

- `input/PlayerInput.ts` — keyboard/pointer → engine-agnostic `InputState`.
- `render/WorldRenderer.ts` — world state → sprites, background scroll, effects.
- `ui/Hud.ts` — health, score, level, game-over overlay.
- `scenes/GameScene.ts` — timing loop wiring, restart handling, no game rules.
- `textures.ts` — procedurally generated placeholder sprites.

Rendering depth is faked on a flat 2D gameplay plane via a scrolling starfield
whose per-star parallax and scale suggest distance. Later systems (multiple
enemy types, formations, bosses) extend the simulation and config rather than
the engine.

## Current phase

Phase 3 adds the core gameplay prototype: a pure simulation (player movement,
weapons, spawning, collisions, health, score, game over), data-driven player,
enemy, weapon and level config, a Phaser adapter split into input, renderer, HUD
and scene modules, and one playable test level. Phase 2 added authentication and
Phase 1 the project skeleton; the remaining systems above are implemented in
later phases.


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

