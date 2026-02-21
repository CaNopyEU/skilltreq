import { describe, it, expect } from 'vitest'
import type { NewSkill, NewCategory, NewUserProgress, SkillProgression } from '../../db/schema'

describe('Drizzle schema types', () => {
  it('NewCategory shape is correct', () => {
    const cat: NewCategory = {
      id: 'pull',
      name: 'Pull',
      color: '#4472C4',
      description: 'Ťahové pohyby',
    }
    expect(cat.id).toBe('pull')
    expect(cat.color).toMatch(/^#/)
  })

  it('NewSkill shape matches YAML structure', () => {
    const progressions: SkillProgression[] = [
      { name: 'Tuck FL', mastery_criteria: '15s hold' },
      { name: 'Full Front Lever', mastery_criteria: '10s hold' },
    ]

    const skill: NewSkill = {
      id: 'front-lever',
      name: 'Front Lever',
      abbr: 'FL',
      categoryId: 'pull',
      sport: 'calisthenics-beginner',
      difficulty: 7,
      type: 'skill',
      progressions,
      tutorials: { main: 'https://youtu.be/pNs4FUTiZAk', alt: '' },
      requires: ['pull-up'],
      masteryCriteria: '10s clean hold',
    }

    expect(skill.id).toBe('front-lever')
    expect(skill.progressions).toHaveLength(2)
    expect(skill.requires).toContain('pull-up')
  })

  it('NewUserProgress status is one of allowed values', () => {
    const statuses: NewUserProgress['status'][] = [
      'locked',
      'in_progress',
      'unlocked',
      'mastered',
    ]
    expect(statuses).toHaveLength(4)
  })
})
