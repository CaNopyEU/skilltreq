import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkillStore } from '../../stores/useSkillStore'
import type { Skill } from '../../db/schema'

function mockSkill(id: string, requires: string[] = []): Skill {
  return {
    id,
    name: id,
    abbr: null,
    categoryId: null,
    sport: 'calisthenics',
    difficulty: 1,
    description: null,
    type: 'skill',
    progressions: null,
    tutorials: null,
    requires,
    masteryCriteria: null,
  }
}

type MockStatus = 'locked' | 'in_progress' | 'completed' | 'mastered'

function makeGetter(map: Record<string, MockStatus>) {
  return (id: string) => ({ status: map[id] ?? 'locked' })
}

describe('useSkillStore.isSkillUnlocked', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    })
    setActivePinia(createPinia())
  })

  it('returns false for unknown skillId', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('a')]
    store.setProgressGetter(makeGetter({}))
    expect(store.isSkillUnlocked('unknown')).toBe(false)
  })

  it('returns true for skill with no requires (null)', () => {
    const store = useSkillStore()
    const skill = mockSkill('a')
    skill.requires = null
    store.skills = [skill]
    store.setProgressGetter(makeGetter({}))
    expect(store.isSkillUnlocked('a')).toBe(true)
  })

  it('returns true for skill with empty requires array', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('a', [])]
    store.setProgressGetter(makeGetter({}))
    expect(store.isSkillUnlocked('a')).toBe(true)
  })

  it('returns false when progressGetter is not set', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('b', ['a'])]
    // no setProgressGetter call
    expect(store.isSkillUnlocked('b')).toBe(false)
  })

  it('returns true when single require is completed', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('b', ['a'])]
    store.setProgressGetter(makeGetter({ a: 'completed' }))
    expect(store.isSkillUnlocked('b')).toBe(true)
  })

  it('returns true when single require is mastered', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('b', ['a'])]
    store.setProgressGetter(makeGetter({ a: 'mastered' }))
    expect(store.isSkillUnlocked('b')).toBe(true)
  })

  it('returns true when all requires are mix of completed and mastered', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('c', ['a', 'b'])]
    store.setProgressGetter(makeGetter({ a: 'completed', b: 'mastered' }))
    expect(store.isSkillUnlocked('c')).toBe(true)
  })

  it('returns false when one require is in_progress', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('c', ['a', 'b'])]
    store.setProgressGetter(makeGetter({ a: 'completed', b: 'in_progress' }))
    expect(store.isSkillUnlocked('c')).toBe(false)
  })

  it('returns false when one require is locked', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('c', ['a', 'b'])]
    store.setProgressGetter(makeGetter({ a: 'completed', b: 'locked' }))
    expect(store.isSkillUnlocked('c')).toBe(false)
  })

  it('returns false when all requires are in_progress', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('c', ['a', 'b'])]
    store.setProgressGetter(makeGetter({ a: 'in_progress', b: 'in_progress' }))
    expect(store.isSkillUnlocked('c')).toBe(false)
  })

  it('returns false when all requires are locked (default)', () => {
    const store = useSkillStore()
    store.skills = [mockSkill('b', ['a'])]
    store.setProgressGetter(makeGetter({})) // 'a' defaults to locked
    expect(store.isSkillUnlocked('b')).toBe(false)
  })
})
