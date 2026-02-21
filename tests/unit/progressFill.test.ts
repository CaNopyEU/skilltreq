import { describe, it, expect } from 'vitest'

/**
 * Pure fill calculation logic — mirrors SkillNode.vue fillWidth and SkillList.vue getProgressFill.
 * Tested here as pure functions to avoid requiring @vue/test-utils.
 */

/** Returns fill percentage (0–100) for SkillList items. */
function listFill(status: string, totalSteps: number, currentStep: number): number {
  if (totalSteps === 0) {
    return status === 'completed' || status === 'mastered' ? 100 : 0
  }
  return Math.min(100, (currentStep / totalSteps) * 100)
}

/** Returns fill width string for SkillNode. */
function nodeFillWidth(status: string, totalSteps: number, currentStep: number): string {
  if (totalSteps === 0) {
    return status === 'completed' || status === 'mastered' ? '100%' : '0%'
  }
  return `${Math.min(100, (currentStep / totalSteps) * 100)}%`
}

describe('Progress fill — no progressions edge case (totalSteps === 0)', () => {
  describe('listFill', () => {
    it('completed with no progressions → 100', () => {
      expect(listFill('completed', 0, 0)).toBe(100)
    })

    it('mastered with no progressions → 100', () => {
      expect(listFill('mastered', 0, 0)).toBe(100)
    })

    it('in_progress with no progressions → 0', () => {
      expect(listFill('in_progress', 0, 0)).toBe(0)
    })

    it('locked with no progressions → 0', () => {
      expect(listFill('locked', 0, 0)).toBe(0)
    })
  })

  describe('nodeFillWidth', () => {
    it('completed with no progressions → 100%', () => {
      expect(nodeFillWidth('completed', 0, 0)).toBe('100%')
    })

    it('mastered with no progressions → 100%', () => {
      expect(nodeFillWidth('mastered', 0, 0)).toBe('100%')
    })

    it('locked with no progressions → 0%', () => {
      expect(nodeFillWidth('locked', 0, 0)).toBe('0%')
    })
  })
})

describe('Progress fill — with progressions', () => {
  it('0 of 4 steps → 0%', () => {
    expect(listFill('in_progress', 4, 0)).toBe(0)
    expect(nodeFillWidth('in_progress', 4, 0)).toBe('0%')
  })

  it('2 of 4 steps → 50%', () => {
    expect(listFill('in_progress', 4, 2)).toBe(50)
    expect(nodeFillWidth('in_progress', 4, 2)).toBe('50%')
  })

  it('4 of 4 steps → 100%', () => {
    expect(listFill('completed', 4, 4)).toBe(100)
    expect(nodeFillWidth('completed', 4, 4)).toBe('100%')
  })

  it('step over totalSteps → capped at 100%', () => {
    expect(listFill('completed', 4, 6)).toBe(100)
    expect(nodeFillWidth('completed', 4, 6)).toBe('100%')
  })
})
