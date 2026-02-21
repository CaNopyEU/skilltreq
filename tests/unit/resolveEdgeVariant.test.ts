import { describe, it, expect } from 'vitest'
import { resolveEdgeVariant } from '../../utils/resolveEdgeVariant'
import type { NodeStatus, EdgeVariant } from '../../utils/resolveEdgeVariant'

// Sanity check: NodeStatus includes 'unlocked'
const _: NodeStatus = 'unlocked'
void _

describe('resolveEdgeVariant', () => {
  describe('locked parent → locked_dashed (all 4 children)', () => {
    const parent: NodeStatus = 'locked'
    const cases: [NodeStatus, EdgeVariant][] = [
      ['locked', 'locked_dashed'],
      ['in_progress', 'locked_dashed'],
      ['completed', 'locked_dashed'],
      ['mastered', 'locked_dashed'],
    ]
    it.each(cases)('locked → %s = %s', (child, expected) => {
      expect(resolveEdgeVariant(parent, child)).toBe(expected)
    })
  })

  describe('in_progress parent', () => {
    const parent: NodeStatus = 'in_progress'
    const cases: [NodeStatus, EdgeVariant][] = [
      ['locked', 'locked_solid'],
      ['in_progress', 'in_progress'],
      ['completed', 'in_progress'],
      ['mastered', 'in_progress'],
    ]
    it.each(cases)('in_progress → %s = %s', (child, expected) => {
      expect(resolveEdgeVariant(parent, child)).toBe(expected)
    })
  })

  describe('completed parent', () => {
    const parent: NodeStatus = 'completed'
    const cases: [NodeStatus, EdgeVariant][] = [
      ['locked', 'locked_solid'],
      ['in_progress', 'in_progress'],
      ['completed', 'completed'],
      ['mastered', 'in_progress'],
    ]
    it.each(cases)('completed → %s = %s', (child, expected) => {
      expect(resolveEdgeVariant(parent, child)).toBe(expected)
    })
  })

  describe('mastered parent', () => {
    const parent: NodeStatus = 'mastered'
    const cases: [NodeStatus, EdgeVariant][] = [
      ['locked', 'locked_solid'],
      ['in_progress', 'in_progress'],
      ['completed', 'mastered_to_completed'],
      ['mastered', 'mastered'],
    ]
    it.each(cases)('mastered → %s = %s', (child, expected) => {
      expect(resolveEdgeVariant(parent, child)).toBe(expected)
    })
  })

  describe('unlocked child — available when parent not locked', () => {
    const cases: [NodeStatus, EdgeVariant][] = [
      ['in_progress', 'available'],
      ['completed', 'available'],
      ['mastered', 'available'],
      ['unlocked', 'available'],
    ]
    it.each(cases)('%s → unlocked = %s', (parent, expected) => {
      expect(resolveEdgeVariant(parent, 'unlocked')).toBe(expected)
    })

    it('locked → unlocked = locked_dashed (parent locked takes priority)', () => {
      expect(resolveEdgeVariant('locked', 'unlocked')).toBe('locked_dashed')
    })
  })
})
