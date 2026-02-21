import { describe, it, expect } from 'vitest'
import { STATUS_PRIORITY, compareByStatus, compareByDifficulty, compareByProgress } from '../../utils/listSort'

describe('STATUS_PRIORITY', () => {
  it('follows mastered > completed > in_progress > unlocked > locked order', () => {
    const order = ['mastered', 'completed', 'in_progress', 'unlocked', 'locked']
    for (let i = 0; i < order.length - 1; i++) {
      expect(STATUS_PRIORITY[order[i]]).toBeGreaterThan(STATUS_PRIORITY[order[i + 1]])
    }
  })

  it('defines all five statuses', () => {
    expect(STATUS_PRIORITY).toHaveProperty('mastered')
    expect(STATUS_PRIORITY).toHaveProperty('completed')
    expect(STATUS_PRIORITY).toHaveProperty('in_progress')
    expect(STATUS_PRIORITY).toHaveProperty('unlocked')
    expect(STATUS_PRIORITY).toHaveProperty('locked')
  })
})

describe('compareByStatus', () => {
  it('returns positive when b has higher priority than a (b sorts first)', () => {
    // a=locked(1), b=mastered(5) → return positive → b comes before a
    expect(compareByStatus(STATUS_PRIORITY.locked, STATUS_PRIORITY.mastered)).toBeGreaterThan(0)
  })

  it('returns negative when a has higher priority than b (a sorts first)', () => {
    expect(compareByStatus(STATUS_PRIORITY.mastered, STATUS_PRIORITY.locked)).toBeLessThan(0)
  })

  it('returns 0 for equal priorities', () => {
    expect(compareByStatus(STATUS_PRIORITY.completed, STATUS_PRIORITY.completed)).toBe(0)
  })

  it('sorts an array in correct priority order', () => {
    const items = [
      { status: 'locked' },
      { status: 'mastered' },
      { status: 'in_progress' },
      { status: 'completed' },
      { status: 'unlocked' },
    ]
    const sorted = [...items].sort((a, b) =>
      compareByStatus(STATUS_PRIORITY[a.status] ?? 0, STATUS_PRIORITY[b.status] ?? 0),
    )
    expect(sorted.map((s) => s.status)).toEqual([
      'mastered',
      'completed',
      'in_progress',
      'unlocked',
      'locked',
    ])
  })
})

describe('compareByDifficulty', () => {
  it('asc: lower difficulty value comes first', () => {
    expect(compareByDifficulty(1, 5, 'asc')).toBeLessThan(0)
    expect(compareByDifficulty(5, 1, 'asc')).toBeGreaterThan(0)
    expect(compareByDifficulty(3, 3, 'asc')).toBe(0)
  })

  it('desc: higher difficulty value comes first', () => {
    expect(compareByDifficulty(5, 1, 'desc')).toBeLessThan(0)
    expect(compareByDifficulty(1, 5, 'desc')).toBeGreaterThan(0)
  })

  it('asc sorts an array from easiest to hardest', () => {
    const items = [5, 1, 3, 2, 4]
    const sorted = [...items].sort((a, b) => compareByDifficulty(a, b, 'asc'))
    expect(sorted).toEqual([1, 2, 3, 4, 5])
  })

  it('desc sorts an array from hardest to easiest', () => {
    const items = [3, 1, 5, 2, 4]
    const sorted = [...items].sort((a, b) => compareByDifficulty(a, b, 'desc'))
    expect(sorted).toEqual([5, 4, 3, 2, 1])
  })
})

describe('compareByProgress', () => {
  it('higher fill percentage comes first', () => {
    expect(compareByProgress(100, 50)).toBeLessThan(0)
    expect(compareByProgress(50, 100)).toBeGreaterThan(0)
    expect(compareByProgress(75, 75)).toBe(0)
  })

  it('sorts an array from most to least progress', () => {
    const fills = [30, 100, 0, 75, 50]
    const sorted = [...fills].sort((a, b) => compareByProgress(a, b))
    expect(sorted).toEqual([100, 75, 50, 30, 0])
  })
})
