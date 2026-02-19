/**
 * Seed script – Phase 0
 *
 * Importuje YAML súbory do DB:
 *   data/categories.yaml       → categories
 *   data/calisthenics/*.yaml   → skills (sport: calisthenics)
 *   data/acrobatics/*.yaml     → skills (sport: acrobatics)
 *   data/progress.json         → userProgress pre seed usera
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
  sport: 'calisthenics' | 'acrobatics',
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
  const c = await seedSkillsFromDir(join(ROOT, 'data/calisthenics'), 'calisthenics')
  const a = await seedSkillsFromDir(join(ROOT, 'data/acrobatics'), 'acrobatics')
  console.log(`  ✓ skills (${c} calisthenics, ${a} acrobatics)`)
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

async function seedProgress(): Promise<void> {
  const data = JSON.parse(
    readFileSync(join(ROOT, 'data/progress.json'), 'utf-8'),
  ) as YamlProgress

  const rows: NewUserProgress[] = Object.entries(data.skills).map(([skillId, p]) => ({
    userId: SEED_USER_ID,
    skillId,
    status: p.status as NewUserProgress['status'],
    currentStep: p.current_step ?? 0,
    note: p.note ?? null,
    updatedAt: new Date(),
  }))

  await db.insert(userProgress).values(rows).onConflictDoNothing()
  console.log(`  ✓ user_progress (${rows.length})`)
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
