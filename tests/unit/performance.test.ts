import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, reactive } from 'vue'
import * as edgeModule from '../../utils/resolveEdgeVariant'
import { resolveEdgeVariant } from '../../utils/resolveEdgeVariant'
import type { NodeStatus } from '../../utils/resolveEdgeVariant'

describe('performance guard', () => {
  let spy = vi.spyOn(edgeModule, 'resolveEdgeVariant')

  beforeEach(() => {
    spy = vi.spyOn(edgeModule, 'resolveEdgeVariant')
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it('200 nodes, 199 edges: changing 1 node triggers at most 2 edge recomputations', () => {
    const N = 200
    const statuses = reactive<NodeStatus[]>(Array(N).fill('locked'))

    // 199 per-edge computeds: edge[i] = resolveEdgeVariant(node[i], node[i+1])
    const edges = Array.from({ length: N - 1 }, (_, i) =>
      computed(() => edgeModule.resolveEdgeVariant(statuses[i], statuses[i + 1])),
    )

    // Prime all computeds to establish dependency tracking
    edges.forEach((e) => e.value)
    spy.mockClear()

    // Change node at position 100 (middle of chain)
    statuses[100] = 'completed'

    // Read all computeds — only edge[99] and edge[100] should recompute
    edges.forEach((e) => e.value)

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('resolveEdgeVariant is pure: same inputs always produce same output', () => {
    const statuses: NodeStatus[] = ['locked', 'in_progress', 'completed', 'mastered']
    for (const parent of statuses) {
      for (const child of statuses) {
        const a = resolveEdgeVariant(parent, child)
        const b = resolveEdgeVariant(parent, child)
        expect(a).toBe(b)
      }
    }
  })

  it('resolveEdgeVariant does not mutate its inputs', () => {
    const parent: NodeStatus = 'in_progress'
    const child: NodeStatus = 'locked'
    resolveEdgeVariant(parent, child)
    expect(parent).toBe('in_progress')
    expect(child).toBe('locked')
  })
})
