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
