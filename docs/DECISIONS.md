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
