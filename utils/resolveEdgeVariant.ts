export type NodeStatus = 'locked' | 'in_progress' | 'completed' | 'mastered'
export type EdgeVariant =
  | 'locked_dashed'
  | 'locked_solid'
  | 'in_progress'
  | 'completed'
  | 'mastered'
  | 'mastered_to_completed'

/**
 * Deterministic edge variant resolver.
 * Rules are evaluated in priority order and cover all 16 NodeStatus combinations.
 */
export function resolveEdgeVariant(parentStatus: NodeStatus, childStatus: NodeStatus): EdgeVariant {
  if (parentStatus === 'locked') return 'locked_dashed'
  if (parentStatus === 'in_progress' && childStatus === 'locked') return 'locked_solid'
  if (parentStatus === 'mastered' && childStatus === 'mastered') return 'mastered'
  if (parentStatus === 'mastered' && childStatus === 'completed') return 'mastered_to_completed'
  if (parentStatus === 'completed' && childStatus === 'completed') return 'completed'
  return 'in_progress'
}
