# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
bun run dev           # Start Nuxt dev server (localhost:3000)
bun run build         # Production build
bun run typecheck     # TypeScript check via vue-tsc

# Tests
bun run test          # Run all unit tests (Vitest, tests/unit/**/*.test.ts)
bun run test:watch    # Watch mode
bun run test:e2e      # Playwright e2e tests

# Database
docker compose up -d           # Start local PostgreSQL (port 5432)
bun run db:generate            # Generate Drizzle migrations from schema changes
bun run db:migrate             # Apply migrations
bun run db:seed                # Seed skills/categories from YAML + progress.json
bun run db:studio              # Drizzle Studio UI
```

**Required env vars** (`.env`):
```
DATABASE_URL=postgresql://skilltreq:skilltreq@localhost:5432/skilltreq
```

## Architecture

**Nuxt 3 fullstack app** — same repo hosts both the Vue 3 frontend and the Nitro API backend. Deployed to Vercel with Neon (serverless PostgreSQL) in production.

### Data flow

1. **Skill definitions** live in YAML files (`data/calisthenics/`, `data/acrobatics/`). These are the source of truth and are imported into the DB via `db/seed.ts`. Skills are never modified through the UI.
2. **API layer** (`server/api/`) reads from PostgreSQL via Drizzle ORM. Currently: `GET /api/skills` and `GET /api/categories`.
3. **Pinia stores** fetch data on mount and hold it in memory:
   - `useSkillStore` — skills, categories, filters (`sport`, `category`, `status`), `viewMode`, `selectedSkillId`
   - `useProgressStore` — user progress, persisted to `localStorage` under `skilltreq:progress` (Phase 3 will sync to DB)
4. **Cross-store dependency**: `useSkillStore` has a `progressGetter` callback that is injected by the page after both stores are initialized — this avoids circular imports between stores.

### Key components (`components/skills/`)

- `SkillGraph.vue` — vue-flow canvas; delegates layout computation to `useGraphLayout` (dagre), supports TB/LR direction. Pauses animations via `IntersectionObserver` when off-screen.
- `SkillNode.vue` — custom vue-flow node
- `SkillEdge.vue` — custom edge; uses `resolveEdgeVariant()` from `utils/resolveEdgeVariant.ts` to pick visual style based on parent/child progress status
- `SkillList.vue` — accordion list view grouped by category
- `SkillDetail.vue` — side panel (desktop) / bottom sheet (mobile, fixed, `max-height: 60vh`)
- `FilterPanel.vue` — sport / category / status filters + view mode switcher

### Composables

- `useGraphLayout` — pure function, calls dagre, returns `{ nodes, edges }` for vue-flow
- `useFocusState` — module-level singleton (shared across components without Pinia); holds `focusedSkillId` and `focusBranchIds` (BFS ancestors + direct children of focused node)
- `useTheme`, `useToast`, `useProgressStore` — standard reactive composables/stores

### DB (`db/`)

- `schema.ts` — Drizzle schema: `users`, `categories`, `skills`, `user_progress`. Enums: `sport` (`calisthenics | acrobatics`), `progress_status` (`locked | in_progress | unlocked | mastered`). Skill `requires` is a `jsonb` array of skill ID slugs.
- `client.ts` — singleton postgres client (reused across hot reloads in dev via `globalThis`)
- `server/utils/db.ts` — re-exports `db` from `db/client.ts` for use in Nitro event handlers

### Routing & layout

- `/` — landing page
- `/skills` — main skill tree page (graph + list + filter + detail panel)
- `/skills/[id]` — individual skill detail page
- `/login` — auth page (Phase 2)
- `/design` — design system sandbox

The skills page (`pages/skills/index.vue`) wires all stores together: initializes `progressStore`, injects progress getter into `skillStore`, fetches data, and manages focus state.

## Current phase

**Phase 1 complete** — core UI with localStorage-only progress. **Phase 2** (GitHub OAuth auth) and **Phase 3** (backend progress sync) are next. Slovak UI strings are intentional — this is a personal-use app.
