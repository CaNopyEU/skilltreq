# Skilltreq – Iteračný plán

## Iterácia 1 — Infraštruktúra: Modal + Toast

**Prečo prvé:** Modaly aj toasty sú závislosti pre všetky ďalšie iterácie.

- `components/BaseModal.vue` — generický modal s teleport na `<body>`, slot pre header/body/footer, backdrop, ESC close, focus trap
- `composables/useModal.ts` — programatické otváranie/zatváranie modalu
- `components/ToastContainer.vue` + `composables/useToast.ts` — queue, auto-dismiss (3s default), typy: `success | error | info | warning`
- Zaregistrovať `ToastContainer` v `app.vue`

**Status:** ✅ Hotovo

**Výstupy:**
- `components/BaseModal.vue` — generický modal, teleport, ESC, backdrop, sloty, primary/danger variant
- `composables/useToast.ts` — singleton queue, auto-dismiss, 4 typy
- `components/ToastContainer.vue` — fixed bottom-right, slide+fade animácia
- `app.vue` — pridaný `<ToastContainer />`
- `tests/unit/useToast.test.ts` — 11 testov (40 celkovo, všetky zelené)
- `docs/components/BaseModal.md` — API dokumentácia
- `docs/composables/useToast.md` — API dokumentácia s príkladmi

**Poznámka:** Komponentové testy pre `BaseModal` a `ToastContainer` vyžadujú `@vue/test-utils` + jsdom — nie je nastavené, odložené na budúcnosť.

---

## Iterácia 2 — Dark mode kontrast

**Scope:** Hlavne `FilterPanel.vue`, sekundárne celá app.

- Audit hardcoded farieb v `FilterPanel.vue` (pills, checkboxy, labels, category dots)
- Opraviť CSS vars v `main.css` — `--text-body` a `--text-muted` v dark mode majú zlý kontrast
- Pills aktívny stav: overiť kontrast text vs. `#3b82f6` background v dark
- Category checkboxy: farba labelu vs. tmavé pozadie
- Overiť všetky miesta kde sú hardcoded hex farby namiesto CSS vars

**Status:** ✅ Hotovo

**Výstupy:**
- `main.css` — opravené dark mode text vars: `--text-faint #2e2e50 → #6060a0`, `--text-muted #484870 → #7878b0`, `--text-body #7070a0 → #9090c0`, `--text-secondary #9898b8 → #b0b0d0`
- `main.css` — pridané `color-scheme: dark` (natívne form elementy v dark mode)
- `docs/dark-mode.md` — dokumentácia farebnej hierarchie

**Poznámka:** CSS testy nie sú možné bez jsdom + visual regression toolu (napr. Percy/Chromatic). Kontrast overený manuálne výpočtom luminancie; `--text-faint` ide z 1.3:1 na ~4.2:1 kontrastný pomer.

---

## Iterácia 3 — Progression: posledný krok → completed

**Logika:** Posledná progressia rozhoduje o stave `completed`. Double-click na ňu zmení skill z `in_progress` → `completed`.

- `SkillDetail.vue`: identifikovať posledný krok v `progressions[]`
- Vizuálne odlíšiť posledný krok (napr. iná ikona / label „Finálna progressia")
- Double-click handler: ak `current_step === totalSteps - 1` → `progressStore.setStatus(id, 'completed')`
- Toast: `success` — „{skill.name} dokončený"
- Single click na krok ostáva ako doteraz (navigácia na krok)

**Status:** ✅ Hotovo

**Výstupy:**
- `SkillDetail.vue` — `onLastStepDblClick()`: `@dblclick.stop` na poslednom kroku → `setStatus('completed')` + `toast.success`
- `SkillDetail.vue` — vizuálna distinktivita: class `drawer__step--final`, `★` badge v step-num, zelený border pre nezachytený final krok
- `SkillDetail.vue` — `title` tooltip: „Double-click na dokončenie skilu"
- Testy: logika je pokrytá existujúcimi store testami; Iterácia 3 nemení store API

---

## Iterácia 4 — Completed → Mastery flow

**Logika:** Keď je skill `completed`, zobrazí sa nová sekcia pre mastery. Double-click → confirmation → `mastered`.

- `SkillDetail.vue`: keď `status === 'completed'` → zobraz mastery sekciu (mastery criteria + double-click area)
- Double-click → `BaseModal` s textom: „Naozaj si zvládol tento skill na úrovni mastery?"
- Na confirm → `progressStore.setStatus(id, 'mastered')`
- Toast: `success` — „{skill.name} — Mastered"
- Vizuál mastery sekcie: gold tón, shimmer (konzistentné s existujúcim mastered badge)

**Status:** ✅ Hotovo

**Výstupy:**
- `SkillDetail.vue` — `drawer__mastery-prompt`: gold dashed box viditeľný len v `completed` stave, dblclick otvára modal
- `SkillDetail.vue` — `BaseModal` confirmation: „Potvrdiť Mastery" → `setStatus('mastered')` + `toast.success`
- `SkillDetail.vue` — `onMasteryConfirm()`, `onMasteryDblClick()`, `showMasteryModal ref`
- Vizuál: gold tón konzistentný s mastered badge

---

## Iterácia 5 — Dependency handling + zrušenie locked-parent obmedzenia

**Dve zmeny:**

**A) Zrušiť obmedzenie:** Odstrániť existujúci check v `SkillDetail.vue` / `progressStore` ktorý blokuje zmenu stavu ak parent je `locked`. Chceme to povoliť.

**B) Confirmation pri nastavení na `locked` s aktívnymi deťmi:**
Ak má skill deti v stave `in_progress | completed | mastered`, a user chce zmeniť status na `locked`:
- `BaseModal` — upozornenie so zoznamom dotknutých detí a ich stavmi
- Na confirm → zmena pokračuje
- Toast: `info` — „Stav zmenený. Ovplyvnené závislosti: X"

**Implementácia:**
- Pridať helper do `useSkillStore` alebo `useProgressStore`: `getActiveChildren(skillId)` — vráti deti s aktívnym stavom
- Volať ho pred každou zmenou stavu na `locked`

**Status:** ✅ Hotovo

**Výstupy:**
- `SkillDetail.vue` — odstránený `blockingPrereqs` computed, `PrereqModal` flow, `pendingStatus`
- `SkillDetail.vue` — `activeChildren` computed: deti skilu s non-locked stavom
- `SkillDetail.vue` — `onStatusChange`: ak `val === 'locked'` && `activeChildren.length > 0` → `showLockedModal`
- `SkillDetail.vue` — `BaseModal` locked confirmation so zoznamom aktívnych detí (farebné bodky per stav)
- `SkillDetail.vue` — `onLockedConfirm` → `setStatus('locked')` + `toast.info` s počtom ovplyvnených
- `SkillDetail.vue` — `onLockedCancel` → `selectKey++` (revert select DOM state)

---

## Závislosť iterácií (1–5)

```
Iterácia 1 (Modal + Toast)
    ↓ (závisí)
Iterácia 3, 4, 5 — všetky používajú BaseModal + useToast

Iterácia 2 — nezávislá, môže ísť paralelne s Iter. 1
```

---

## Iterácia 6 — Computed `unlocked` status + Guard modal

**Prečo teraz:** Základ pre všetky vizuálne a UX zmeny v 7–9. Musí ísť ako prvé.

**Rozhodnutie architektúry:** `unlocked` sa **neukladá** (ani localStorage, ani DB). Je to vždy computed z prerequisitov. Stored statuses ostávajú: `locked | in_progress | completed | mastered`.

**Status flow:**
```
locked → [auto-computed: unlocked] → in_progress → completed → mastered
```

### Zmeny

**`stores/useSkillStore.ts`**
- Pridaj `isSkillUnlocked(skillId: string): boolean`:
  - Nájdi skill podľa `skillId`, vezmi jeho `requires[]`
  - Ak `requires` je prázdne → `true` (žiadne prerekvizity)
  - Inak: každý `reqId` musí mať status `completed | mastered` cez `progressGetter`
  - Ak `progressGetter` nie je ešte nastavený → `false`

**`components/skills/SkillDetail.vue`**
- Guard modal — nová `ref showGuardModal = ref(false)` a `pendingInProgressChange = ref(false)`
- V `onStatusChange`: ak `val === 'in_progress'` a stored status je `'locked'` a `!skillStore.isSkillUnlocked(skill.id)` → ulož pending a otvor guard modal
- Guard modal content: zoznam prerequisitov ktoré NIE SÚ `completed | mastered` (s farebnými dot-kami)
- Na confirm → `progressStore.setStatus(id, 'in_progress')` + toast.info
- Na cancel → `selectKey++` (revert select)
- Unlocked chip: keď stored `'locked'` ale `isSkillUnlocked` → v header-top zobraz `🔓 Unlocked` badge (zelená, vedľa statusu)
- Status badge: keď `isSkillUnlocked && stored === 'locked'` → zobraz "Unlocked" label namiesto "Locked" (vizuálny alias, bez zmeny stored value)

**`stores/useProgressStore.ts`**
- Typ `ProgressStatus` ostáva `locked | in_progress | completed | mastered` (bez `unlocked`)
- Pridaj export `UNLOCKED_PREREQ_STATUSES = ['completed', 'mastered'] as const` pre konzistentnosť

**Status: ✅ Hotovo**

**Výstupy:**
- `components/HIcon.vue` — pridaný `LockOpenIcon` (`lock-open`)
- `assets/css/main.css` — `--status-unlocked` + `--status-unlocked-glow` (light/dark)
- `stores/useProgressStore.ts` — export `UNLOCKED_PREREQ_STATUSES`
- `stores/useSkillStore.ts` — `isSkillUnlocked(skillId)` + explicitný `import { ref, computed } from 'vue'`
- `components/skills/SkillDetail.vue` — guard modal, `displayStatusKey/Label/Icon`, `unmetPrereqs`, `headerGlow` pre unlocked, unlocked prompt sekcia
- `tests/unit/isSkillUnlocked.test.ts` — 11 testov (56 celkovo, všetky zelené)

---

## Iterácia 7 — Node & Edge vizuály pre `unlocked` + node edge case

**Závislosť:** Iterácia 6 musí byť hotová.

### Node vizuál (`components/skills/SkillNode.vue`)

- Pridaj `isUnlocked = computed(() => skillStore.isSkillUnlocked(props.data.skill.id))`
- Nová CSS trieda `skill-node--unlocked` (keď `isUnlocked && status === 'locked'`)
- Unlocked node štýl:
  - `opacity: 0.85` (vyššia ako locked `0.6`, nižšia ako aktívnych `1.0`)
  - Border color: `var(--status-unlocked)` (pridaj do `main.css` — napr. teal `#14b8a6`)
  - Slabý glow: `0 0 0 1px var(--status-unlocked-glow), 0 0 10px var(--status-unlocked-glow)`
- Node edge case: v `fillWidth` computed — ak `totalSteps === 0 && (status === 'completed' || status === 'mastered')` → `return '100%'`

### Edge vizuál (`utils/resolveEdgeVariant.ts` + `components/skills/SkillEdge.vue`)

**`resolveEdgeVariant.ts`:**
- Rozšír `NodeStatus` o `'unlocked'`
- Nový `EdgeVariant`: `'available'`
- Nové pravidlo (pred existing): ak `childStatus === 'unlocked'` a `parentStatus === 'completed' | 'mastered'` → `'available'`

**`SkillEdge.vue`:**
- `sourceStatus` a `targetStatus`: doplň unlocked check — `computed(() => { const s = progressStore.getProgress(id).status; return (s === 'locked' && skillStore.isSkillUnlocked(id)) ? 'unlocked' : s })`
- Pre variant `'available'`: teal stroke (`var(--status-unlocked)`), `strokeWidth = 1.5`, `strokeOpacity = 0.7`, jemný `animate stroke-opacity` pulse (bez particle)
- Zvýšenie prominence pre mastered/completed → unlocked: border skilu aj edge sú výraznejšie ako locked state

### List view edge case (`components/skills/SkillList.vue`)

- `getProgressFill`: ak `totalSteps === 0 && (status === 'completed' || status === 'mastered')` → `return 100`

**Status: ✅ Hotovo**

**Výstupy:**
- `utils/resolveEdgeVariant.ts` — `NodeStatus` rozšírený o `'unlocked'`, nový `EdgeVariant` `'available'`, nové pravidlo (priorita 3)
- `components/skills/SkillNode.vue` — `isUnlocked` computed, `skill-node--unlocked` trieda, teal `borderColor`/`bgColor`/`glowShadow`, opacity `0.85`, `fillWidth` edge case (no progressions + completed/mastered → `'100%'`)
- `components/skills/SkillEdge.vue` — import `useSkillStore`, `effectiveStatus()` helper, `isAvailable` computed, `available` stroke farba/šírka/opacity, animovaný teal path
- `components/skills/SkillList.vue` — `getProgressFill` edge case, `v-if` na fill div zmenený na `getProgressFill > 0`
- `tests/unit/resolveEdgeVariant.test.ts` — 5 nových testov pre `unlocked` child (21 celkovo)
- `tests/unit/progressFill.test.ts` — 11 testov pre fill logic (72 celkovo, všetky zelené)
- `docs/status-system.md` — kompletná dokumentácia statusového systému

---

## Iterácia 8 — Filter panel redesign

**Závislosť:** Iterácia 6 (pre `unlocked` v status filtri). Inak nezávislá.

### Problém
Native `<select multiple>` / checkboxy vyzerajú inak na PC vs Mac. Riešenie: custom `FilterCombo` komponent.

### Nový komponent `components/FilterCombo.vue`

Props:
```ts
interface Props {
  label: string
  options: { value: string; label: string; color?: string; meta?: string }[]
  modelValue: string | string[]
  multi?: boolean
}
```
- Trigger button: zobrazí vybrané hodnoty (alebo "All" ak nič)
- Dropdown panel: `position: absolute`, `z-index: 100`, `border + shadow`
- Multi mode: checkboxy pri každej opcii
- Single mode: zvýraznenie vybranej (ako radio)
- `onClickOutside` cez `onMounted` + `document.addEventListener('click', handler, true)`
- Zatvorí sa aj na Escape

### `FilterPanel.vue` — nová štruktúra

| Filter | Typ | Hodnoty |
|---|---|---|
| View | existujúci `<select>` | Graph TB / Graph LR / List |
| Sport | `FilterCombo` single | All / Calisthenics / Acrobatics |
| Type | `FilterCombo` single (NOVÉ) | All / Skills / Transitions |
| Category | `FilterCombo` multi | kategórie + farebný dot + tracker `(x/y)` |
| Status | `FilterCombo` multi | All / Locked / Unlocked / In Progress / Completed / Mastered |

### `useSkillStore.ts` doplnky

- `typeFilter = ref<'all' | 'skill' | 'transition'>('all')`
- `statusFilter` zmeniť z `string` na `string[]` (multi-select) — spätná kompatibilita cez `.includes()`
- `filteredSkills` computed rozšíriť o `typeFilter`

### Category tracker v FilterCombo

- V `FilterPanel.vue`: computed `categoryStats` — pre každú kategóriu `{ completed: number, mastered: number, total: number }`
- `completed` = skills s `status === 'completed' || 'mastered'`
- Zobraz ako `meta` v opcii: `"3/8 ★1"`
- Táto info je read-only, len vizuálna

**Status: ✅ Hotovo**

**Výstupy:**
- `stores/useSkillStore.ts` — `TypeFilter` type, `typeFilter` ref, `StatusFilter` rozšírený o `'unlocked'`, `filteredSkills` updated (typeFilter + unlocked logic)
- `components/FilterCombo.vue` — nový cross-platform dropdown komponent, single/multi mode, color dot, meta tracker, outside-click + Escape close
- `components/skills/FilterPanel.vue` — prepísaný: View (native select), Sport/Type/Status (FilterCombo single), Category (FilterCombo multi s completion trackerom), ThemeToggle
- `tests/unit/skillStoreFilters.test.ts` — 8 testov: typeFilter, statusFilter='unlocked', combined filters (80 celkovo, všetky zelené)
- `docs/components/FilterCombo.md` — API dokumentácia

---

## Iterácia 9 — List view: sort, animácie, category tracker

**Závislosť:** Iterácia 6 (pre `unlocked` ikonu). Iterácia 8 (category stats pattern).

### Sort

- `useSkillStore.ts`: `listSortBy = ref<'default' | 'difficulty-asc' | 'difficulty-desc' | 'status' | 'progress'>('default')`
- Sort priority pre `'status'`: `mastered > completed > in_progress > unlocked > locked`
- Sort pre `'progress'`: podľa `current_step / totalSteps` desc
- V `SkillList.vue`: computed `sortedGroupSkills` wraps `group.skills` pred renderom
- UI: malý `<select>` alebo pills `Sort:` v hornej časti SkillList (nad zoznamom skupín)

### Accordion animácie

- Zmeniť `v-if` na `v-show` pre `.skill-list__items`
- CSS Grid trick pre hladkú height animáciu:
  ```css
  .skill-list__items {
    display: grid;
    grid-template-rows: 0fr;   /* zatvorené */
    transition: grid-template-rows 220ms ease;
    overflow: hidden;
  }
  .skill-list__items.is-open {
    grid-template-rows: 1fr;   /* otvorené */
  }
  ```
- Inner wrapper `<div>` s `min-height: 0` (required pre Grid trick)
- Otváranie logika ostáva — všetky môžu byť otvorené naraz

### Category tracker v group headeroch

- V `groupedSkills` computed: pridaj `completedCount` a `masteredCount` do každej skupiny
- `completedCount` = skills kde `status === 'completed' || 'mastered'`
- Header zobrazí: `Pull · 3/8 · ★2` (meno · completed/total · ★mastered)
- Mini progress bar pod header textom: `width = (completedCount / total) * 100%`, farba kategórie

### Unlocked ikona v skill itemoch

- `statusIconName`: pridaj `unlocked: 'lock-open'` (Heroicons má `lock-open`)
- V template: ak `isUnlocked(skill.id)` → použij `unlocked` ikonu namiesto `lock-closed`

**Status: ✅ Hotovo**

**Výstupy:**
- `utils/listSort.ts` — nový utility: `ListSortBy` type, `STATUS_PRIORITY` mapa, `compareByStatus`, `compareByDifficulty`, `compareByProgress` — čisté pure funkcie, plne testovateľné
- `stores/useSkillStore.ts` — `ListSortBy` re-export (import z utils), `listSortBy = ref<ListSortBy>('default')`, exportovaný v return
- `components/skills/SkillList.vue` — kompletný prepis:
  - Sort bar s pills (`Default / Status / Progress / Diff ↑ / Diff ↓`)
  - `sortSkillsInGroup()` používa utility comparators
  - `getEffectiveStatus()` — vracia `'unlocked'` ak stored `locked` + prereqs splnené
  - `groupedSkills` computed: `completedCount`, `masteredCount`, `totalCount` (z ALL skills, nie len filtered)
  - Group header: row so `CategoryName · 3/8 ★2 · [count] · chevron`; mini progress bar (2px, category farba)
  - Accordion: CSS Grid trick (`grid-template-rows: 0fr → 1fr`, `220ms ease`), inner wrapper `min-height: 0`
  - Unlocked ikona: `lock-open` (teal) keď `getEffectiveStatus === 'unlocked'`
- `tests/unit/listSort.test.ts` — 12 nových testov: `STATUS_PRIORITY` (2), `compareByStatus` (4), `compareByDifficulty` (4), `compareByProgress` (2) — **92 celkovo, všetky zelené**

---

## Iterácia 10 — Mobile UX

**Závislosť:** Nezávislá od 6–9.

### Burger menu pre FilterPanel

- `pages/skills/index.vue`: `showFilterMenu = ref(false)` (local state)
- Na mobile (`< 768px`): `FilterPanel` sa nezobrazuje v hlavnom layout-e ale ako overlay
- Hamburger button: absolútne pozicionovaný top-left, viditeľný len na mobile
- Overlay: `position: fixed; inset: 0; z-index: 60` s polopriesvitným backdropom
- `FilterPanel` v overlay: `position: fixed; top: 0; left: 0; right: 0` slide-down animácia
- Zatvorenie: klik na backdrop alebo X tlačidlo v FilterPanel headeri

### Sticky drawer header

- Existujúca štruktúra (`flex-shrink: 0` na header, `overflow-y: auto` na body) by mala fungovať
- Na mobile kde je drawer `position: fixed; bottom: 0; max-height: 60vh`: pridaj `overflow: hidden` na `.drawer` wrapper
- Overí sa že header ostáva sticky aj pri scrollovaní body na iOS (Safari quirk)

### Body scroll prevention

- **Primárne riešenie (CSS):** `overscroll-behavior: contain` na `.drawer__body` — zabraňuje scroll chain bez JS
- **Sekundárne (JS):** vo `pages/skills/index.vue`, watch `skillStore.selectedSkillId`:
  ```ts
  watch(selectedSkillId, (id) => {
    if (isMobile.value) {
      document.body.style.overflow = id ? 'hidden' : ''
    }
  })
  ```
- Cleanup: `onUnmounted(() => { document.body.style.overflow = '' })`

**Status: ✅ Hotovo**

**Výstupy:**
- `components/HIcon.vue` — pridaný `Bars3Icon` (`bars-3`) pre hamburger button
- `pages/skills/index.vue`:
  - `showFilterMenu = ref(false)` — state pre mobilný filter overlay
  - Desktop: `<FilterPanel />` obalený v `.skills-page__filter-desktop` (skrytý na mobile via `@media`)
  - Mobile (v `<template v-if="isMobile">`):
    - Hamburger button: `position: fixed; top: 8px; left: 12px; z-index: 55`
    - Filter overlay backdrop: `position: fixed; inset: 0; z-index: 60` s `rgba(0,0,0,0.35)`, klik zatvára
    - Filter panel wrap: `position: fixed; top: 0; left: 0; right: 0; z-index: 61`, slide-down animácia (`translateY(-100%) → 0`, 250ms)
    - Panel header: "FILTERS" label + X close button
    - `<FilterPanel />` vo wrapperi — zdieľa rovnaký store state ako desktop verzia
  - Body scroll lock: `watch(selectedSkillId)` → `document.body.style.overflow = id ? 'hidden' : ''` (len na mobile)
  - `onUnmounted` cleanup: `document.body.style.overflow = ''`
  - `skills-page__panel` na mobile: `overflow: hidden` pridané
- `components/skills/SkillDetail.vue` — `.drawer__body`: `overscroll-behavior: contain` (zabraňuje iOS scroll chain)
- Testy: bez nových (CSS/DOM zmeny; component testy vyžadujú jsdom+vue/test-utils — odložené) — **92 celkovo, všetky zelené**

---

## Iterácia 11 — Category color theming

**Závislosť:** Iterácia 7 (pre unlocked node farby).

### Cieľ

Farba kategórie je primárnym identifikátorom skilu. Status farba je sekundárna (ikona/glow). Nie naopak.

### SkillNode

- Border color: `color-mix(in srgb, categoryHex 60%, statusColor 40%)` namiesto čistej `statusColor`
  - Výsledok: každý node má viditeľný odtieň svojej kategórie
  - Status (locked/in_progress/mastered) naďalej rozlíšiteľný cez glow a opacity, nie len border
- Unlocked border (iter 7): `color-mix(in srgb, categoryHex 70%, var(--status-unlocked) 30%)`
- `skill-node__fill`: ostáva `statusColor` (progress fill nepotrebuje kategóriu — dostatočne kontrastný)

### SkillList items

- `skill-list__fill` background: ostáva `hexToRgba(category.color, 0.3)` ✓ (už implementované)
- Doplň: left border na item = `1px solid hexToRgba(category.color, 0.5)` pre `completed | mastered`
- Status ikona farba: `color-mix(in srgb, category.color 40%, statusColor 60%)`

### SkillDetail drawer

- `drawer__cat-bar` (4px bar pod headerom): ostáva kategóriová farba ✓ (už implementované)
- `drawer__track-fill` (progress bar): zmeniť z `var(--status-in-progress)` na `category.color` — alebo `color-mix(in srgb, categoryHex 50%, var(--status-in-progress) 50%)`
- `headerGlow`: doplň kategóriovú farbu do glow: `color-mix(in srgb, categoryHex 30%, statusGlowColor 70%)`

### `main.css` — nové CSS premenné

```css
--status-unlocked: #14b8a6;
--status-unlocked-glow: rgba(20, 184, 166, 0.35);
```

(Tieto premenné boli pridané už v Iterácii 6 — nie je potrebná žiadna zmena.)

**Status: ✅ Hotovo**

**Výstupy:**
- `components/skills/SkillNode.vue` — `borderColor` computed zmenený:
  - Normal: `color-mix(in srgb, ${categoryHex} 60%, ${statusKey} 40%)` — kategória dominuje, status ako akcent
  - Unlocked: `color-mix(in srgb, ${categoryHex} 70%, var(--status-unlocked) 30%)`
  - `fillColor` (progress fill) ostáva čistý `statusKey` ✓
- `components/skills/SkillList.vue` — dve nové helper funkcie + template zmeny:
  - `getStatusIconStyle(skillId, categoryColor)` — `color: color-mix(in srgb, cat 40%, statusVar 60%)` pre každý status vrátane unlocked; nahradil starý CSS class `.skill-list__status--unlocked`
  - `getItemBorderLeft(skillId, categoryColor)` — `3px solid hexToRgba(cat, 0.5)` pre completed/mastered, `3px solid transparent` pre ostatné (žiadny layout shift)
  - Template: `.skill-list__item` dostáva `:style="{ borderLeft: ... }"`, `.skill-list__status` dostáva `:style="getStatusIconStyle(...)"`
  - CSS: `.skill-list__status--unlocked` odstránený (nahradený inline štýlom)
- `components/skills/SkillDetail.vue`:
  - `mixCatWithStatus(catHex, catWeight, r, g, b, alpha)` — pure helper na mixovanie hex + RGB s alpha
  - `headerGlow` — teraz mixuje 30% kategórie + 70% status farby pre každý stav
  - `trackFillBg` — nový computed: `linear-gradient` s kategóriovou farbou (s shimmer efektom)
  - Template: `.drawer__track-fill` dostáva `:style="{ ..., background: trackFillBg }"`
- Testy: bez nových (pure visual/inline style zmeny) — **92 celkovo, všetky zelené**

---

## Závislosť iterácií (6–11)

```
Iterácia 6 (computed unlocked + guard modal)
    ↓
Iterácia 7 (node/edge vizuál pre unlocked)
    ↓
Iterácia 11 (category theming — rozširuje iter 7 farby)

Iterácia 8 (filter panel redesign) — závisí len na iter 6 pre unlocked filter
Iterácia 9 (list view) — závisí na iter 6 pre unlocked ikonu
Iterácia 10 (mobile UX) — nezávislá, môže ísť paralelne s 6–9
```
