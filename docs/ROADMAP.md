# Roadmap

Each phase is a single feature branch, implemented in the smallest useful
increment, tested, reviewed and merged before the next begins.

| # | Phase | Deliverable |
| --- | --- | --- |
| 1 | Foundation | Monorepo, client/server boot, DB connection, docs, scripts |
| 2 | Authentication | Register, login, logout, hashing, tokens, protected routes |
| 3 | Core gameplay | Player craft, movement, shooting, health, death, one level |
| 4 | Combat & enemies | Multiple enemy types, projectiles, mines, turrets, formations |
| 5 | Level system | Data-driven levels, spawn phases, scaling, unlocking |
| 6 | Score & reward | Score sources, coin conversion, results screen |
| 7 | Backend persistence | Profile, progress, coins, unlocks, settings; validation |
| 8 | Upgrades | Weapon and aircraft upgrades, costs, UI, persistence |
| 9 | Aircraft & shop | Multiple aircraft, purchase, equip, shop UI |
| 10 | Boss system | Boss architecture, health bar, phases, rewards |
| 11 | Settings & UX | Control modes, audio settings, pause, profile, logout |
| 12 | Content & polish | 50 levels, environments, effects, audio, performance |

## Phase 1 acceptance criteria

- `pnpm install` succeeds.
- `pnpm dev` starts the Vite client and Fastify server.
- The client renders the Phaser canvas with a scrolling starfield and shows the
  API status.
- `GET /api/health` returns `200` with `{ status: 'ok' }`.
- `GET /api/health/db` confirms SQLite connectivity after `pnpm db:push`.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.

## Phase 2 acceptance criteria (complete)

- `User` and `RefreshToken` models in Prisma; schema pushed.
- Registration, login, logout and token refresh implemented under `/api/v1/auth`.
- Passwords hashed with Argon2id; never stored or returned in plaintext.
- Password policy enforced (8-72 chars, at least one letter and one number).
- Protected route `/api/v1/auth/me` requires a valid access token.
- Frontend auth state (`AuthProvider`) with login/register form and session restore.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.

## Phase 3 acceptance criteria (complete)

- Pure, framework-free simulation in `shared/src/core` (movement, weapons,
  spawning, collisions, health, score, game-over) with unit tests.
- Data-driven game config in `shared/src/config` (player, enemy, weapon, level).
- Phaser adapter split into input, renderer, HUD and scene modules.
- Controls: WASD, mouse follow (no clicking), Space and mouse fire, R to restart.
- One playable test level with a scrolling environment and basic enemy type.
- HUD shows health, score and level; Game Over state with restart.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified in a real browser via headless Chrome (scene boots; keyboard, mouse,
  shooting, collision, death and restart behave as expected).

## Phase 4 acceptance criteria (complete)

- Weapon architecture: damage, fire rate, projectile speed/count/spread and
  lifetime, all data-driven, with cooldown and projectile lifecycle.
- Four modular enemy types via a behavior registry: fighter (seeks and fires),
  bomber (slow, tough, spread salvo), mine (passive contact obstacle) and turret
  (anchors and fires aimed shots).
- Enemy projectiles, enemy health/damage/death, spawn formations
  (`random`/`line`/`v`/`column`) and collision handling.
- Reusable explosion, impact, hit and muzzle effects; pooled sprites for enemies
  and projectiles; in-place entity compaction.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified in a real browser (all enemy types, simultaneous enemies, player and
  enemy projectiles, player damage, effects) with stable object counts.

## Phase 5 acceptance criteria (complete)

- Data-driven, validated level model (id, number, difficulty, environment,
  scroll speed, start delay, completion mode, waves, obstacle sections, boss
  slot, reward).
- Level director: sequential waves with formations, parallel obstacle sections,
  and completion/failure detection.
- Configurable difficulty tiers that change speed, fire cadence and projectile
  speed (never health).
- Level states: `ready` (level start), `playing`, `levelComplete`, `gameover`.
- Progressive unlocking model (`isLevelUnlocked`, `getNextLevelId`).
- Five authored test levels across three environments and the `clear-waves` and
  `reach-distance` completion modes.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified in a real browser: all five levels play and complete, restart,
  next-level transition, unlocking and failure all behave correctly.

## Phase 6 acceptance criteria (complete)

- Centralized, config-driven scoring (`killMultiplier`; completed-bonus and
  boss/special sources prepared but unwired).
- Single score→coin conversion via the economy config; no coin rules in gameplay.
- `LevelResult` (`score`, `completionBonus`, `totalScore`, `coins`) produced on
  completion and emitted with the `levelComplete` event.
- Level-complete summary UI: level, score, completion bonus, total score, coins
  earned and best score.
- Score, reward and UI concerns separated.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified in a browser: level completion produces the correct result and coins,
  best score is recorded and replay resets cleanly.

## Phase 7 acceptance criteria (complete)

- `PlayerProfile` and `LevelProgress` models; migration pushed to the database.
- Authenticated `GET /api/v1/progress` returns coins, scores, current level and
  per-level completion/best score.
- `POST /api/v1/progress/levels/:levelId/complete` validates and persists a
  completion server-side; client reward/coin fields are rejected.
- Server validates level existence, unlock state, score plausibility and derives
  bonuses/coins itself; coins are awarded on first completion only.
- Handles unauthorized requests, invalid level ids, locked levels, invalid
  scores, duplicate submissions and per-user isolation.
- Client progress bridge loads best scores on login and persists completions.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified end to end: register → play → complete → reward → logout → login →
  progress restored.

## Phase 8 acceptance criteria (complete)

- Config-driven upgrade model with weapon (damage, fire rate, projectile count,
  projectile speed) and aircraft (health, armor, movement speed, fire power)
  upgrades, per-level values, costs and maximum levels.
- Shared `resolveLoadout` applies upgrades to the simulation; armor reduces
  incoming damage.
- `PlayerUpgrade` persistence and authenticated `GET /api/v1/upgrades` /
  `POST /api/v1/upgrades/:upgradeId/purchase` endpoints.
- Server validates upgrade id, current level, cost and balance; the client never
  sets the price.
- Upgrades UI with current level, current→next value, next cost, maximum-level
  state, coin deduction and insufficient-coins feedback.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified: display, purchase, coin deduction, gameplay effect and persistence
  after logout/login.

## Phase 9 acceptance criteria (complete)

- Data-driven aircraft model (id, name, health, armor, speed, fire power, fire
  rate, ability placeholder, price, unlock requirement, availability) with a
  small roster and load-time validation.
- Ownership: default, owned, locked and purchased states persisted per user.
- Shop UI: aircraft list, stats, price, locked/owned/equipped state, purchase and
  equip, with server feedback.
- `PlayerAircraft` persistence and `PlayerProfile.equippedAircraftId`; endpoints
  `GET /api/v1/aircraft`, `POST .../purchase`, `POST .../equip`.
- Server validates aircraft existence, purchasability, availability, price,
  balance and non-ownership.
- The equipped aircraft's stats drive the gameplay loadout through the shared
  resolver (no per-aircraft gameplay code).
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified: shop display, purchase, equip, gameplay effect and persistence after
  logout/login.

## Phase 10 acceptance criteria (complete)

- Reusable boss framework with separate concepts: boss state, health, movement
  behavior, attack pattern, phases and reward.
- One initial boss (Dreadnought) with distinct movement, at least two attack
  patterns, three phases, a health bar and a death/reward sequence.
- Boss health bar, damage handling, phase transitions, attack state, death and
  reward covered by tests.
- Level integration: selected levels reference a boss by id; the boss spawns
  after the waves; the level completes only once the boss is defeated.
- Server score validation includes boss damage and defeat score.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Verified in a browser: boss spawn, health bar, attack patterns, phase
  transitions, defeat, reward and level completion.

## Phase 11 preview (next, pending approval)

Settings & UX: control selection, shooting mode, audio settings, pause menu,
user profile and logout, plus UX improvements.



