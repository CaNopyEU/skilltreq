import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '../../stores/useProgressStore'

describe('useProgressStore.setStatus', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('completed → sets current_step to totalSteps (all progressions checked)', () => {
    const store = useProgressStore()
    store.setStatus('skill-a', 'in_progress', 5)
    store.setStep('skill-a', 2)

    store.setStatus('skill-a', 'completed', 5)

    expect(store.getProgress('skill-a').status).toBe('completed')
    expect(store.getProgress('skill-a').current_step).toBe(5)
  })

  it('mastered → sets current_step to totalSteps', () => {
    const store = useProgressStore()
    store.setStatus('skill-b', 'mastered', 4)

    expect(store.getProgress('skill-b').status).toBe('mastered')
    expect(store.getProgress('skill-b').current_step).toBe(4)
  })

  it('locked → resets current_step to 0', () => {
    const store = useProgressStore()
    store.setStatus('skill-c', 'in_progress', 3)
    store.setStep('skill-c', 2)

    store.setStatus('skill-c', 'locked', 3)

    expect(store.getProgress('skill-c').status).toBe('locked')
    expect(store.getProgress('skill-c').current_step).toBe(0)
  })

  it('in_progress → preserves current_step', () => {
    const store = useProgressStore()
    store.setStatus('skill-d', 'in_progress', 6)
    store.setStep('skill-d', 3)

    store.setStatus('skill-d', 'in_progress', 6)

    expect(store.getProgress('skill-d').current_step).toBe(3)
  })

  it('note is preserved across status changes', () => {
    const store = useProgressStore()
    store.setStatus('skill-e', 'in_progress', 3)
    store.setNote('skill-e', 'my note')

    store.setStatus('skill-e', 'completed', 3)

    expect(store.getProgress('skill-e').note).toBe('my note')
  })
})
