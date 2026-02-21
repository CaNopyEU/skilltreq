export type NodeStatus = 'locked' | 'in_progress' | 'completed' | 'mastered' | 'unlocked'
export type EdgeVariant =
  | 'locked_dashed'
  | 'locked_solid'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'mastered'
  | 'mastered_to_completed'

/**
 * Deterministic edge variant resolver.
 * Rules are evaluated in priority order.
 *
 * 'unlocked' is a computed display status (never stored) — a skill is unlocked
 * when all its prerequisites are completed or mastered.
 *
 * Priority:
 * 1. locked parent → dashed (regardless of child)
 * 2. locked child → solid (parent is not locked)
 * 3. unlocked child → available (parent completed/mastered, path is clear)
 * 4. mastered→mastered, mastered→completed, completed→completed — specific variants
 * 5. default → in_progress
 */
export function resolveEdgeVariant(parentStatus: NodeStatus, childStatus: NodeStatus): EdgeVariant {
  if (parentStatus === 'locked') return 'locked_dashed'
  if (childStatus === 'locked') return 'locked_solid'
  if (childStatus === 'unlocked') return 'available'
  if (parentStatus === 'mastered' && childStatus === 'mastered') return 'mastered'
  if (parentStatus === 'mastered' && childStatus === 'completed') return 'mastered_to_completed'
  if (parentStatus === 'completed' && childStatus === 'completed') return 'completed'
  return 'in_progress'
}
