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
  `ProjectileState`, `InputState`, `DirectorState`).
- `world.ts` — `createWorld` / `stepWorld`; wires the systems together.
- `systems/` — focused update systems (player movement, player weapon,
  projectiles, enemies, collisions).
- `levelDirector.ts` — wave/obstacle spawning and level completion.
- `difficulty.ts` — applies difficulty modifiers to enemy configs.
- `behaviors/` — one module per enemy behavior plus a registry (`runEnemyBehavior`).
- `weapons.ts`, `formations.ts`, `progression.ts`, `combat.ts`, `score.ts`, `math.ts`
  — small pure rule modules.
- `config/levels/` — level data model, validation, environments, difficulty
  presets and the authored levels (`shared/src/config/levels`).

`stepWorld(world, input, delta)` mutates the world, compacts dead entities in
place, and appends `GameEvent`s (level start/complete, shot fired, enemy
shot/hit/destroyed, player hit/destroyed) which the presentation layer consumes
for effects. Rendering, input, effects and gameplay rules stay independently
testable and replaceable.

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

### Level system

- A level is pure data: `id`, `levelNumber`, `name`, `difficulty`, `environment`,
  `arena`, `scrollSpeed`, `startDelaySeconds`, `completionMode`
  (`clear-waves` | `reach-distance`), optional `lengthUnits`/`loopWaves`, ordered
  `waves` (each a list of `SpawnGroup`s with formations), parallel
  `obstacleSections`, an optional `boss` reference, and `reward`.
- Levels live in `config/levels/level-XX.ts` and are registered in
  `config/levels/index.ts`, where each is validated with Zod and semantic checks
  (`parseLevelConfig`). Adding a level is a data file plus a registry entry.
- The `levelDirector` runs waves sequentially and obstacle sections on a parallel
  timeline, and reports completion (`isLevelCleared`) for both completion modes.
  `stepWorld` owns the lifecycle `ready → playing → levelComplete | gameover`.
- Difficulty is a tier (`easy`/`normal`/`hard`/`expert`) resolved to
  `DifficultyModifiers` (enemy speed, fire cadence, projectile speed) and applied
  to enemy configs at spawn — never by inflating health.
- `progression.ts` provides `isLevelUnlocked` (sequential) and `getNextLevelId`;
  the client tracks completions in memory until persistence arrives in Phase 7.

### Score and reward

- **Score calculation** lives in `core/scoring.ts` and is driven by
  `config/scoring.ts` (`killMultiplier`, plus prepared `bossDamageScore`,
  `bossDefeatScore`, `specialMultiplier`). Each score source has its own pure
  function; enemy kills use the enemy's configured value times the multiplier.
- **Reward calculation** lives in `core/rewards.ts` (`calculateCoins`) and is
  driven by `config/economy.ts` (`scorePerCoin`, `minCoinsPerLevel`). Nothing in
  gameplay hard-codes coin rules.
- On completion the simulation builds a `LevelResult`
  (`score`, `completionBonus`, `totalScore`, `coins`) stored on `world.result`
  and emitted with the `levelComplete` event. Gameplay score stays separate from
  the completion bonus.
- **Presentation** is separate: `GameScene` tracks best scores in memory (until
  persistence) and `Hud.showLevelComplete` renders the summary. The simulation
  never renders; the UI never computes rewards.

### Backend persistence and progression

- The database stores `PlayerProfile` (coins, totalScore, highestScore,
  currentLevelId) and one `LevelProgress` row per user/level (completed,
  bestScore, attempts, completedAt). Profiles are created on registration and
  lazily for pre-existing accounts.
- `GET /api/v1/progress` returns the profile and per-level progress;
  `POST /api/v1/progress/levels/:levelId/complete` submits only a gameplay
  `score`.
- The server is authoritative: it requires a known, unlocked level, bounds the
  score by `maxAchievableScore` (or an absolute ceiling for looping levels),
  reads the completion bonus from the level and converts to coins via the
  economy config. The request schema is strict, so client-supplied coin/reward
  fields are rejected. Coins are awarded only on a level's first completion;
  replays only improve best/total/highest scores.
- The client never computes authoritative rewards. A `GameProgressBridge` is
  injected into the game by the React shell: the game reports a completion and
  reads/updates a best-score map, while the shell owns the HTTP calls. The
  server's response (coins, best score) replaces the local summary when it
  arrives; failures fall back to the local summary.

### Upgrade system

- Upgrade definitions live in `config/upgrades.ts`: weapon (damage, fire rate,
  projectile count, projectile speed) and aircraft (health, armor, movement
  speed, fire power). Each is pure data with per-level `values` and `costs`, a
  `maxLevel` and an `add`/`multiply` mode; `assertUpgradeConfigs` validates the
  shape at load. The client and server derive the same values and prices.
- `core/loadout.ts::resolveLoadout(levels)` combines the base aircraft/weapon
  with upgrade levels into effective stats. The simulation uses this loadout for
  max health, movement speed, weapon damage/speed/count/fire rate and flat armor
  (`applyArmor` in `combat.ts`). No gameplay code hard-codes upgrade numbers.
- The database stores one `PlayerUpgrade` row per user/upgrade. The server owns
  purchases: `POST /api/v1/upgrades/:upgradeId/purchase` validates the upgrade id,
  reads the current level, computes the cost from the shared config, checks the
  balance and deducts it with a conditional update so a stale balance or a race
  cannot overspend. `GET /api/v1/upgrades` returns levels plus the profile.
- The UI is separate: `UpgradesPanel` renders levels, current→next values, costs
  and maximum-level state from the shared config, and shows server feedback
  (e.g. insufficient coins). Purchases update the profile and the game bridge's
  `upgradeLevels`, which `createWorld` uses on the next level load/restart.

### Aircraft system and shop

- Aircraft definitions live in `config/aircraft.ts`: id, name, description,
  base stats (health, armor, speed, fire power, fire rate, radius,
  invulnerability), weapon id, an ability placeholder, price, unlock kind and
  availability. `assertAircraftConfigs` validates them at load.
- Ownership: the default aircraft is always owned; purchased aircraft have a
  `PlayerAircraft` row. The equipped aircraft id is stored on `PlayerProfile`.
- `GET /api/v1/aircraft` returns ownership/equipped state for every aircraft.
  `POST /api/v1/aircraft/:id/purchase` and `.../equip` are server-authoritative:
  the server checks the id, availability, that it is purchasable, that it is not
  already owned and that coins cover the price, then creates the ownership row
  (unique constraint) before a conditional coin deduction. `canPurchaseAircraft`
  is the shared pure check used by the UI and the server.
- `resolveLoadout({ aircraft, upgrades })` combines the equipped aircraft's base
  stats with upgrades, so one gameplay implementation serves every aircraft. The
  client passes `bridge.aircraftId` into `createWorld`, so equipping changes the
  loadout on the next level load/restart.

### Boss system

- Bosses are data in `config/bosses.ts`: health, contact damage, defeat score, a
  projectile spec, entry position and an ordered list of phases. Each phase
  selects a movement behavior, a list of attack patterns, an attack interval and
  a speed. `assertBossConfigs` validates them at load.
- The framework in `core/bosses` keeps the concepts separate: `movements.ts`
  (sweep/hover/track) and `attacks.ts` (spread/aimed-burst/radial) are registries
  of small functions selected by id. `runBossMovement`/`runBossAttack` dispatch
  them; a new boss or pattern is an addition, never a giant boss class.
- `core/systems/boss.ts` owns spawning, entry, phase resolution (from health
  fraction, emitting a `bossPhase` event), attack timing and defeat (awarding the
  boss score). The simulation exposes one `world.boss` slot.
- Levels reference a boss by id (`LevelConfig.boss`); the level director spawns
  it once all waves and obstacle sections are emitted, after a configured delay.
  `isLevelCleared` requires `director.bossDefeated` for levels that have a boss.
- The client renders the boss sprite and a dedicated boss health bar, and maps
  boss events to effects. The server's `maxAchievableScore` includes boss damage
  and defeat score so submitted scores are validated.

### Settings, audio, pause and UX

- Settings are declared in `config/settings.ts` (movement, shooting, music/sfx
  toggles, master/music/sfx volumes) with a Zod schema, defaults and a
  partial-merge parser. They are stored on `PlayerProfile.settingsJson` and
  served by `GET`/`PUT /api/v1/settings`; the server validates on write and
  merges defaults on read.
- The client shell owns settings networking and injects them into the game via
  the progress bridge. `PlayerInput.read(settings)` honours the movement mode
  (keyboard or mouse) and shooting mode (space, mouse or both), so control
  switching is data-driven.
- `game/audio/AudioManager.ts` is a small Web Audio synthesizer: oscillator blips
  for shoot/hit/explosion/boss/jingle effects and a looping arpeggio for music,
  with gains driven by the persisted audio settings. It no-ops if Web Audio is
  unavailable.
- Pause is handled in `GameScene`: ESC toggles a pause state that stops
  `stepWorld`, and the HUD renders a keyboard-navigable menu (Resume, Settings,
  Restart Level, Exit to Menu). Settings opens the React panel via a bridge
  callback; Exit to Menu returns the shell to the menu.
- The React shell provides menu navigation, profile, settings, aircraft and
  upgrade panels, plus loading and error states with retry. Panels overlay the
  game so opening settings from the pause menu does not destroy the run.

The Phaser adapter (`client/src/game`) is split by concern:

- `input/PlayerInput.ts` — keyboard/pointer → engine-agnostic `InputState`.
- `render/WorldRenderer.ts` — world state → sprites, background scroll, environment.
- `render/Effects.ts` — shared particle emitters for explosion/impact/hit/muzzle.
- `render/SpritePool.ts` — reuses `Image` objects to avoid per-frame allocation.
- `ui/Hud.ts` — health, score, level, progress bar and state overlays.
- `scenes/GameScene.ts` — timing loop wiring, level loading, event → effect
  mapping, restart / next-level handling.
- `textures.ts` — procedurally generated placeholder sprites per enemy type.

Rendering depth is faked on a flat 2D gameplay plane via a scrolling starfield
whose per-star parallax and scale suggest distance; each environment sets the
background colour and star tint.

## Current phase

Phase 11 adds settings and UX: persisted controls (movement/shooting) and audio
settings with a Web Audio manager, an ESC pause menu that stops the simulation,
a profile page, menu navigation, and loading/error states. Phase 10 added the
boss system, Phase 9 the aircraft shop, Phase 8 upgrades, Phase 7 backend
persistence, Phase 6 scoring/rewards, Phase 5 the level system, Phase 4 the
combat/enemy system, Phase 3 the core gameplay prototype, Phase 2 authentication
and Phase 1 the project skeleton; a content/polish phase remains.


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

