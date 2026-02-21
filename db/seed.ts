/**
 * Seed script – Phase 0
 *
 * Importuje YAML súbory do DB:
 *   data/categories.yaml                  → categories
 *   data/calisthenics-beginner/*.yaml     → skills (sport: calisthenics-beginner)
 *   data/calisthenics-intermediate/*.yaml → skills (sport: calisthenics-intermediate)
 *   data/calisthenics-expert/*.yaml       → skills (sport: calisthenics-expert)
 *   data/progress.json                    → userProgress pre seed usera
 *
 * Použitie: bun run db:seed
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { db } from './client'
import {
  categories,
  skills,
  users,
  userProgress,
  type NewCategory,
  type NewSkill,
  type NewUserProgress,
} from './schema'

// ── Types matching YAML structure ──────────────────────────────────────────

type YamlCategory = {
  id: string
  name: string
  color: string
  description?: string
}

type YamlSkill = {
  id: string
  name: string
  abbr?: string
  category: string
  difficulty: number
  description?: string
  type?: 'skill' | 'transition'
  progressions?: Array<{ name: string; mastery_criteria: string }>
  tutorials?: { main: string; alt: string }
  requires?: string[]
  mastery_criteria?: string
  // progress fields in YAML are ignored – progress.json is source of truth
}

type YamlProgress = {
  version: string
  updated: string
  skills: Record<string, { status: string; current_step?: number; note?: string }>
}

// ── Helpers ────────────────────────────────────────────────────────────────

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function readYaml<T>(path: string): T {
  return yaml.load(readFileSync(path, 'utf-8')) as T
}

// ── Seed categories ────────────────────────────────────────────────────────

async function seedCategories(): Promise<void> {
  const { categories: cats } = readYaml<{ categories: YamlCategory[] }>(
    join(ROOT, 'categories.yaml'),
  )

  const rows: NewCategory[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    description: c.description ?? null,
  }))

  await db.insert(categories).values(rows).onConflictDoNothing()
  console.log(`  ✓ categories (${rows.length})`)
}

// ── Seed skills ────────────────────────────────────────────────────────────

async function seedSkillsFromDir(
  dir: string,
  sport: 'calisthenics-beginner' | 'calisthenics-intermediate' | 'calisthenics-expert',
): Promise<number> {
  const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
  const rows: NewSkill[] = []

  for (const file of files) {
    const data = readYaml<YamlSkill[]>(join(dir, file))
    const list = Array.isArray(data) ? data : []

    for (const s of list) {
      rows.push({
        id: s.id,
        name: s.name,
        abbr: s.abbr ?? null,
        categoryId: s.category ?? null,
        sport,
        difficulty: s.difficulty,
        description: s.description ?? null,
        type: s.type ?? 'skill',
        progressions: s.progressions ?? null,
        tutorials: s.tutorials ?? null,
        requires: s.requires ?? [],
        masteryCriteria: s.mastery_criteria ?? null,
      })
    }
  }

  await db.insert(skills).values(rows).onConflictDoNothing()
  return rows.length
}

async function seedSkills(): Promise<void> {
  const b = await seedSkillsFromDir(join(ROOT, 'data/calisthenics-beginner'), 'calisthenics-beginner')
  const i = await seedSkillsFromDir(join(ROOT, 'data/calisthenics-intermediate'), 'calisthenics-intermediate')
  const e = await seedSkillsFromDir(join(ROOT, 'data/calisthenics-expert'), 'calisthenics-expert')
  console.log(`  ✓ skills (${b} cal-beginner, ${i} cal-intermediate, ${e} cal-expert)`)
}

// ── Seed progress ──────────────────────────────────────────────────────────

const SEED_USER_ID = 'seed-user-1'

async function seedSeedUser(): Promise<void> {
  await db
    .insert(users)
    .values({
      id: SEED_USER_ID,
      email: 'seed@skilltreq.local',
      name: 'Seed User',
    })
    .onConflictDoNothing()
  console.log('  ✓ seed user')
}

const VALID_STATUSES = new Set(['locked', 'in_progress', 'unlocked', 'mastered'])

async function seedProgress(): Promise<void> {
  const data = JSON.parse(
    readFileSync(join(ROOT, 'data/progress.json'), 'utf-8'),
  ) as YamlProgress

  let inserted = 0
  let skipped = 0

  for (const [skillId, p] of Object.entries(data.skills)) {
    if (!VALID_STATUSES.has(p.status)) { skipped++; continue }
    try {
      await db.insert(userProgress).values({
        userId: SEED_USER_ID,
        skillId,
        status: p.status as NewUserProgress['status'],
        currentStep: p.current_step ?? 0,
        note: p.note ?? null,
        updatedAt: new Date(),
      }).onConflictDoNothing()
      inserted++
    } catch {
      skipped++
    }
  }

  console.log(`  ✓ user_progress (${inserted} inserted, ${skipped} skipped)`)
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('Seeding database...')
  await seedCategories()
  await seedSkills()
  await seedSeedUser()
  await seedProgress()
  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
