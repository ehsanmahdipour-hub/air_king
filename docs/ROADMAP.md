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

## Phase 4 preview (next, pending approval)

Combat & enemy system: additional enemy types (bomber, missile, mine, turret),
enemy projectiles, formations, a modular behavior registry, and richer
explosion/effect feedback.


