<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import type { ProgressStatus } from '../../stores/useProgressStore'

const emit = defineEmits<{
  'skill-click': [skillId: string]
}>()

const skillStore = useSkillStore()
const progressStore = useProgressStore()

const openCategories = ref<Set<string>>(new Set())

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getProgressFill(skillId: string, totalSteps: number): number {
  if (totalSteps === 0) return 0
  const step = progressStore.getProgress(skillId).current_step
  return Math.min(100, (step / totalSteps) * 100)
}

const groupedSkills = computed(() => {
  const map = new Map<string, { category: (typeof skillStore.categories)[0]; skills: typeof skillStore.filteredSkills }>()

  for (const cat of skillStore.categories) {
    const catSkills = skillStore.filteredSkills.filter((s) => s.categoryId === cat.id)
    if (catSkills.length > 0) {
      map.set(cat.id, { category: cat, skills: catSkills })
    }
  }

  // Skills without category
  const uncategorized = skillStore.filteredSkills.filter((s) => !s.categoryId)
  if (uncategorized.length > 0) {
    map.set('__none__', {
      category: { id: '__none__', name: 'Other', color: '#6b7280', description: null },
      skills: uncategorized,
    })
  }

  return [...map.values()]
})

function toggleCategory(id: string) {
  if (openCategories.value.has(id)) {
    openCategories.value.delete(id)
  } else {
    openCategories.value.add(id)
  }
}

const statusLabels: Record<ProgressStatus, string> = {
  locked: '🔒',
  in_progress: '🔵',
  unlocked: '✅',
  mastered: '⭐',
}
</script>

<template>
  <div class="skill-list">
    <div v-for="group in groupedSkills" :key="group.category.id" class="skill-list__group">
      <button
        class="skill-list__group-header"
        :style="{ borderLeftColor: group.category.color }"
        @click="toggleCategory(group.category.id)"
      >
        <span>{{ group.category.name }}</span>
        <span class="skill-list__count">{{ group.skills.length }}</span>
        <span class="skill-list__chevron">{{ openCategories.has(group.category.id) ? '▲' : '▼' }}</span>
      </button>

      <div v-if="openCategories.has(group.category.id)" class="skill-list__items">
        <button
          v-for="skill in group.skills"
          :key="skill.id"
          class="skill-list__item"
          @click="emit('skill-click', skill.id)"
        >
          <div
            v-if="(skill.progressions?.length ?? 0) > 0"
            class="skill-list__fill"
            :style="{
              width: `${getProgressFill(skill.id, skill.progressions?.length ?? 0)}%`,
              backgroundColor: hexToRgba(group.category.color, 0.3),
            }"
          />
          <span class="skill-list__status">
            {{ statusLabels[progressStore.getProgress(skill.id).status] }}
          </span>
          <span class="skill-list__name">{{ skill.name }}</span>
          <span class="skill-list__diff">D{{ skill.difficulty }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-list {
  overflow-y: auto;
  height: 100%;
  padding: 8px;
}

.skill-list__group {
  margin-bottom: 4px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.skill-list__group-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border: none;
  border-left: 4px solid;
  cursor: pointer;
  font-weight: 600;
  text-align: left;
  color: var(--text-primary);
}

.skill-list__group-header:hover {
  background: var(--bg-hover);
}

.skill-list__count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
}

.skill-list__chevron {
  font-size: 10px;
  color: var(--text-faint);
}

.skill-list__items {
  background: var(--bg-page);
}

.skill-list__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  border-top: 1px solid var(--bg-muted);
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
}

.skill-list__fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transition: width 0.35s ease;
  pointer-events: none;
  z-index: 0;
}

.skill-list__item:hover {
  background: var(--bg-surface);
}

.skill-list__name {
  flex: 1;
  font-size: 14px;
  position: relative;
  z-index: 1;
}

.skill-list__status {
  font-size: 14px;
  position: relative;
  z-index: 1;
}

.skill-list__diff {
  font-size: 11px;
  color: var(--text-faint);
  font-weight: 600;
  position: relative;
  z-index: 1;
}
</style>
