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
  border: 1px solid #e5e7eb;
}

.skill-list__group-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  border: none;
  border-left: 4px solid;
  cursor: pointer;
  font-weight: 600;
  text-align: left;
}

.skill-list__group-header:hover {
  background: #f3f4f6;
}

.skill-list__count {
  margin-left: auto;
  font-size: 12px;
  color: #6b7280;
}

.skill-list__chevron {
  font-size: 10px;
  color: #9ca3af;
}

.skill-list__items {
  background: white;
}

.skill-list__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  border-top: 1px solid #f3f4f6;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.skill-list__item:hover {
  background: #f9fafb;
}

.skill-list__name {
  flex: 1;
  font-size: 14px;
}

.skill-list__status {
  font-size: 14px;
}

.skill-list__diff {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
}
</style>
