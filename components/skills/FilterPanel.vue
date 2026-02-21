<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import type { ViewMode } from '../../stores/useSkillStore'

const skillStore = useSkillStore()

const viewOptions: { value: ViewMode; label: string }[] = [
  { value: 'graph-tb', label: 'Graph – Top Down' },
  { value: 'graph-lr', label: 'Graph – Left Right' },
  { value: 'list', label: 'List' },
]

function toggleCategory(id: string) {
  const current = skillStore.categoryFilter
  if (current.includes(id)) {
    skillStore.categoryFilter = current.filter((c) => c !== id)
  } else {
    skillStore.categoryFilter = [...current, id]
  }
}
</script>

<template>
  <div class="filter-panel">
    <div class="filter-panel__group">
      <label class="filter-panel__label">View</label>
      <select
        class="filter-panel__select"
        :value="skillStore.viewMode"
        @change="skillStore.viewMode = ($event.target as HTMLSelectElement).value as ViewMode"
      >
        <option v-for="opt in viewOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <div class="filter-panel__group">
      <label class="filter-panel__label">Sport</label>
      <div class="filter-panel__pills">
        <button
          v-for="sport in ['all', 'calisthenics', 'acrobatics'] as const"
          :key="sport"
          class="filter-panel__pill"
          :class="{ 'filter-panel__pill--active': skillStore.sportFilter === sport }"
          @click="skillStore.sportFilter = sport"
        >
          {{ sport === 'all' ? 'All' : sport.charAt(0).toUpperCase() + sport.slice(1) }}
        </button>
      </div>
    </div>

    <div class="filter-panel__group">
      <label class="filter-panel__label">Category</label>
      <div class="filter-panel__checkboxes">
        <label class="filter-panel__check">
          <input
            type="checkbox"
            :checked="skillStore.categoryFilter.length === 0"
            @change="skillStore.categoryFilter = []"
          />
          All
        </label>
        <label v-for="cat in skillStore.categories" :key="cat.id" class="filter-panel__check">
          <input
            type="checkbox"
            :checked="skillStore.categoryFilter.includes(cat.id)"
            @change="toggleCategory(cat.id)"
          />
          <span :style="{ color: cat.color }">●</span>
          {{ cat.name }}
        </label>
      </div>
    </div>

    <div class="filter-panel__group">
      <label class="filter-panel__label">Status</label>
      <div class="filter-panel__pills">
        <button
          v-for="status in ['all', 'locked', 'in_progress', 'completed', 'mastered'] as const"
          :key="status"
          class="filter-panel__pill"
          :class="{ 'filter-panel__pill--active': skillStore.statusFilter === status }"
          @click="skillStore.statusFilter = status"
        >
          {{ status === 'all' ? 'All' : status.replace('_', ' ') }}
        </button>
      </div>
    </div>

    <ThemeToggle class="filter-panel__theme" />
  </div>
</template>

<style scoped>
.filter-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.filter-panel__group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-panel__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  white-space: nowrap;
}

.filter-panel__select {
  padding: 4px 8px;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-page);
  color: var(--text-primary);
  cursor: pointer;
}

.filter-panel__pills {
  display: flex;
  gap: 4px;
}

.filter-panel__pill {
  padding: 3px 10px;
  border: 1px solid var(--border-muted);
  border-radius: 20px;
  font-size: 12px;
  background: var(--bg-page);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
}

.filter-panel__pill:hover {
  background: var(--bg-hover);
}

.filter-panel__pill--active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.filter-panel__checkboxes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-panel__check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.filter-panel__theme {
  margin-left: auto;
}
</style>
