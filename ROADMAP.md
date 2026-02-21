# Skilltreq – Roadmap & Iteračný plán

## Stack Decision

**Nuxt 3** (fullstack) – nie len Vue 3 + Vite, pretože:
- Nitro server = BE API v tom istom repo (auth, sync, CRUD)
- Nuxt Auth modul zjednodušuje autentifikáciu
- SSR ak bude treba sharing/SEO
- Rovnaké Vue 3 DX, ale s fullstack možnosťami

### Tech stack
| Vrstva | Technológia |
|---|---|
| Framework | Nuxt 3 |
| UI | Vue 3 + Composition API |
| Styling | Tailwind CSS v4 |
| State | Pinia |
| DB ORM | Drizzle ORM |
| DB (dev) | PostgreSQL local (Docker) |
| DB (prod) | Neon (serverless PostgreSQL) |
| Auth | nuxt-auth (sidebase) – GitHub OAuth |
| Hosting | Vercel |
| Graph | vue-flow (lepší touch support ako Cytoscape) |
| Mobile layout | List/tree view pre mobile, graph pre desktop |
| Typechecking | TypeScript |
| Testing | Vitest + Playwright |

---

## DB Schéma (target)

```
User
├── id
├── email
├── name
└── created_at

Skill (seed z YAML)
├── id (slug, napr. "bar-mu")
├── name
├── category_id
├── sport ("calisthenics" | "acrobatics")
├── difficulty (1–10)
├── description
├── steps (JSON)
├── tutorials (JSON)
├── requires (JSON – pole skill IDs)
└── type ("skill" | "transition")

Category
├── id
├── name
└── color

UserProgress
├── user_id
├── skill_id
├── status ("locked" | "in_progress" | "unlocked" | "mastered")
├── current_step
├── note
├── started_at
├── mastered_at
└── updated_at

Workout (tréningová jednotka)
├── id
├── user_id
├── plan_id (optional – ak vykonávaš plánovaný tréning)
├── date
├── duration_minutes
├── notes (celkové poznámky k tréningu)
├── overall_rpe (1–10)
└── created_at

WorkoutExercise (jeden skill v rámci tréningu)
├── id
├── workout_id
├── skill_id
├── sets (JSON – pole { reps?, duration_seconds?, rpe?, notes? })
└── notes

PersonalRecord
├── user_id
├── skill_id
├── type ("hold_time" | "reps" | "combo")
├── value
└── recorded_at

TrainingPlan
├── id
├── user_id
├── name (napr. "Front Lever Focus – March 2026")
├── description
├── start_date
├── end_date (optional)
├── frequency_per_week
├── is_active
└── created_at

PlanDay (tréningový deň v pláne, napr. "Deň A – Pull")
├── id
├── plan_id
├── name ("Deň A", "Pondelok", ...)
└── order

PlanDaySkill (skill naplánovaný na daný deň)
├── id
├── plan_day_id
├── skill_id
├── target_sets
├── target_reps (optional)
├── target_duration_seconds (optional)
├── notes ("sústredenie na lopatky")
└── order
```

---

## Iterácie

### Phase 0 – Setup & Architecture
**Cieľ**: Funkčný Nuxt 3 projekt, DB, základné routovanie.

#### 0.1 Projekt
```bash
npx nuxi init skilltreq-app
cd skilltreq-app
npx nuxi module add tailwindcss
npx nuxi module add @sidebase/nuxt-auth
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

#### 0.2 Lokálna DB (Docker)
```bash
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: skilltreq
      POSTGRES_USER: skilltreq
      POSTGRES_PASSWORD: skilltreq
    ports:
      - "5432:5432"
```
`.env`:
```
DATABASE_URL=postgresql://skilltreq:skilltreq@localhost:5432/skilltreq
AUTH_SECRET=<random>
AUTH_ORIGIN=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

#### 0.3 Drizzle schéma + migrácia
- Definovať `db/schema.ts` (User, Skill, Category, UserProgress)
- `drizzle-kit generate` → `drizzle-kit migrate`

#### 0.4 Seed script
- Importuj YAML súbory → `Skill`, `Category` záznamy
- Importuj `progress.json` → `UserProgress` pre seeded usera

#### 0.5 Základná štruktúra
- Stránky: `/`, `/skills`, `/skills/[id]`, `/login`
- Nuxt DevTools zapnuté

#### 0.6 Vercel + Neon prepojenie
- Vytvoriť Neon projekt → skopírovať connection string
- Vercel projekt → pripojiť GitHub repo → nastaviť env vars
- Overiť že `drizzle-kit migrate` beží v CI (Vercel build hook)

**Výstup**: Prázdna app, DB schéma v Neon, auto-deploy pri git push.

---

### Phase 1 – Core UI (bez auth, bez BE sync) ✅
**Cieľ**: Portovanie existujúcej funkcionality do Nuxt komponentov.

- [x] Pinia store: `useSkillStore` (skills, categories, filtre, viewMode)
- [x] Pinia store: `useProgressStore` (localStorage, mutácie)
- [x] Server API: `GET /api/skills`, `GET /api/categories`
- [x] Graph view: vue-flow + dagre (TB / LR layout, custom `SkillNode`)
- [x] List view: accordion podľa kategórie (`SkillList`)
- [x] Filter panel: sport / kategória / status + view mode dropdown (`FilterPanel`)
- [x] Skill detail sidebar / bottom sheet (`SkillDetail` – status select, progression stepper, tutorials)
- [x] Progress tracking: status change, current_step advance, localStorage persist
- [x] Responsive layout: side panel na desktop, bottom sheet na mobile (<768px)
- [x] View switcher: Graph TB / Graph LR / List
- [x] `@vue-flow` CSS imports v `main.css`

**Výstup**: Feature-parity s aktuálnym HTML generátorom, ale v Nuxt.

---

### Phase 2 – Auth
**Cieľ**: Multi-user podpora, chránené routy.

**Stratégia**: GitHub OAuth + Google OAuth cez `@sidebase/nuxt-auth`

- [ ] GitHub OAuth App registrácia (Settings → Developer settings → OAuth Apps)
- [ ] Google OAuth App registrácia (Google Cloud Console → Credentials → OAuth 2.0)
- [ ] `nuxt.config.ts` – auth provider konfigurácia (GitHub + Google)
- [ ] `server/api/auth/[...].ts` – NextAuth handler (sidebase)
- [ ] Login stránka `/login` – "Prihlásiť cez GitHub" + "Prihlásiť cez Google" buttony
- [ ] Route middleware `auth.ts` – redirect na `/login` ak neprihlásený
- [ ] User session v Pinia (`useAuthStore`)
- [ ] Pri prvom login: automaticky vytvoriť `User` záznam v DB
- [ ] **Po prihlásení redirect priamo na `/skills`** – žiadny rozcestník, app má jediný hlavný pohľad; navigácia na `/library` a profil je dostupná z headeru
- [ ] **Logout mechanizmus** – button v navigácii / profile, `signOut()` + redirect na `/login`
- [ ] **Support stránka** `/support` – kontakt, FAQ, odkaz na GitHub Issues
- [ ] Profil stránka: meno, avatar, provider (GitHub/Google), export dát

> Rozcestník sa pridá až keď budú existovať stránky `/skills` aj `/library` — dovtedy redirect priamo na `/skills`.

**Výstup**: Každý user má vlastný account, izolovaný progress.

---

### Phase 2.5 – Libraries (Skill Subscriptions)
**Cieľ**: User si vyberie, ktoré skill knižnice sleduje — app sa prispôsobí.

**Kontext**: Pole `sport` na `Skill` modeli sa premenuje na `library` — terminológia zodpovedá názvu aplikácie Skilltreq (skill tree + requirements). Knižnica = sada skillov jednej disciplíny (napr. `calisthenics-beginner`). Filter v UI sa premenuje zo "Sport" na "Library".

#### DB zmeny
- [ ] Premenovať stĺpec `sport` → `library` v `skills` tabuľke (Drizzle migrácia)
- [ ] Premenovať `sportEnum` → `libraryEnum` v `db/schema.ts`
- [ ] Aktualizovať seed script + YAML polia (`sport:` → `library:`)
- [ ] Nová tabuľka `UserLibrary` (subscripcie usera):
  ```
  UserLibrary
  ├── user_id
  ├── library       (enum – rovnaké hodnoty ako skill library)
  └── created_at
  ```

#### Stránka `/library`
- [ ] Zoznam dostupných knižníc s popisom a počtom skillov
- [ ] Toggle subscribe/unsubscribe per knižnicu
- [ ] API: `GET /api/library`, `POST /api/library/:name`, `DELETE /api/library/:name`

#### Integrácia do skill tree
- [ ] Filter "Library" (bývalý "Sport") zobrazuje len subscribed knižnice ako aktívne voľby
- [ ] Ak user nemá žiadnu subscription → výzva pridať knižnicu cez `/library`
- [ ] Po prihlásení + prvé otvorenie `/skills` bez subscripcií → redirect na `/library`

**Výstup**: App je personalizovaná — user vidí len knižnice, ktoré ho zaujímajú.

---

### Phase 3 – Backend Sync
**Cieľ**: Progress sa ukladá na server, nie len localStorage.

- [ ] Nuxt server API endpointy:
  - `GET /api/progress` – načítaj progress usera
  - `PUT /api/progress/:skillId` – update status / step
  - `POST /api/progress/import` – bulk import (z JSON)
  - `GET /api/progress/export` – stiahni JSON
- [ ] Pinia store: sync s API (optimistic updates)
- [ ] Timestamp tracking: `started_at`, `mastered_at` pri zmene statusu
- [ ] Zachovanie export/import funkcie (kompatibilita so starým progress.json)

**Výstup**: Progress prežije vyčistenie cache, funguje na viacerých zariadeniach.

---

### Phase 4 – Enhanced Features (batch 1)
**Cieľ**: Nové funkcie, ktoré najviac chýbali.

- [ ] **Search**: fulltext search po názve + tagoch
- [ ] **"Čo môžem odomknúť?"** panel – skills kde všetky prerekvizíty sú mastered
- [ ] **Path to skill**: klikneš locked skill, zvýrazní sa celá cesta prerekvizít
- [ ] **Progress timeline**: chronologický prehľad, kedy čo si naučil (využíva `mastered_at`)
- [ ] **Skill validation**: pri loade upozorni na neexistujúce `requires` IDs
- [ ] **Notes v sync**: poznámky sú súčasťou `UserProgress`, nie len localStorage

**Výstup**: Lepší UX, motivačné prvky, dôveryhodnejšie dáta.

---

### Phase 5 – Workout Logging
**Cieľ**: Zaznamenávanie skutočných tréningov, personal records, štatistiky.

#### Stránky
- `/training` – tréningový hub (rýchly log, posledné tréningy, aktuálny plán)
- `/training/workouts` – história tréningov
- `/training/workouts/new` – zaznamenať nový tréning
- `/training/workouts/[id]` – detail tréningu

#### Features
- [ ] **Log workout**: výber dňa, celkové poznámky, overall RPE
- [ ] **Skill sets logger**: pre každý skill v tréningu → pridaj set (reps alebo čas, RPE per set)
- [ ] **Quick log**: z detail panelu skilu → "Pridať do dnešného tréningu" button
- [ ] **Personal records**: automatická detekcia PR pri uložení setu (nový max hold/reps)
- [ ] **Workout history**: zoznam tréningov s filtrom podľa skilu / dátumu
- [ ] **Per-skill história**: v detail paneli skilu → záložka "História" (posledné sety, PR, graf progresie)
- [ ] **Štatistiky**: sessions per týždeň, streak, objem per kategória
- [ ] **Skill detail: inline video** – YouTube embed
- [ ] **Difficulty heatmap mode** – alternatívne sfarbenie grafu

#### API endpointy
```
GET    /api/workouts              – história tréningov usera
POST   /api/workouts              – nový tréning
GET    /api/workouts/:id          – detail tréningu
PUT    /api/workouts/:id          – edit tréningu
DELETE /api/workouts/:id          – zmazať tréning
POST   /api/workouts/:id/exercises – pridať skill do tréningu
GET    /api/skills/:id/workouts   – história pre konkrétny skill
GET    /api/stats                 – agregované štatistiky
```

**Výstup**: App je tréningový denník – každý set zaznamenaný, PR automaticky sledovaný.

---

### Phase 6 – Training Plans
**Cieľ**: Štruktúrované tréningové plány – čo trénovať, kedy a koľko.

#### Stránky
- `/training/plans` – zoznam plánov
- `/training/plans/new` – vytvoriť plán
- `/training/plans/[id]` – detail + editácia plánu
- `/training/plans/[id]/start` – spustenie tréningu podľa plánu

#### Features
- [ ] **Plan builder**: vytvor plán s názvom, popisom, frekvenciou
- [ ] **Deň A/B/C štruktúra**: každý plán má dni (napr. "Pull day", "Push day")
- [ ] **Skill picker per deň**: vyber skills zo skill tree → nastav target sets/reps/čas + poznámky
- [ ] **Aktívny plán**: jeden plán je aktívny, zobrazuje sa v `/training` hube
- [ ] **"Začni tréning podľa plánu"**: pre aktívny plán → auto-vyplní dnešný workout log so skills z daného dňa
- [ ] **Adherence tracking**: koľko percent plánovaných tréningov si odcvičil
- [ ] **Plan templates**: predpripravené šablóny (napr. "Front Lever program – 3×/týždeň")
- [ ] **Skill-to-plan väzba**: pri kliknutí "Čo môžem odomknúť" → "Pridať do plánu" button

#### API endpointy
```
GET    /api/plans                 – zoznam plánov usera
POST   /api/plans                 – nový plán
GET    /api/plans/:id             – detail plánu
PUT    /api/plans/:id             – edit plánu
DELETE /api/plans/:id             – zmazať plán
POST   /api/plans/:id/activate    – nastaviť ako aktívny
GET    /api/plans/:id/adherence   – štatistika dodržiavania
```

**Výstup**: Skill tree nie je len evidencia – je to základ pre tréningový plán.

---

### Phase 7 – Sharing & Polish
**Cieľ**: Sharing, export, finálny UX polish.

- [ ] **Shareable profile**: verejná stránka `/u/:username` s read-only skill tree
- [ ] **Export do SVG/PNG**: screenshot grafu
- [ ] **PWA**: offline support, add to homescreen
- [ ] **Dark/light mode**: Tailwind class-based
- [ ] **E2E testy**: Playwright pre kritické flows (login, progress update, workout log)
- [ ] **Unit testy**: Vitest pre utility funkcie (graph traversal, PR detekcia, validation)

#### Nice to have
- [ ] **Theme flickering fix** – pri načítaní stránky sa na chvíľu zobrazí light theme, až potom dark (z localStorage). Riešenie: inline `<script>` v `<head>` ktorý nastaví `class` na `<html>` pred renderom, alebo použiť cookie namiesto localStorage na uloženie preferencie (SSR-friendly).

---

## Migrácia dát

Existujúce YAML súbory ostávajú **source of truth pre skill definície** – len sa importujú do DB cez seed script. `progress.json` sa importuje ako iniciálny stav pre prvého usera.

```
YAML files → seed script → DB (Skills, Categories)
progress.json → seed script → DB (UserProgress pre user #1)
```

Skills sa nemenia cez UI (len admin), progress áno.

---

## Čo NErobiť pri rewrite

- Neopravovať UI strings (Slovak hardcoded je OK pre personal use)
- Neportovať generátor `generate-html.ts` – obsolete s Nuxt
- Nezachovávať self-contained HTML output – je to anti-pattern pre Nuxt
- Neimplementovať multi-language do fáz 0–3

---

## Odporúčané poradie spustenia

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
```

Každá fáza je deployovateľná a funkčná – nečakáš na "veľký bang".

---

## Externé služby – čo treba nastaviť

| Služba | Účel | Kedy |
|---|---|---|
| [neon.tech](https://neon.tech) | Prod PostgreSQL | Phase 0 |
| [vercel.com](https://vercel.com) | Hosting + CI/CD | Phase 0 |
| GitHub OAuth App | Auth | Phase 2 |
| Google Cloud Console | Google OAuth | Phase 2 |

### Neon setup (5 minút)
1. neon.tech → New project → skopírovať `DATABASE_URL`
2. Pridať do Vercel env vars
3. `drizzle-kit migrate` pri každom deploy (Vercel build command)

### Vercel setup
```
Build command: npm run build
Output: .output
Environment variables: DATABASE_URL, AUTH_SECRET, AUTH_ORIGIN, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

### GitHub OAuth App
- Settings → Developer settings → OAuth Apps → New
- Homepage URL: `https://your-app.vercel.app`
- Callback URL: `https://your-app.vercel.app/api/auth/callback/github`
