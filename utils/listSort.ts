export type ListSortBy = 'default' | 'difficulty-asc' | 'difficulty-desc' | 'status' | 'progress'

/** Status priority for sorting — higher value = higher priority (sorted first) */
export const STATUS_PRIORITY: Record<string, number> = {
  mastered: 5,
  completed: 4,
  in_progress: 3,
  unlocked: 2,
  locked: 1,
}

/**
 * Comparator for sorting by status priority (highest status first).
 * Usage: array.sort((a, b) => compareByStatus(priorityOfA, priorityOfB))
 */
export function compareByStatus(aPriority: number, bPriority: number): number {
  return bPriority - aPriority
}

/**
 * Comparator for sorting by numeric difficulty.
 * 'asc' = easiest first, 'desc' = hardest first.
 */
export function compareByDifficulty(a: number, b: number, direction: 'asc' | 'desc'): number {
  return direction === 'asc' ? a - b : b - a
}

/**
 * Comparator for sorting by progress fill percentage (most progress first).
 */
export function compareByProgress(aFill: number, bFill: number): number {
  return bFill - aFill
}
