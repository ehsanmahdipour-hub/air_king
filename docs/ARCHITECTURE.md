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

- `entities.ts` — `World` and per-entity state (`PlayerState`, `EnemyState`,
  `ProjectileState`, `InputState`).
- `world.ts` — `createWorld` / `stepWorld`; wires the systems together.
- `systems/` — focused update systems (player movement, player weapon,
  projectiles, spawning, enemies, collisions).
- `behaviors/` — one module per enemy behavior plus a registry (`runEnemyBehavior`).
- `weapons.ts`, `formations.ts`, `combat.ts`, `score.ts`, `math.ts` — small pure
  rule modules.
- `config/` — player, enemy, weapon and level data (`shared/src/config`).

`stepWorld(world, input, delta)` mutates the world, compacts dead entities in
place, and appends `GameEvent`s (shot fired, enemy shot/hit/destroyed, player
hit/destroyed) which the presentation layer consumes for effects. Rendering,
input, effects and gameplay rules stay independently testable and replaceable.

### Modular enemies and weapons

- Each enemy config is a **discriminated union on `behavior`**, so a behavior
  receives exactly its own typed fields. The registry (`behaviors/index.ts`)
  narrows the union; adding an enemy is a config entry, and adding a behavior is
  one small module plus a registry case — never an engine change.
- Behaviors only receive an `EnemyBehaviorContext` (enemy, player, arena, delta)
  and announce shots via `fire`. They have no access to world internals.
- Projectiles and weapons share one `ProjectileSpec` (damage, speed, radius,
  lifetime, count, spread). Player weapons and enemy weapons use the same
  `createProjectiles` function, so new weapons are data.
- Levels are an ordered list of `SpawnGroup`s with formations
  (`random`/`line`/`v`/`column`); `formations.ts` maps a group index to a spawn
  position.

The Phaser adapter (`client/src/game`) is split by concern:

- `input/PlayerInput.ts` — keyboard/pointer → engine-agnostic `InputState`.
- `render/WorldRenderer.ts` — world state → sprites, background scroll.
- `render/Effects.ts` — shared particle emitters for explosion/impact/hit/muzzle.
- `render/SpritePool.ts` — reuses `Image` objects to avoid per-frame allocation.
- `ui/Hud.ts` — health, score, level, game-over overlay.
- `scenes/GameScene.ts` — timing loop wiring, event → effect mapping, restart.
- `textures.ts` — procedurally generated placeholder sprites per enemy type.

Rendering depth is faked on a flat 2D gameplay plane via a scrolling starfield
whose per-star parallax and scale suggest distance.

## Current phase

Phase 4 adds the modular combat system: a player weapon architecture, four enemy
types (fighter, bomber, mine, turret) with pluggable behaviors, enemy
projectiles, spawn formations, damage/death, reusable effects and sprite
pooling. Phase 3 built the core gameplay prototype, Phase 2 authentication and
Phase 1 the project skeleton; remaining systems (levels, progression, bosses)
are implemented in later phases.


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

