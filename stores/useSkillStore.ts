import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Skill, Category, Sport, SkillType } from '../db/schema'
import { UNLOCKED_PREREQ_STATUSES } from './useProgressStore'
import type { ProgressStatus } from './useProgressStore'
import type { ListSortBy } from '../utils/listSort'

export type ViewMode = 'graph-tb' | 'graph-lr' | 'list'
/** Values from db/schema sportEnum — single source of truth */
export type SportFilter = Sport
/** Values from db/schema SKILL_TYPES — single source of truth */
export type TypeFilter = SkillType
/** ProgressStatus + virtual 'unlocked' (locked-stored but all prereqs met) */
export type StatusFilter = ProgressStatus | 'unlocked'
export type { ListSortBy }

export const useSkillStore = defineStore('skills', () => {
  const skills = ref<Skill[]>([])
  const categories = ref<Category[]>([])

  const viewMode = ref<ViewMode>('graph-tb')
  const sportFilter = ref<Sport[]>([]) // empty = all
  const typeFilter = ref<SkillType[]>([]) // empty = all
  const categoryFilter = ref<string[]>([]) // empty = all
  const statusFilter = ref<StatusFilter[]>([]) // empty = all
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
      if (sportFilter.value.length > 0 && !sportFilter.value.includes(s.sport as Sport)) return false
      if (typeFilter.value.length > 0 && !typeFilter.value.includes(s.type as SkillType)) return false
      if (categoryFilter.value.length > 0 && !categoryFilter.value.includes(s.categoryId ?? '')) return false
      if (statusFilter.value.length > 0 && progressGetter.value) {
        const p = progressGetter.value(s.id)
        const matchesAny = statusFilter.value.some((sf) => {
          if (sf === 'unlocked') return p.status === 'locked' && isSkillUnlocked(s.id)
          return p.status === sf
        })
        if (!matchesAny) return false
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
