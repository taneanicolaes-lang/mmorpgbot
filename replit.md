# Пушок — MMORPG

Русскоязычный фэнтези-проект с Telegram-ботом, игровым API и тёмной веб-панелью персонажа.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/pushok-mmorpg run dev` — run the player dashboard
- `python artifacts/pushok-mmorpg/bot/main.py` — run the Telegram bot
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `python artifacts/pushok-mmorpg/export_archive.py` — create a source archive in `generated-artifacts/`
- Required env: `DATABASE_URL` and `BOT_TOKEN`; keep both out of source control and archives

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Telegram bot: Python 3.13, aiogram 3, shared API

## Where things live

- `artifacts/pushok-mmorpg/` — dashboard, Telegram bot, and downloadable-source archive script
- `artifacts/api-server/src/routes/game.ts` — game actions and profile API
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/game-profiles.ts` — persistent player state
- `artifacts/pushok-mmorpg/src/index.css` — dark-fantasy theme and responsive styling

## Architecture decisions

- The web panel and Telegram bot use the same game API and PostgreSQL profiles.
- Browser-only profiles use unguessable local IDs; Telegram profiles use Telegram IDs and require the bot token for API access.
- Web and Telegram profiles are not linked yet; account linking requires Telegram Mini App authentication.
- The archive script excludes secrets, local dependencies, caches, and generated bundles.

## Product

Players can view their hero, stats, equipment, pets, marriage archive, guild, world boss, activity, leaderboard, and shop; the initial build includes persistent registration, daily rewards, battles, equipment, purchases, pet feeding/evolution, raid attacks, marriage/divorce, and basic guild membership.

## User preferences

- Keep player-facing text in Russian.
- Preserve the dark-fantasy visual direction and include a downloadable source archive.

## Gotchas

- Never store `BOT_TOKEN` in a file, log, or downloadable archive.
- The Telegram bot uses the Replit API proxy by default; set `API_BASE_URL` if it runs elsewhere.
- API contract changes must be followed by code generation before using updated client types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
