import { describe, it, expect, beforeEach } from 'vitest'
import { useFocusState } from '../../composables/useFocusState'
import type { Skill } from '../../db/schema'

// Minimal skill shapes for testing (only fields used by useFocusState)
type TestSkill = Pick<Skill, 'id' | 'requires'>

// Cast helper — the composable only accesses id and requires at runtime
function asSkills(items: TestSkill[]): Skill[] {
  return items as unknown as Skill[]
}

/**
 * Skill graph for tests:
 *   A → B → C   (A is root, B requires A, C requires B)
 *   D            (unrelated)
 */
const skills = asSkills([
  { id: 'A', requires: [] },
  { id: 'B', requires: ['A'] },
  { id: 'C', requires: ['B'] },
  { id: 'D', requires: [] },
])

describe('useFocusState', () => {
  beforeEach(() => {
    // Reset module-level singleton before each test
    useFocusState().setFocus(null, [])
  })

  it('setFocus(B) → focusBranchIds contains parent chain (A)', () => {
    const { setFocus, focusBranchIds } = useFocusState()
    setFocus('B', skills)
    expect(focusBranchIds.value.has('A')).toBe(true)
    expect(focusBranchIds.value.has('B')).toBe(true)
  })

  it('setFocus(B) → focusBranchIds contains direct child (C)', () => {
    const { setFocus, focusBranchIds } = useFocusState()
    setFocus('B', skills)
    expect(focusBranchIds.value.has('C')).toBe(true)
  })

  it('unrelated node D is NOT in focusBranchIds when focused on B', () => {
    const { setFocus, focusBranchIds } = useFocusState()
    setFocus('B', skills)
    expect(focusBranchIds.value.has('D')).toBe(false)
  })
})
