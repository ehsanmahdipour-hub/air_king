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

## Phase 2 preview (next, pending approval)

Authentication: `User` model, Argon2id password hashing, short-lived JWT access
token plus rotating `httpOnly` refresh cookie, `/api/v1/auth/*` routes,
registration/login/logout/me, protected routes, and backend auth tests.
