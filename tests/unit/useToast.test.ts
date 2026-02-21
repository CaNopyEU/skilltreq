import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToast } from '../../composables/useToast'

// useToast uses module-level state — access it via the composable and reset in beforeEach
describe('useToast', () => {
  let toast = useToast()

  beforeEach(() => {
    vi.useFakeTimers()
    // Clear any leftover toasts from previous tests
    toast.toasts.value.splice(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('helpers create toasts with correct type', () => {
    it('success()', () => {
      toast.success('Done')
      expect(toast.toasts.value).toHaveLength(1)
      expect(toast.toasts.value[0]).toMatchObject({ type: 'success', message: 'Done' })
    })

    it('error()', () => {
      toast.error('Oops')
      expect(toast.toasts.value[0]).toMatchObject({ type: 'error', message: 'Oops' })
    })

    it('info()', () => {
      toast.info('Note')
      expect(toast.toasts.value[0]).toMatchObject({ type: 'info', message: 'Note' })
    })

    it('warning()', () => {
      toast.warning('Watch out')
      expect(toast.toasts.value[0]).toMatchObject({ type: 'warning', message: 'Watch out' })
    })
  })

  it('each toast gets a unique id', () => {
    toast.success('A')
    toast.success('B')
    const ids = toast.toasts.value.map((t) => t.id)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('remove() deletes only the targeted toast', () => {
    toast.success('A')
    toast.success('B')
    const idA = toast.toasts.value[0].id
    toast.remove(idA)
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0].message).toBe('B')
  })

  it('remove() with unknown id does nothing', () => {
    toast.info('X')
    toast.remove(99999)
    expect(toast.toasts.value).toHaveLength(1)
  })

  describe('auto-dismiss', () => {
    it('removes toast after default 3 s', () => {
      toast.success('Gone soon')
      expect(toast.toasts.value).toHaveLength(1)
      vi.advanceTimersByTime(3000)
      expect(toast.toasts.value).toHaveLength(0)
    })

    it('removes toast after custom duration', () => {
      toast.info('Short', 1000)
      vi.advanceTimersByTime(999)
      expect(toast.toasts.value).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(toast.toasts.value).toHaveLength(0)
    })

    it('only removes the timed-out toast, not others', () => {
      toast.info('Short', 1000)
      toast.info('Long', 5000)
      vi.advanceTimersByTime(1000)
      expect(toast.toasts.value).toHaveLength(1)
      expect(toast.toasts.value[0].message).toBe('Long')
    })
  })

  it('multiple toasts stack in insertion order', () => {
    toast.success('First')
    toast.error('Second')
    toast.warning('Third')
    const messages = toast.toasts.value.map((t) => t.message)
    expect(messages).toEqual(['First', 'Second', 'Third'])
  })
})
