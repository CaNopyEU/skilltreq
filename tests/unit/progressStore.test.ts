import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, reactive } from 'vue'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { resolveEdgeVariant } from '../../utils/resolveEdgeVariant'
import type { NodeStatus } from '../../utils/resolveEdgeVariant'
import { useFocusState } from '../../composables/useFocusState'

// Minimal store that tracks node statuses with per-key reactivity
const useNodeStatusStore = defineStore('node-status', () => {
  const statuses = reactive<Record<string, NodeStatus>>({})

  function setStatus(id: string, s: NodeStatus) {
    statuses[id] = s
  }

  return { statuses, setStatus }
})

describe('progressStore integration', () => {
  // vi.fn wrapping the real function — avoids ESM read-only binding issue
  // that would occur with vi.spyOn on a namespace import
  let spy = vi.fn(resolveEdgeVariant)

  beforeEach(() => {
    setActivePinia(createPinia())
    spy = vi.fn(resolveEdgeVariant)
  })

  afterEach(() => {
    useFocusState().setFocus(null, [])
  })

  it('status change → adjacent computed recomputes', () => {
    const store = useNodeStatusStore()
    store.setStatus('A', 'completed')
    store.setStatus('B', 'locked')

    const edgeAB = computed(() =>
      spy(store.statuses['A'] ?? 'locked', store.statuses['B'] ?? 'locked'),
    )

    // Prime the computed (first read sets up tracking)
    const initial = edgeAB.value
    expect(initial).toBe('in_progress')

    spy.mockClear()

    // Mutate parent status
    store.setStatus('A', 'mastered')

    // Read to trigger recomputation
    const updated = edgeAB.value
    expect(updated).toBe('in_progress')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('unrelated edge does NOT recompute on foreign node change (spy count = 1)', () => {
    const store = useNodeStatusStore()
    store.setStatus('A', 'completed')
    store.setStatus('B', 'completed')
    store.setStatus('C', 'mastered')
    store.setStatus('D', 'mastered')

    const edgeAB = computed(() =>
      spy(store.statuses['A'] ?? 'locked', store.statuses['B'] ?? 'locked'),
    )
    const edgeCD = computed(() =>
      spy(store.statuses['C'] ?? 'locked', store.statuses['D'] ?? 'locked'),
    )

    // Prime both computeds
    edgeAB.value
    edgeCD.value
    spy.mockClear()

    // Only change A (affects edgeAB, not edgeCD)
    store.setStatus('A', 'mastered')

    edgeAB.value // recomputes
    edgeCD.value // returns cached

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('setFocus() does NOT change resolveEdgeVariant result for same statuses', () => {
    const store = useNodeStatusStore()
    store.setStatus('X', 'mastered')
    store.setStatus('Y', 'completed')

    const edgeXY = computed(() =>
      spy(store.statuses['X'] ?? 'locked', store.statuses['Y'] ?? 'locked'),
    )

    const before = edgeXY.value
    spy.mockClear()

    // setFocus changes focus state but not node statuses
    useFocusState().setFocus('X', [])

    const after = edgeXY.value

    expect(before).toBe('mastered_to_completed')
    expect(after).toBe('mastered_to_completed')
    // computed was not dirtied → spy not called again
    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('batch update of 50 nodes → each adjacent edge recomputed at most once', () => {
    const store = useNodeStatusStore()
    const N = 50

    // Initialize all nodes as 'locked'
    for (let i = 0; i < N; i++) {
      store.setStatus(`n${i}`, 'locked')
    }

    // Create 49 per-edge computeds (linear chain)
    const edgeComputeds = Array.from({ length: N - 1 }, (_, i) =>
      computed(() =>
        spy(store.statuses[`n${i}`] ?? 'locked', store.statuses[`n${i + 1}`] ?? 'locked'),
      ),
    )

    // Prime all computeds
    edgeComputeds.forEach((e) => e.value)
    spy.mockClear()

    // Batch: update ALL 50 nodes to new statuses
    for (let i = 0; i < N; i++) {
      store.setStatus(`n${i}`, 'in_progress')
    }

    // Read all computeds — each should recompute exactly once
    edgeComputeds.forEach((e) => e.value)

    expect(spy).toHaveBeenCalledTimes(N - 1)
  })
})
