# Decision log

Short architectural decision records (ADRs). Newest decisions are appended.

## ADR-0001: TypeScript monorepo with pnpm workspaces

**Decision.** One repository with three workspaces: `shared`, `client`, `server`.
**Why.** Game data, schemas and types must be identical on both sides. A shared
workspace removes duplication and drift. pnpm workspaces are disk-efficient and
fast without adding extra tooling.

## ADR-0002: Phaser 3 for gameplay rendering

**Decision.** Use Phaser 3 for rendering, input, audio, scene management and
sprite pooling; keep game rules out of Phaser.
**Why.** A battle-tested 2D engine removes a large amount of rendering, input and
audio work that would otherwise be reimplemented. Keeping rules in a pure core
preserves testability and makes the engine replaceable if needed. A from-scratch
renderer was rejected as unnecessary cost; a heavy ECS was rejected as
over-engineering.

## ADR-0003: React for meta UI

**Decision.** React + Vite for menus, shop, upgrades, settings and auth screens;
Phaser only for the game canvas.
**Why.** These screens are forms and lists, where the DOM and React excel.
Rendering them inside the canvas would be slower to build and maintain.

## ADR-0004: Fastify backend

**Decision.** Fastify, with Zod for validation.
**Why.** Fast, TypeScript-friendly, built-in schema support, and a clean plugin
ecosystem for cookies, CORS and rate limiting needed in later phases.

## ADR-0005: Prisma with SQLite for development, PostgreSQL for production

**Decision.** Prisma ORM; SQLite locally, PostgreSQL in production.
**Why.** SQLite gives zero-infrastructure local development (no Docker required
yet). Prisma abstracts the provider so switching is a connection-string and
migration change. The schema is designed to be portable.

## ADR-0006: Shared data-driven game configuration

**Decision.** Levels, enemies, weapons, aircraft, bosses and economy live in
`shared/src/config`, validated by Zod.
**Why.** New content should not require gameplay code changes. A single validated
catalog lets the client render content and the server validate it authoritatively.

## ADR-0007: Select package manager and node baseline

**Decision.** pnpm; Node >= 18.18, with Node 20/22 LTS recommended.
**Why.** The development machine initially had no package manager. pnpm was
installed via the standalone installer. Node 18 was already present; upgrading is
recommended but not blocking for the foundation phase.

## ADR-0008: Access token + rotating refresh cookie

**Decision.** Short-lived JWT access tokens (in memory) plus an opaque, hashed,
rotating refresh token in an httpOnly cookie.
**Why.** The access token keeps protected requests stateless and fast; the
refresh cookie survives reloads without exposing the token to JavaScript.
Rotation with reuse detection limits the damage of a stolen refresh token. A
single opaque session cookie was considered but loses the ability to scope a
short-lived bearer credential to API calls.

## ADR-0009: @node-rs/argon2 for password hashing

**Decision.** Hash passwords with `@node-rs/argon2` (Argon2id).
**Why.** Argon2id is the current recommendation for password storage. The Rust
binding ships prebuilt binaries (no compiler toolchain needed) and is fast,
unlike pure-JS alternatives. The plaintext and its hash never leave the server.

## ADR-0010: Dedicated SQLite database for integration tests

**Decision.** Auth tests run against a separate `test.db`, reset via
`prisma db push --force-reset` in Vitest global setup.
**Why.** Tests exercise real Prisma queries and unique constraints instead of
mocks, while staying isolated from the development database and reproducible.

## ADR-0011: Pure simulation core with a Phaser adapter

**Decision.** Gameplay rules live in a framework-free simulation
(`shared/src/core`) driven by `stepWorld(world, input, delta)`. Phaser is split
into input, renderer, HUD and scene modules and only reads world state.
**Why.** Rules stay unit-testable without a browser, rendering and input can
change independently, and the same simulation could later run headlessly for
server-side validation or tests. The alternative — putting logic in Phaser
scenes — would couple gameplay to the engine and make it hard to test.
**Trade-off.** A small amount of adapter code maps world state to sprites;
accepted because it keeps the rule modules small and focused.

## ADR-0012: Procedurally generated placeholder textures

**Decision.** Aircraft, enemy, projectile, spark and star textures are generated
at runtime with Phaser Graphics instead of shipping image assets.
**Why.** The prototype needs no external assets or licensing decisions, and all
placeholder art is isolated in `client/src/game/textures.ts`, so replacing it
with real sprites later touches one module and no gameplay code.

## ADR-0013: Data-driven player, enemy, weapon and level config

**Decision.** Player, enemy, weapon and level values are plain data objects in
`shared/src/config`; the simulation looks them up by id.
**Why.** Tuning balance and adding content (enemies, weapons, levels) is a data
change, not an engine change. The `WeaponConfig` already carries count and
spread, and `EnemyConfig` carries a `behavior` discriminator, so future phases
extend data plus small strategy functions rather than rewriting the loop.

## ADR-0014: Modular enemy behaviors behind a registry

**Decision.** Enemy configs are a discriminated union on `behavior`, and each
behavior is a small module registered in `core/behaviors/index.ts`. Behaviors
receive an `EnemyBehaviorContext` and announce shots through a `fire` callback.
**Why.** It satisfies "no giant enemy class": adding an enemy is a config entry,
and adding a behavior is one module plus a registry case that the compiler
checks exhaustively. Behaviors cannot reach into world internals, keeping them
easy to test and reason about.

## ADR-0015: One projectile/weapon spec for players and enemies

**Decision.** A single `ProjectileSpec` (damage, speed, radius, lifetime, count,
spread) plus one `createProjectiles(origin, spec, angle)` function serves both
player weapons and enemy weapons.
**Why.** Removes duplicate firing logic and makes new weapons data-only. Aiming
is just a base angle, so turrets/fighters aim at the player while bombers fire
straight down without special cases.

## ADR-0016: Pooled sprites and in-place entity compaction

**Decision.** The renderer reuses Phaser `Image` objects through `SpritePool`,
and the simulation compacts dead entities in place instead of reallocating
arrays each step.
**Why.** Keeps per-frame allocation and GC pressure low during heavy combat
without adding a complex object pool to the pure simulation. Verified in-browser
that display-list size stays stable over a long session.

## ADR-0017: Shared particle emitters for effects

**Decision.** Explosion, impact, hit and muzzle effects use four long-lived
particle emitters triggered with `explode`, owned by `client/src/game/render/Effects.ts`.
**Why.** Effects add no per-hit allocation and stay out of the simulation; the
simulation only emits events, and `GameScene` maps them to effects and camera
shake.

## ADR-0018: Validated level data model with a registry

**Decision.** Levels are pure data in `config/levels/level-XX.ts`, validated with
Zod plus semantic checks (`parseLevelConfig`) and registered in
`config/levels/index.ts`. The model covers id, number, name, difficulty,
environment, arena, scroll speed, start delay, completion mode, waves,
obstacle sections, an optional boss reference and reward.
**Why.** The requirement is that 50 levels be added as data without touching
gameplay. A validated registry gives that, fails fast on malformed content, and
keeps the level format explicit. The boss field is present but unused until the
boss phase.

## ADR-0019: Level director with sequential waves and parallel obstacle sections

**Decision.** `core/levelDirector.ts` runs waves one after another (each wave a
list of spawn groups) and obstacle sections on an independent parallel timeline.
Completion is one of `clear-waves` (all waves/obstacles spawned and no enemies
left) or `reach-distance` (distance goal, with optional looping waves for
survival levels).
**Why.** Sequential waves give predictable pacing; a separate obstacle channel
lets environmental hazards overlap combat without contorting the wave data.
Two completion modes cover both "clear the level" and "survive the level" without
special-casing content.

## ADR-0020: Difficulty changes behaviour, not health

**Decision.** Difficulty is a tier resolved to `DifficultyModifiers` (enemy
speed, fire cadence, projectile speed) and applied to an enemy's config at spawn.
Enemy counts, combinations, formations and timing are authored per level/data.
Health is never scaled by difficulty.
**Why.** Inflating health only lengthens fights; varying speed, projectile
density, combinations and formations changes how the game is played. Each enemy
carries its effective config, so behaviors need no per-frame registry lookup and
difficulty scaling stays in one function.

## ADR-0021: Sequential unlock model

**Decision.** `core/progression.ts` exposes `isLevelUnlocked(levelId,
completedLevelIds)` plus `getNextLevelId`, unlocking levels in campaign order.
**Why.** Progressively unlocking levels is a progression rule, not persistence;
keeping it pure lets the client use it now and the backend reuse it when progress
is stored in Phase 7.

## ADR-0022: Centralized, config-driven scoring

**Decision.** All score rules live in `core/scoring.ts` and are driven by
`config/scoring.ts`. Each score source has its own pure function
(`scoreForEnemyDestroyed`, `scoreForBossDamage`, `scoreForBossDefeat`,
`scoreForSpecial`); enemy kills use the enemy's configured value times a global
`killMultiplier`.
**Why.** The spec requires score to be centralized and configurable and to
prepare for boss/special sources without implementing them. One module plus one
config keeps balance data-only and gives later phases a place to plug in without
touching gameplay logic.

## ADR-0023: One score→coin conversion and an explicit LevelResult

**Decision.** Score is converted to coins only by `calculateCoins` in
`core/rewards.ts`, driven by `config/economy.ts`. On completion the simulation
produces a `LevelResult` (`score`, `completionBonus`, `totalScore`, `coins`)
stored on `world.result`.
**Why.** A single conversion point prevents coin rules leaking into gameplay.
Separating gameplay score from the completion bonus (rather than adding the bonus
into `world.score`) lets the UI show the breakdown the spec asks for, and gives
the backend a single value object to validate and persist in Phase 7.

## ADR-0024: Score/reward/UI separation; best score in memory for now

**Decision.** The simulation computes score and rewards; `GameScene` only tracks
best score per level in memory and passes the result to `Hud`, which renders it.
Boss and special score fields exist but are unwired.
**Why.** Keeps presentation free of economy rules and vice versa. Persistence of
coins/best scores is deliberately deferred to Phase 7, so in-memory tracking is
the smallest correct behaviour now and is easy to replace with API calls later.

## ADR-0025: Server-authoritative progression

**Decision.** The server owns coins, scores, completion bonuses and unlocks. The
completion endpoint accepts only a gameplay `score`, verifies the level exists
and is unlocked, bounds the score with `maxAchievableScore` (or an absolute
ceiling for looping levels), derives the completion bonus from the level and
coins from the economy config, and persists everything in a transaction. The
request schema is strict, so coin/reward fields from the client are rejected.
**Why.** The specification forbids trusting the client for rewards, prices,
completion or score. Recomputing server-side from the shared catalog makes that
possible without a separate content service, and a strict schema turns an
attempted cheat into a clear validation error.

## ADR-0026: Coins on first completion only; replays improve scores

**Decision.** Coins are awarded only the first time a level is completed.
Replaying a level can raise its `bestScore` (and therefore `totalScore` and
`highestScore`) but never grants more coins. `totalScore` is the sum of per-level
best scores; `highestScore` is the best single-run total.
**Why.** Per-run rewards would let a player farm coins by replaying the easiest
level. First-completion rewards make the economy monotonic and predictable while
still crediting improvement. The policy is explicit so it can be tuned later.

## ADR-0027: The server bundle inlines the shared package

**Decision.** `server/tsup.config.ts` sets `noExternal: ['@game/shared']` so the
built server bundles the shared TypeScript source.
**Why.** The shared workspace ships `.ts` source (consumed by Vite/vitest
directly). The built server is plain Node ESM, which cannot import `.ts`, so
without inlining it crashed at startup (`ERR_UNKNOWN_FILE_EXTENSION`). Bundling
keeps the single-source-of-truth package without adding a build step for shared.

## ADR-0028: Config-driven upgrade values and costs

**Decision.** Upgrades are declared in `config/upgrades.ts` with a per-level
`values` array, a `costs` array, a `maxLevel` and an `add`/`multiply` mode. The
same config is bundled into the client (display) and the server (pricing), and
`assertUpgradeConfigs` validates the shape at module load.
**Why.** The requirement is that costs and values are never hard-coded in the UI
or gameplay. Deriving values, next values and prices from one data table keeps
the client and server consistent and makes balance a data change. Validation at
load turns malformed upgrade data into a fast failure rather than impossible
purchases.

## ADR-0029: Server-authoritative upgrades with a conditional coin deduction

**Decision.** `POST /api/v1/upgrades/:upgradeId/purchase` accepts only the upgrade
id. The server reads the current level, computes the cost from the shared config,
checks the balance inside a transaction, and deducts with a conditional
`updateMany ... where coins >= cost` before incrementing the level.
**Why.** The client must not determine the price or its own balance. The
conditional deduction means a stale read or two concurrent requests cannot
overspend (one wins, the other sees an insufficient balance). Maximum level and
unknown ids are rejected with explicit errors.

## ADR-0030: A shared loadout resolver applies upgrades to gameplay

**Decision.** `core/loadout.ts::resolveLoadout(levels)` turns upgrade levels into
effective player/weapon stats; the simulation reads `world.loadout` for health,
speed, weapon damage/speed/count/fire rate and flat armor. Armor is applied via
`applyArmor` (flat reduction with a minimum of 1).
**Why.** Keeping upgrade → stat math in one pure shared module means gameplay,
previews and tests agree, and the simulation never imports upgrade shop code. A
flat armor model is simple to reason about and cannot fully negate a hit.

## ADR-0031: Data-driven aircraft roster

**Decision.** Aircraft are declared in `config/aircraft.ts` (stats, weapon id,
ability placeholder, price, unlock kind, availability) and validated at load.
The equipped aircraft's config is resolved into the same `ResolvedLoadout` as
upgrades, so gameplay never branches on a specific aircraft.
**Why.** The requirement forbids a separate gameplay implementation per aircraft.
One loadout resolver plus data means new aircraft are content, and the shop UI
and server share the same stats and prices.

## ADR-0032: Ownership rows plus an equipped id on the profile

**Decision.** The default aircraft is owned implicitly; purchased aircraft have a
`PlayerAircraft` row (unique per user/aircraft); the equipped aircraft id lives on
`PlayerProfile`.
**Why.** Ownership and equipment are different concerns and different lifecycles
(a player owns many but equips one). A unique row prevents duplicate purchases at
the database level, and a single equipped id makes "what am I flying" trivial to
read and to apply to the loadout.

## ADR-0033: Server-authoritative aircraft purchases with a shared eligibility check

**Decision.** `canPurchaseAircraft` is a pure shared function (availability,
purchasable, already owned, affordable) used by the UI for button state and by the
server for validation. The server creates the ownership row before a conditional
coin deduction inside one transaction.
**Why.** The client must not set prices or grant ownership. Sharing the check
keeps UI affordances and server rules consistent, while the row-first ordering
plus unique constraint and conditional deduction makes duplicate or racing
purchases safe and prevents charging twice.

## ADR-0034: Bosses are data over a phase/movement/attack framework

**Decision.** Boss definitions live in `config/bosses.ts` as an ordered list of
phases; each phase selects a movement behavior and a list of attack patterns by
id. The implementations are small registries in `core/bosses/movements.ts` and
`core/bosses/attacks.ts`, dispatched by `runBossMovement`/`runBossAttack`.
**Why.** The requirement forbids one giant boss class. Splitting state, health,
movement, attacks, phases and reward means a new boss (or a new pattern) is an
addition, and the phase data drives behavior without engine changes.

## ADR-0035: Boss phase is derived from health fraction

**Decision.** A boss's phase is resolved each step from its remaining health
fraction against per-phase thresholds; crossing a threshold emits a `bossPhase`
event and resets the attack cycle. `untilHealthFraction` is the value below which
a phase ends, and the last phase ends at 0.
**Why.** Deriving the phase from health keeps the boss stateless with respect to
transitions (no duplicated "already transitioned" bookkeeping), makes the
thresholds pure data, and naturally supports any number of phases.

## ADR-0036: Levels reference a boss; completion requires defeating it

**Decision.** `LevelConfig.boss` holds a boss id and an optional spawn delay. The
level director spawns the boss after all waves and obstacle sections are emitted;
`isLevelCleared` additionally requires `director.bossDefeated` for boss levels.
**Why.** The level engine stays boss-agnostic (it only knows a reference id), so
which levels have bosses is content. Tying completion to the defeat flag makes a
boss a real gate without hard-coding a specific boss anywhere in the engine.

## ADR-0037: Small, validated settings persisted as JSON

**Decision.** Settings are declared in `config/settings.ts` with a Zod schema and
defaults, stored as a JSON string on `PlayerProfile.settingsJson`, and exposed
through `GET`/`PUT /api/v1/settings`. Reads merge stored values over defaults;
writes validate the full object.
**Why.** The settings set is small and flat, so a single JSON column avoids a
column per option while still being validated. Merging on read keeps older or
partial records working, and server-side validation prevents malformed settings
from reaching the game.

## ADR-0038: The shell owns settings; the game consumes them via the bridge

**Decision.** The React shell persists settings and injects them through the
progress bridge. `PlayerInput.read(settings)` applies movement/shooting modes and
`AudioManager.applySettings` applies audio; both read the current settings each
frame.
**Why.** This keeps the game free of API code while allowing live changes (e.g.
toggling music, switching control mode) without remounting the game. Reading per
frame is trivial and avoids a subscription layer.

## ADR-0039: Pause stops the simulation; menus are shell-side or overlay

**Decision.** ESC toggles a pause flag that skips `stepWorld`; the pause menu is
rendered in the HUD and navigated by keyboard. "Settings" opens the React panel
via a bridge callback while staying paused, and "Exit to Menu" returns the shell
to the menu (unmounting the game).
**Why.** Stopping the simulation at the single `stepWorld` call is the simplest
correct pause. Reusing the React settings panel avoids duplicating the settings
UI in canvas, and a menu screen gives navigation without a major new system.

## ADR-0040: Generate the campaign from a curve, not 50 files

**Decision.** Levels 1-5 stay hand-authored; levels 6-50 are generated by
`config/levels/campaign.ts` from a difficulty curve (tier, wave count, enemy
density, formations, expanding enemy roster) with explicit milestone overrides
for bosses and survival levels, using a seeded PRNG.
**Why.** The requirement is 50 levels with no duplicated gameplay logic and a
progression that evolves through combinations rather than health. A generator
centralizes the curve so balancing is one file, keeps content deterministic for
tests, and leaves hand-authored levels for the opening experience and milestones.

## ADR-0041: Expand content only through existing frameworks

**Decision.** The `diver` enemy is one behavior module plus config; the three
weapons and three aircraft are data; Hydra and Leviathan reuse the boss
movement/attack registries with distinct phases. No new systems were added.
**Why.** The architecture already supports data-driven enemies, weapons,
aircraft and bosses. Adding content through those extension points keeps the
engine stable and avoids one-off code paths per asset.

## ADR-0042: Synthesized, replaceable audio and modest visual polish

**Decision.** Audio is synthesized with the Web Audio API (effects, music, UI
clicks) and follows persisted settings; visual polish adds a two-layer parallax
starfield and camera flash/shake feedback, staying within the clean 2D style.
**Why.** It avoids shipping licensed assets while delivering music/effects, and
keeps every sound replaceable behind `AudioManager`/`uiSound` without touching
gameplay. Polish changes are presentation-only.

## ADR-0043: Performance review without architecture changes

**Decision.** Keep sprite pooling, in-place entity compaction and shared particle
emitters; verify display-list growth is bounded in steady state rather than
adding a spatial hash.
**Why.** Collision counts at 50-level densities remain small; a broad-phase would
be premature. The regression harness measures steady-state object counts, which
is the meaningful signal for leaks.

## ADR-0044: Two-layer difficulty (level tier + player setting)

**Decision.** Keep the level's design tier and add a player-selected
Easy/Normal/Hard setting. `resolveDifficulty` combines both into a single
`ResolvedDifficulty` stored on the world; enemies, spawning, bosses and the
player loadout read from it.
**Why.** The game felt too hard, but difficulty must not be re-authored per
level. One resolved object keeps difficulty centralized and data-driven, lets a
level's intended challenge and the player's preference coexist, and makes the
values testable. Enemy health is only one of several levers (damage, speed, fire
cadence, spawn rate, player damage).

## ADR-0045: Procedural visuals and SVG UI art

**Decision.** Generate all sprites procedurally in `textures.ts` (galaxy nebula
layers, detailed aircraft/enemies/mines/turret/diver, bullets, glow) and use
inline SVG for hangar aircraft art and upgrade icons. Keep counts small and reuse
shared emitters.
**Why.** This delivers a large visual upgrade with no licensed assets, keeps the
style consistent, and stays performance-friendly. Art is isolated behind texture
keys and SVG components, so real assets can replace it without touching gameplay.

## ADR-0046: Stage select plus a hybrid, server-authoritative reward

**Decision.** Add a Levels screen driven by the server's completed set and the
shared `isLevelUnlocked` rule, and replace the flat coin conversion with a
hybrid reward (`calculateLevelReward`): score conversion + progressive level
bonus + difficulty multiplier, granted only on a level's first completion.
**Why.** Players needed to see and replay stages, and the reward curve needed to
scale with progression. Keeping unlock and reward decisions on the server (the
client submits only a score) preserves the existing trust model, and the
first-completion-only rule makes replaying safe without a separate anti-farm
mechanism.

## ADR-0047: Distinct aircraft models and capability-ordered pricing

**Decision.** Order the roster by price and give each aircraft a role and a
distinct SVG silhouette, and rebalance stats so more expensive aircraft are
generally stronger or more specialized (Scout, Heavy, Tank, Elite, Premium).
**Why.** Colour-only differences made progression feel flat. Roles plus distinct
models communicate *why* an aircraft costs more, and capability-ordered pricing
keeps the price-to-power relationship understandable. Models are inline SVG, so
they stay lightweight and replaceable.

## ADR-0048: Aircraft visuals are driven by the resolved loadout

**Decision.** Add `aircraftId` to `ResolvedLoadout` and select the player texture
from it in the renderer (`aircraftTextureKey`), with one procedural model per
aircraft. The hangar also shows the weapon and projectile count.
**Why.** Aircraft stats and projectile counts already flowed correctly, but the
player sprite was a single hardcoded texture, so equipping an aircraft produced no
visible change and looked like the stats were ignored. Deriving the model from the
same resolved loadout the simulation uses guarantees the shop display, gameplay
stats and the rendered aircraft stay consistent, and avoids a second source of
truth for the equipped aircraft.
