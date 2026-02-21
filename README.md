# Skilltreq

Personal calisthenics skill progression tracker. Visualizes skill dependencies as a directed graph and tracks mastery across structured training paths.

## What it does

- Skills are organized into a **dependency tree** — a skill is locked until its prerequisites are completed
- Track progress per skill: `locked → in_progress → completed → mastered`
- Filter by sport level, category, type, and status
- Switch between **graph view** (interactive node canvas) and **list view** (accordion by category)
- Progress is persisted to `localStorage` (Phase 1); backend sync is planned (Phase 3)

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (Vue 3 + Nitro SSR) |
| State | Pinia |
| ORM | Drizzle ORM |
| DB (dev) | PostgreSQL 16 via Docker |
| DB (prod) | Neon (serverless PostgreSQL) |
| Graph | vue-flow + Dagre layout |
| Testing | Vitest (unit) + Playwright (e2e) |
| Runtime | Bun |
| Deploy | Vercel |

## Local setup

**Prerequisites:** Bun, Docker

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Create .env
cp .env.example .env
# Edit DATABASE_URL if needed (default works with docker-compose)

# 3. Install dependencies
bun install

# 4. Apply migrations
bun run db:migrate

# 5. Seed skills from YAML
bun run db:seed

# 6. Start dev server
bun run dev
# → http://localhost:3000
```

**Required env vars** (`.env`):

```env
DATABASE_URL=postgresql://skilltreq:skilltreq@localhost:5432/skilltreq
```

Auth vars (`AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) are needed only for Phase 2 GitHub OAuth.

## Commands

```bash
# Dev
bun run dev           # Dev server (localhost:3000, hot reload)
bun run build         # Production build
bun run preview       # Preview production build locally
bun run typecheck     # TypeScript check via vue-tsc

# Tests
bun run test          # Unit tests (Vitest)
bun run test:watch    # Watch mode
bun run test:e2e      # Playwright e2e

# Database
docker compose up -d  # Start local PostgreSQL + pgAdmin
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply pending migrations
bun run db:seed       # Seed skills + categories from YAML + progress.json
bun run db:studio     # Drizzle Studio (DB browser UI)
```

## Database admin

Two options for inspecting the DB locally:

**pgAdmin** — full GUI, runs via Docker Compose:

```
http://localhost:5050
```

| Field | Value |
|---|---|
| Email | `admin@skilltreq.local` |
| Password | `admin` |

First time: Add New Server → Connection tab:

| Field | Value |
|---|---|
| Host | `db` (Docker service name, not `localhost`) |
| Port | `5432` |
| Database | `skilltreq` |
| Username | `skilltreq` |
| Password | `skilltreq` |

**Drizzle Studio** — lightweight, schema-aware:

```bash
bun run db:studio
# → http://localhost:3000 (or next available port)
```

## Skill definitions

Skills live in YAML files under `data/` and are seeded into the DB. **Never modified through the UI.**

```
data/
  categories.yaml                  # 5 categories: Pull, Push, Legs, Core, Rings
  calisthenics-beginner/           # Skills per category (core, legs, pull, push)
  calisthenics-intermediate/
  calisthenics-expert/
  acrobatics/
  progress.json                    # Demo user progress (loaded by db:seed)
```

Example skill entry:

```yaml
- id: push-up
  name: Push-Up
  abbr: PU
  category: push
  difficulty: 2
  type: skill          # skill | transition
  requires: []         # list of prerequisite skill IDs
  mastery_criteria: "20 strict reps"
  progressions:
    - name: Incline Push-Up
      mastery_criteria: "15 reps"
  tutorials:
    main: ""
    alt: ""
```

To add a new sport or category:
1. Create YAML files in a new `data/<sport>/` directory
2. Add entries to `categories.yaml` if needed
3. Extend `sportEnum` in `db/schema.ts`
4. Run `bun run db:generate && bun run db:migrate && bun run db:seed`

## Architecture

```
pages/skills/index.vue     # Main page — wires stores, manages layout
stores/
  useSkillStore.ts          # Skills, categories, filters, graph state
  useProgressStore.ts       # Progress (localStorage, Phase 1)
components/skills/
  SkillGraph.vue            # vue-flow canvas + dagre layout
  SkillList.vue             # Accordion list view
  SkillDetail.vue           # Side panel / mobile bottom sheet
  FilterPanel.vue           # Sport / Category / Type / Status filters
db/
  schema.ts                 # Drizzle schema + enum types (source of truth)
  seed.ts                   # YAML → DB import
server/api/
  skills/index.get.ts       # GET /api/skills
  categories/index.get.ts   # GET /api/categories
```

**Cross-store dependency**: `useSkillStore` accepts a `progressGetter` callback injected by the page after both stores initialize. This avoids circular imports while allowing filtering by derived status (`unlocked` = locked-stored but all prereqs met).

**Type source of truth**: `Sport` and `SkillType` are derived directly from `db/schema.ts` pgEnum definitions — changing the enum values automatically updates all downstream types.

## Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/skills` | Main skill tree (graph + list + filters) |
| `/skills/[id]` | Individual skill detail |
| `/login` | Auth (Phase 2) |
| `/design` | Design system sandbox |

## Roadmap

- **Phase 1** (complete) — Core UI, graph/list views, localStorage progress
- **Phase 2** — GitHub OAuth authentication
- **Phase 3** — Backend progress sync (`POST /api/user-progress`)
