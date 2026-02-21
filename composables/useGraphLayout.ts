import dagre from '@dagrejs/dagre'
import { Position } from '@vue-flow/core'
import type { Skill } from '../db/schema'

export interface GraphNode {
  id: string
  type: string
  position: { x: number; y: number }
  sourcePosition: Position
  targetPosition: Position
  data: { skill: Skill }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
}

export function useGraphLayout() {
  function buildLayout(skills: Skill[], direction: 'TB' | 'LR'): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 })
    g.setDefaultEdgeLabel(() => ({}))

    const NODE_W = 160
    const NODE_H = 60

    for (const skill of skills) {
      g.setNode(skill.id, { width: NODE_W, height: NODE_H })
    }

    const skillIds = new Set(skills.map((s) => s.id))
    const edges: GraphEdge[] = []

    for (const skill of skills) {
      for (const reqId of skill.requires ?? []) {
        if (skillIds.has(reqId)) {
          g.setEdge(reqId, skill.id)
          edges.push({ id: `${reqId}->${skill.id}`, source: reqId, target: skill.id, type: 'skill-edge' })
        }
      }
    }

    dagre.layout(g)

    const sourcePos = direction === 'LR' ? Position.Right : Position.Bottom
    const targetPos = direction === 'LR' ? Position.Left : Position.Top

    const nodes: GraphNode[] = skills.map((skill) => {
      const node = g.node(skill.id)
      return {
        id: skill.id,
        type: 'skill',
        position: { x: node.x - NODE_W / 2, y: node.y - NODE_H / 2 },
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        data: { skill },
      }
    })

    return { nodes, edges }
  }

  return { buildLayout }
}
