import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────────────────────────

export const sportEnum = pgEnum('sport', ['calisthenics', 'acrobatics'])

export const progressStatusEnum = pgEnum('progress_status', [
  'locked',
  'in_progress',
  'unlocked',
  'mastered',
])

// ── JSON types (mirroring YAML structure) ──────────────────────────────────

export type SkillProgression = {
  name: string
  mastery_criteria: string
}

export type SkillTutorials = {
  main: string
  alt: string
}

// ── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(), // OAuth provider sub
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: text('id').primaryKey(), // slug: "pull", "push", ...
  name: text('name').notNull(),
  color: text('color').notNull(),
  description: text('description'),
})

export const skills = pgTable('skills', {
  id: text('id').primaryKey(), // slug: "bar-mu", "front-lever", ...
  name: text('name').notNull(),
  abbr: text('abbr'),
  categoryId: text('category_id').references(() => categories.id),
  sport: sportEnum('sport').notNull(),
  difficulty: integer('difficulty').notNull(),
  description: text('description'),
  type: text('type', { enum: ['skill', 'transition'] }).notNull().default('skill'),
  progressions: jsonb('progressions').$type<SkillProgression[]>(),
  tutorials: jsonb('tutorials').$type<SkillTutorials>(),
  requires: jsonb('requires').$type<string[]>().default([]),
  masteryCriteria: text('mastery_criteria'),
})

export const userProgress = pgTable(
  'user_progress',
  {
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    skillId: text('skill_id')
      .references(() => skills.id, { onDelete: 'cascade' })
      .notNull(),
    status: progressStatusEnum('status').notNull().default('locked'),
    currentStep: integer('current_step').default(0),
    note: text('note'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    masteredAt: timestamp('mastered_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })],
)

// ── Inferred types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert

export type UserProgress = typeof userProgress.$inferSelect
export type NewUserProgress = typeof userProgress.$inferInsert
