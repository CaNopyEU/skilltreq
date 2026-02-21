import { defineStore } from 'pinia'
import type { Skill, Category } from '../db/schema'

export type ViewMode = 'graph-tb' | 'graph-lr' | 'list'
export type StatusFilter = 'all' | 'locked' | 'in_progress' | 'completed' | 'mastered'

export const useSkillStore = defineStore('skills', () => {
  const skills = ref<Skill[]>([])
  const categories = ref<Category[]>([])

  const viewMode = ref<ViewMode>('graph-tb')
  const sportFilter = ref<'all' | 'calisthenics' | 'acrobatics'>('all')
  const categoryFilter = ref<string[]>([]) // empty = all
  const statusFilter = ref<StatusFilter>('all')

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
      if (categoryFilter.value.length > 0 && !categoryFilter.value.includes(s.categoryId ?? '')) return false
      if (statusFilter.value !== 'all' && progressGetter.value) {
        const p = progressGetter.value(s.id)
        if (p.status !== statusFilter.value) return false
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

  return {
    skills,
    categories,
    viewMode,
    sportFilter,
    categoryFilter,
    statusFilter,
    selectedSkillId,
    selectedSkill,
    filteredSkills,
    fetchAll,
    selectSkill,
    setProgressGetter,
  }
})
