import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Skill, Category } from '../db/schema'
import { UNLOCKED_PREREQ_STATUSES } from './useProgressStore'
import type { ListSortBy } from '../utils/listSort'

export type ViewMode = 'graph-tb' | 'graph-lr' | 'list'
export type StatusFilter = 'all' | 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'mastered'
export type TypeFilter = 'all' | 'skill' | 'transition'
export type { ListSortBy }

export const useSkillStore = defineStore('skills', () => {
  const skills = ref<Skill[]>([])
  const categories = ref<Category[]>([])

  const viewMode = ref<ViewMode>('graph-tb')
  const sportFilter = ref<'all' | 'calisthenics' | 'acrobatics'>('all')
  const typeFilter = ref<TypeFilter>('all')
  const categoryFilter = ref<string[]>([]) // empty = all
  const statusFilter = ref<StatusFilter>('all')
  const listSortBy = ref<ListSortBy>('default')

  const selectedSkillId = ref<string | null>(null)

  async function fetchAll() {
    const [skillsData, categoriesData] = await Promise.all([
      $fetch<Skill[]>('/api/skills'),
      $fetch<Category[]>('/api/categories'),
    ])
    skills.value = skillsData
    categories.value = categoriesData
  }

  // Set by the page after progressStore is available, to avoid circular store imports
  const progressGetter = ref<((id: string) => { status: string }) | null>(null)

  function setProgressGetter(fn: (id: string) => { status: string }) {
    progressGetter.value = fn
  }

  const filteredSkills = computed(() => {
    return skills.value.filter((s) => {
      if (sportFilter.value !== 'all' && s.sport !== sportFilter.value) return false
      if (typeFilter.value !== 'all' && s.type !== typeFilter.value) return false
      if (categoryFilter.value.length > 0 && !categoryFilter.value.includes(s.categoryId ?? '')) return false
      if (statusFilter.value !== 'all' && progressGetter.value) {
        const p = progressGetter.value(s.id)
        if (statusFilter.value === 'unlocked') {
          // unlocked = stored as locked but all prerequisites are met
          if (!(p.status === 'locked' && isSkillUnlocked(s.id))) return false
        } else if (p.status !== statusFilter.value) {
          return false
        }
      }
      return true
    })
  })

  const selectedSkill = computed(() =>
    selectedSkillId.value ? skills.value.find((s) => s.id === selectedSkillId.value) ?? null : null,
  )

  function selectSkill(id: string | null) {
    selectedSkillId.value = id
  }

  /**
   * Returns true when all prerequisites of the given skill are completed or mastered.
   * Skills with no prerequisites are always unlocked.
   * Returns false if progressGetter is not yet set.
   */
  function isSkillUnlocked(skillId: string): boolean {
    const skill = skills.value.find((s) => s.id === skillId)
    if (!skill) return false
    if (!skill.requires || skill.requires.length === 0) return true
    if (!progressGetter.value) return false
    return skill.requires.every((reqId) =>
      (UNLOCKED_PREREQ_STATUSES as readonly string[]).includes(progressGetter.value!(reqId).status),
    )
  }

  return {
    skills,
    categories,
    viewMode,
    sportFilter,
    typeFilter,
    categoryFilter,
    statusFilter,
    listSortBy,
    selectedSkillId,
    selectedSkill,
    filteredSkills,
    fetchAll,
    selectSkill,
    setProgressGetter,
    isSkillUnlocked,
  }
})
