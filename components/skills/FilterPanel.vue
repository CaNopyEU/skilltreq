<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import type { ViewMode } from '../../stores/useSkillStore'
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

const sportOptions: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'calisthenics', label: 'Calisthenics' },
  { value: 'acrobatics', label: 'Acrobatics' },
]

// ── Type ─────────────────────────────────────────────────────────────────────

const typeOptions: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'skill', label: 'Skills' },
  { value: 'transition', label: 'Transitions' },
]

// ── Status ───────────────────────────────────────────────────────────────────

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'locked', label: 'Locked' },
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'mastered', label: 'Mastered' },
]

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
      @update:model-value="skillStore.sportFilter = $event as 'all' | 'calisthenics' | 'acrobatics'"
    />

    <FilterCombo
      label="Type"
      :options="typeOptions"
      :model-value="skillStore.typeFilter"
      @update:model-value="skillStore.typeFilter = $event as 'all' | 'skill' | 'transition'"
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
      @update:model-value="skillStore.statusFilter = $event as typeof skillStore.statusFilter"
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
