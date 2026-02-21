<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import type { ViewMode, SportFilter, TypeFilter, StatusFilter } from '../../stores/useSkillStore'
import type { FilterOption } from '../FilterCombo.vue'

const skillStore = useSkillStore()
const progressStore = useProgressStore()

// ── View mode ────────────────────────────────────────────────────────────────

const viewOptions: { value: ViewMode; label: string }[] = [
  { value: 'graph-tb', label: 'Graph – Top Down' },
  { value: 'graph-lr', label: 'Graph – Left Right' },
  { value: 'list', label: 'List' },
]

// ── Sport ────────────────────────────────────────────────────────────────────

const sportOptions = computed<FilterOption[]>(() => {
  const entries = [
    { value: 'calisthenics-beginner', label: 'Calisthenics Beginner' },
    { value: 'calisthenics-intermediate', label: 'Calisthenics Intermediate' },
    { value: 'calisthenics-expert', label: 'Calisthenics Expert' },
  ] as const
  return entries.map(({ value, label }) => {
    const group = skillStore.skills.filter((s) => s.sport === value)
    const mastered = group.filter((s) => progressStore.getProgress(s.id).status === 'mastered').length
    const completed = group.filter((s) => {
      const st = progressStore.getProgress(s.id).status
      return st === 'completed' || st === 'mastered'
    }).length
    const total = group.length
    const meta = total > 0 ? `${completed}/${total}${mastered > 0 ? ` ★${mastered}` : ''}` : undefined
    return { value, label, meta }
  })
})

// ── Type ─────────────────────────────────────────────────────────────────────

const typeOptions = computed<FilterOption[]>(() => {
  const entries = [
    { value: 'skill', label: 'Skills' },
    { value: 'transition', label: 'Transitions' },
  ] as const
  return entries.map(({ value, label }) => {
    const group = skillStore.skills.filter((s) => s.type === value)
    const mastered = group.filter((s) => progressStore.getProgress(s.id).status === 'mastered').length
    const completed = group.filter((s) => {
      const st = progressStore.getProgress(s.id).status
      return st === 'completed' || st === 'mastered'
    }).length
    const total = group.length
    const meta = total > 0 ? `${completed}/${total}${mastered > 0 ? ` ★${mastered}` : ''}` : undefined
    return { value, label, meta }
  })
})

// ── Status ───────────────────────────────────────────────────────────────────

const statusOptions = computed<FilterOption[]>(() => {
  const entries = [
    { value: 'locked', label: 'Locked' },
    { value: 'unlocked', label: 'Unlocked' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'mastered', label: 'Mastered' },
  ] as const
  const total = skillStore.skills.length
  return entries.map(({ value, label }) => {
    let count = 0
    if (value === 'unlocked') {
      count = skillStore.skills.filter(
        (s) => progressStore.getProgress(s.id).status === 'locked' && skillStore.isSkillUnlocked(s.id),
      ).length
    } else {
      count = skillStore.skills.filter((s) => progressStore.getProgress(s.id).status === value).length
    }
    const meta = total > 0 ? String(count) : undefined
    return { value, label, meta }
  })
})

// ── Category — with completion tracker ───────────────────────────────────────

const categoryOptions = computed<FilterOption[]>(() =>
  skillStore.categories.map((cat) => {
    const catSkills = skillStore.skills.filter((s) => s.categoryId === cat.id)
    const mastered = catSkills.filter((s) => progressStore.getProgress(s.id).status === 'mastered').length
    const completed = catSkills.filter((s) => {
      const st = progressStore.getProgress(s.id).status
      return st === 'completed' || st === 'mastered'
    }).length
    const total = catSkills.length

    const meta = total > 0
      ? `${completed}/${total}${mastered > 0 ? ` ★${mastered}` : ''}`
      : undefined

    return { value: cat.id, label: cat.name, color: cat.color, meta }
  }),
)
</script>

<template>
  <div class="filter-panel">
    <!-- View mode — custom select, not a filter -->
    <div class="filter-panel__view">
      <label class="filter-panel__view-label">View</label>
      <SelectBox
        :options="viewOptions"
        :model-value="skillStore.viewMode"
        @update:model-value="skillStore.viewMode = $event as ViewMode"
      />
    </div>

    <div class="filter-panel__divider" />

    <!-- Filters -->
    <FilterCombo
      label="Sport"
      :options="sportOptions"
      :model-value="skillStore.sportFilter"
      :multi="true"
      @update:model-value="skillStore.sportFilter = $event as SportFilter[]"
    />

    <FilterCombo
      label="Type"
      :options="typeOptions"
      :model-value="skillStore.typeFilter"
      :multi="true"
      @update:model-value="skillStore.typeFilter = $event as TypeFilter[]"
    />

    <FilterCombo
      label="Category"
      :options="categoryOptions"
      :model-value="skillStore.categoryFilter"
      :multi="true"
      @update:model-value="skillStore.categoryFilter = $event as string[]"
    />

    <FilterCombo
      label="Status"
      :options="statusOptions"
      :model-value="skillStore.statusFilter"
      :multi="true"
      @update:model-value="skillStore.statusFilter = $event as StatusFilter[]"
    />

    <ThemeToggle class="filter-panel__theme" />
  </div>
</template>

<style scoped>
.filter-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

/* View mode selector */
.filter-panel__view {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-panel__view-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  white-space: nowrap;
}


.filter-panel__divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  flex-shrink: 0;
}

.filter-panel__theme {
  margin-left: auto;
}
</style>
