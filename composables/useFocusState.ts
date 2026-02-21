import { ref } from 'vue'
import type { Skill } from '../db/schema'

const focusedSkillId = ref<string | null>(null)
const focusBranchIds = ref<Set<string>>(new Set())

function computeBranch(skillId: string, skills: Skill[]): Set<string> {
  const result = new Set<string>()
  result.add(skillId)

  // BFS upward: follow requires chains (ancestors)
  const queue = [skillId]
  while (queue.length > 0) {
    const current = queue.shift()!
    const skill = skills.find((s) => s.id === current)
    if (skill?.requires) {
      for (const reqId of skill.requires) {
        if (!result.has(reqId)) {
          result.add(reqId)
          queue.push(reqId)
        }
      }
    }
  }

  // Direct children: skills that require the focused skill
  for (const skill of skills) {
    if (skill.requires?.includes(skillId)) {
      result.add(skill.id)
    }
  }

  return result
}

export function useFocusState() {
  function setFocus(skillId: string | null, skills: Skill[]) {
    focusedSkillId.value = skillId
    if (!skillId) {
      focusBranchIds.value = new Set()
      return
    }
    focusBranchIds.value = computeBranch(skillId, skills)
  }

  function isInFocusBranch(nodeId: string): boolean {
    return focusBranchIds.value.has(nodeId)
  }

  return {
    focusedSkillId,
    focusBranchIds,
    setFocus,
    isInFocusBranch,
  }
}
