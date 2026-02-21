# YAML Authoring Guide – Skills & Sports

Tento guide popisuje, ako pridávať nové skilly alebo celé sporty do Skilltreq.

---

## Štruktúra súborov

```
data/
  categories.yaml              ← globálne kategórie (zdieľané medzi sportmi)
  calisthenics/
    pull.yaml
    push.yaml
    ...
  acrobatics/
    floor.yaml
    ...
  <nový-sport>/                ← nový adresár pre každý šport
    <kategoria>.yaml
```

Seed script automaticky číta **všetky `.yaml` súbory** v `data/calisthenics/` a `data/acrobatics/`.
Pre nový šport treba rozšíriť seed (`db/seed.ts`) a schému (`db/schema.ts`).

---

## Formát skill záznamu

```yaml
- id: front-lever                    # POVINNÉ – unikátny slug, kebab-case, bez medzier
  name: Front Lever                  # POVINNÉ – zobrazovaný názov
  abbr: FL                           # voliteľné – skratka pre graf (max ~8 znakov)
  category: pull                     # POVINNÉ – musí existovať v categories.yaml
  difficulty: 7                      # POVINNÉ – integer 1–10
  type: skill                        # POVINNÉ – "skill" alebo "transition"
  requires: [pull-up]                # POVINNÉ – zoznam id skillов; [] ak žiadne prerekvizity
  tutorials:
    main: "https://youtu.be/..."     # POVINNÉ – hlavný tutorial (môže byť "")
    alt:  "https://youtu.be/..."     # POVINNÉ – alternatívny (môže byť "")
  progressions:                      # voliteľné – kroky k zvládnutiu skillu
    - name: Tuck FL
      mastery_criteria: "15s hold"
    - name: Full Front Lever
      mastery_criteria: "10s hold"
  mastery_criteria: "10s clean hold" # POVINNÉ – finálne kritérium zvládnutia
  description: "..."                 # voliteľné – dlhší popis
```

### Pravidlá pre `id`
- Kebab-case: `bar-mu`, `oa-front-lever`, `pb-victorian`
- Skratky sú OK: `oa` = one-arm, `pb` = parallel bars, `qa` = quasi-amputated
- Musí byť **globálne unikátny** naprieč všetkými `.yaml` súbormi
- Nemeň existujúce id – progress používateľov je naviazaný na ne

### Pravidlá pre `difficulty`
| Hodnota | Popis |
|---------|-------|
| 1–2 | Základy, vhodné pre začiatočníkov |
| 3–4 | Intermediate prerekvizity |
| 5–6 | Pokročilé skilly (napr. muscle-up, back lever) |
| 7–8 | Elitné skilly (front lever, planche) |
| 9–10 | Extrémne / world-class |

### Pravidlá pre `requires`
- Inline zoznam: `[skill-id-1, skill-id-2]`
- Prázdne prerekvizity: `[]` (nie `null` ani vynechané)
- Odkazuj len na id, ktoré **existujú** v niektorom `.yaml` súbore
- Acrobatics skilly môžu referencovať calisthenics id (napr. `handstand` z push.yaml)
- Graf zobrazuje dependency tree – prehnaný počet requires rozbiehá layout

### Progressions
- Sú **voliteľné** – iba ak skill má zmysluplné kroky
- Posledný progression zvyčajne = samotný skill s finálnym kritériom
- `mastery_criteria` na úrovni skillu musí byť **identické** s posledným progression kritériom (ak progressions existujú)

### Transitions (`type: transition`)
- Používaj pre pomenované prechody medzi dvoma pozíciami
- `requires` = oba koncové skilly (napr. `[front-lever, ring-maltese]`)
- Vynechaj `category` – transitions nemajú kategóriu (seed ju ignoruje)
- `abbr` je prakticky povinné: `FL → BP` (šípka `→` U+2192)
- `mastery_criteria` typicky `"3 controlled reps"`

---

## Formát kategórie (categories.yaml)

```yaml
categories:
  - id: pull                         # unikátny slug
    name: Pull                       # zobrazovaný názov
    color: "#a855f7"                 # Tailwind / hex farba pre UI theming
    description: Ťahové pohyby...    # voliteľné
```

- Kategória musí existovať pred tým, než na ňu odkazuje skill
- Farbu vyber z Tailwind palety pre konzistentnosť s existujúcimi kategóriami

---

## Pridanie nového športu

### 1. Rozšír DB enum

V `db/schema.ts` pridaj hodnotu do `sportEnum`:

```ts
export const sportEnum = pgEnum('sport', ['calisthenics', 'acrobatics', 'gymnastics'])
```

Potom vygeneruj a aplikuj migráciu:

```bash
bun run db:generate
bun run db:migrate
```

### 2. Vytvor adresár a YAML súbory

```bash
mkdir data/gymnastics
# vytvor data/gymnastics/floor.yaml, vault.yaml, ...
```

### 3. Rozšír seed script

V `db/seed.ts` v funkcii `seedSkills()`:

```ts
const g = await seedSkillsFromDir(join(ROOT, 'data/gymnastics'), 'gymnastics')
console.log(`  ✓ skills (${c} calisthenics, ${a} acrobatics, ${g} gymnastics)`)
```

### 4. Pridaj kategórie

Do `categories.yaml` pridaj nové kategórie pre šport (môžu sa zdieľať s existujúcimi).

### 5. Seed

```bash
bun run db:seed
```

---

## Checklist pred commitom

- [ ] Každé `id` je unikátne naprieč všetkými `.yaml` súbormi
- [ ] Každý `category` odkazuje na existujúce id v `categories.yaml`
- [ ] Každé id v `requires` existuje v niektorom `.yaml` súbore
- [ ] `difficulty` je integer 1–10
- [ ] `type` je `skill` alebo `transition`
- [ ] `tutorials.main` a `tutorials.alt` sú prítomné (aj keď prázdny string `""`)
- [ ] `mastery_criteria` je vyplnené
- [ ] Pre transitions: `abbr` obsahuje `→` šípku

## Overenie po seede

```bash
bun run db:seed          # nesmie vyhodiť conflict/error
bun run dev              # skontroluj graf a filter
bun run typecheck        # TS nesmie hlásiť chyby
```
