import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkillStore } from '../../stores/useSkillStore'
import type { Skill } from '../../db/schema'

function mockSkill(overrides: Partial<Skill> & { id: string }): Skill {
  return {
    name: overrides.id,
    abbr: null,
    categoryId: null,
    sport: 'calisthenics-beginner',
    difficulty: 1,
    description: null,
    type: 'skill',
    progressions: null,
    tutorials: null,
    requires: [],
    masteryCriteria: null,
    ...overrides,
  }
}

type MockStatus = 'locked' | 'in_progress' | 'completed' | 'mastered'

function makeGetter(map: Record<string, MockStatus>) {
  return (id: string) => ({ status: map[id] ?? 'locked' })
}

describe('useSkillStore — typeFilter', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
    setActivePinia(createPinia())
  })

  it('default empty shows both skills and transitions', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', type: 'skill' }),
      mockSkill({ id: 'b', type: 'transition' }),
    ]
    expect(store.filteredSkills).toHaveLength(2)
  })

  it('["skill"] shows only skills', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', type: 'skill' }),
      mockSkill({ id: 'b', type: 'transition' }),
    ]
    store.typeFilter = ['skill']
    expect(store.filteredSkills).toHaveLength(1)
    expect(store.filteredSkills[0].id).toBe('a')
  })

  it('["transition"] shows only transitions', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', type: 'skill' }),
      mockSkill({ id: 'b', type: 'transition' }),
    ]
    store.typeFilter = ['transition']
    expect(store.filteredSkills).toHaveLength(1)
    expect(store.filteredSkills[0].id).toBe('b')
  })

  it('["skill", "transition"] shows both', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', type: 'skill' }),
      mockSkill({ id: 'b', type: 'transition' }),
    ]
    store.typeFilter = ['skill', 'transition']
    expect(store.filteredSkills).toHaveLength(2)
  })
})

describe('useSkillStore — statusFilter "unlocked"', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
    setActivePinia(createPinia())
  })

  it('shows only skills that are locked-stored but all prereqs met', () => {
    const store = useSkillStore()
    // skill 'b' requires 'a'
    store.skills = [
      mockSkill({ id: 'a', requires: [] }),
      mockSkill({ id: 'b', requires: ['a'] }),
      mockSkill({ id: 'c', requires: ['a'] }), // 'a' not completed → 'c' locked
    ]
    // 'a' is completed, so 'b' is unlocked; 'c' requires 'a' which is completed — also unlocked
    // Wait, both b and c require only 'a' which is completed, so both are unlocked
    store.setProgressGetter(makeGetter({ a: 'completed', b: 'locked', c: 'locked' }))
    store.statusFilter = ['unlocked']

    const ids = store.filteredSkills.map((s) => s.id).sort()
    expect(ids).toEqual(['b', 'c'])
  })

  it('excludes skills whose stored status is not locked', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', requires: [] }),
      mockSkill({ id: 'b', requires: ['a'] }),
    ]
    store.setProgressGetter(makeGetter({ a: 'completed', b: 'in_progress' }))
    store.statusFilter = ['unlocked']

    // 'b' is in_progress (not locked), so it doesn't show as "unlocked"
    expect(store.filteredSkills).toHaveLength(0)
  })

  it('excludes skills whose prereqs are not all met', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', requires: [] }),
      mockSkill({ id: 'b', requires: [] }),
      mockSkill({ id: 'c', requires: ['a', 'b'] }),
    ]
    // 'a' completed but 'b' in_progress → 'c' not unlocked
    store.setProgressGetter(makeGetter({ a: 'completed', b: 'in_progress', c: 'locked' }))
    store.statusFilter = ['unlocked']

    expect(store.filteredSkills).toHaveLength(0)
  })

  it('skills with no requires are always unlocked when stored as locked', () => {
    const store = useSkillStore()
    store.skills = [mockSkill({ id: 'a', requires: [] })]
    store.setProgressGetter(makeGetter({ a: 'locked' }))
    store.statusFilter = ['unlocked']

    expect(store.filteredSkills).toHaveLength(1)
  })

  it('["unlocked", "in_progress"] matches both states', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', requires: [] }),
      mockSkill({ id: 'b', requires: ['a'] }),
      mockSkill({ id: 'c', requires: [] }),
    ]
    store.setProgressGetter(makeGetter({ a: 'completed', b: 'locked', c: 'in_progress' }))
    store.statusFilter = ['unlocked', 'in_progress']

    const ids = store.filteredSkills.map((s) => s.id).sort()
    expect(ids).toEqual(['b', 'c'])
  })
})

describe('useSkillStore — combined filters', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
    setActivePinia(createPinia())
  })

  it('typeFilter + sportFilter combine correctly', () => {
    const store = useSkillStore()
    store.skills = [
      mockSkill({ id: 'a', type: 'skill', sport: 'calisthenics-beginner' }),
      mockSkill({ id: 'b', type: 'transition', sport: 'calisthenics-beginner' }),
      mockSkill({ id: 'c', type: 'skill', sport: 'calisthenics-intermediate' }),
    ]
    store.typeFilter = ['skill']
    store.sportFilter = ['calisthenics-beginner']

    expect(store.filteredSkills).toHaveLength(1)
    expect(store.filteredSkills[0].id).toBe('a')
  })
})
