<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import type { ProgressStatus } from '../../stores/useProgressStore'
import type { ListSortBy } from '../../utils/listSort'
import { STATUS_PRIORITY, compareByStatus, compareByDifficulty, compareByProgress } from '../../utils/listSort'

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
  const progress = progressStore.getProgress(skillId)
  if (totalSteps === 0) {
    // Edge case: no progressions defined but skill is completed/mastered → show full fill
    return progress.status === 'completed' || progress.status === 'mastered' ? 100 : 0
  }
  return Math.min(100, (progress.current_step / totalSteps) * 100)
}

/** Returns effective display status, treating locked+unlocked prereqs as 'unlocked' */
function getEffectiveStatus(skillId: string): string {
  const status = progressStore.getProgress(skillId).status
  if (status === 'locked' && skillStore.isSkillUnlocked(skillId)) return 'unlocked'
  return status
}

/** Status icon color — pure status CSS variable, no category mixing. */
function getStatusIconStyle(skillId: string) {
  const effectiveStatus = getEffectiveStatus(skillId)
  const cssVar = effectiveStatus === 'unlocked'
    ? 'var(--status-unlocked)'
    : `var(--status-${effectiveStatus.replace('_', '-')})`
  return { color: cssVar }
}

/**
 * Left border for completed/mastered items — category accent, transparent otherwise
 * (always 3px to avoid layout shift).
 */
function getItemBorderLeft(skillId: string, categoryColor: string): string {
  const { status } = progressStore.getProgress(skillId)
  const isComplete = status === 'completed' || status === 'mastered'
  return `3px solid ${isComplete ? hexToRgba(categoryColor, 0.5) : 'transparent'}`
}

function sortSkillsInGroup(skills: typeof skillStore.filteredSkills) {
  const sortBy = skillStore.listSortBy
  if (sortBy === 'default') return skills
  return [...skills].sort((a, b) => {
    if (sortBy === 'difficulty-asc') return compareByDifficulty(a.difficulty, b.difficulty, 'asc')
    if (sortBy === 'difficulty-desc') return compareByDifficulty(a.difficulty, b.difficulty, 'desc')
    if (sortBy === 'status') {
      return compareByStatus(
        STATUS_PRIORITY[getEffectiveStatus(a.id)] ?? 0,
        STATUS_PRIORITY[getEffectiveStatus(b.id)] ?? 0,
      )
    }
    if (sortBy === 'progress') {
      return compareByProgress(
        getProgressFill(a.id, a.progressions?.length ?? 0),
        getProgressFill(b.id, b.progressions?.length ?? 0),
      )
    }
    return 0
  })
}

const groupedSkills = computed(() => {
  const map = new Map<
    string,
    {
      category: (typeof skillStore.categories)[0]
      skills: typeof skillStore.filteredSkills
      completedCount: number
      masteredCount: number
      totalCount: number
    }
  >()

  for (const cat of skillStore.categories) {
    const catSkills = skillStore.filteredSkills.filter((s) => s.categoryId === cat.id)
    if (catSkills.length === 0) continue

    // Tracker uses ALL skills in the category, not just the currently filtered set
    const allCatSkills = skillStore.skills.filter((s) => s.categoryId === cat.id)
    const completedCount = allCatSkills.filter((s) => {
      const st = progressStore.getProgress(s.id).status
      return st === 'completed' || st === 'mastered'
    }).length
    const masteredCount = allCatSkills.filter(
      (s) => progressStore.getProgress(s.id).status === 'mastered',
    ).length

    map.set(cat.id, {
      category: cat,
      skills: sortSkillsInGroup(catSkills),
      completedCount,
      masteredCount,
      totalCount: allCatSkills.length,
    })
  }

  // Skills without a category
  const uncategorizedFiltered = skillStore.filteredSkills.filter((s) => !s.categoryId)
  if (uncategorizedFiltered.length > 0) {
    const uncategorizedAll = skillStore.skills.filter((s) => !s.categoryId)
    const completedCount = uncategorizedAll.filter((s) => {
      const st = progressStore.getProgress(s.id).status
      return st === 'completed' || st === 'mastered'
    }).length
    const masteredCount = uncategorizedAll.filter(
      (s) => progressStore.getProgress(s.id).status === 'mastered',
    ).length

    map.set('__none__', {
      category: { id: '__none__', name: 'Other', color: '#6b7280', description: null },
      skills: sortSkillsInGroup(uncategorizedFiltered),
      completedCount,
      masteredCount,
      totalCount: uncategorizedAll.length,
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

const statusIconName: Record<ProgressStatus, 'lock-closed' | 'bolt' | 'check-circle' | 'star'> = {
  locked: 'lock-closed',
  in_progress: 'bolt',
  completed: 'check-circle',
  mastered: 'star',
}

const sortOptions: { value: ListSortBy; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'status', label: 'Status' },
  { value: 'progress', label: 'Progress' },
  { value: 'difficulty-asc', label: 'Diff ↑' },
  { value: 'difficulty-desc', label: 'Diff ↓' },
]
</script>

<template>
  <div class="skill-list">
    <!-- Sort bar -->
    <div class="skill-list__sort-bar">
      <span class="skill-list__sort-label">Sort</span>
      <div class="skill-list__sort-pills">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          type="button"
          class="skill-list__sort-pill"
          :class="{ 'skill-list__sort-pill--active': skillStore.listSortBy === opt.value }"
          @click="skillStore.listSortBy = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-for="group in groupedSkills" :key="group.category.id" class="skill-list__group">
      <!-- Group header with tracker + mini progress bar -->
      <button
        class="skill-list__group-header"
        :style="{ borderLeftColor: group.category.color }"
        @click="toggleCategory(group.category.id)"
      >
        <div class="skill-list__group-row">
          <span class="skill-list__group-name">{{ group.category.name }}</span>
          <span class="skill-list__tracker">
            {{ group.completedCount }}/{{ group.totalCount
            }}<span v-if="group.masteredCount > 0" class="skill-list__tracker-star"> ★{{ group.masteredCount }}</span>
          </span>
          <span class="skill-list__count">{{ group.skills.length }}</span>
          <HIcon
            :name="openCategories.has(group.category.id) ? 'chevron-up' : 'chevron-down'"
            :size="12"
            class="skill-list__chevron"
          />
        </div>
        <!-- Mini progress bar (completed+mastered / all) -->
        <div class="skill-list__mini-bar-track">
          <div
            class="skill-list__mini-bar-fill"
            :style="{
              width: `${group.totalCount > 0 ? (group.completedCount / group.totalCount) * 100 : 0}%`,
              backgroundColor: group.category.color,
            }"
          />
        </div>
      </button>

      <!-- Accordion — CSS Grid trick for smooth height animation -->
      <div
        class="skill-list__items"
        :class="{ 'is-open': openCategories.has(group.category.id) }"
      >
        <div class="skill-list__items-inner">
          <button
            v-for="skill in group.skills"
            :key="skill.id"
            class="skill-list__item"
            :style="{ borderLeft: getItemBorderLeft(skill.id, group.category.color) }"
            @click="emit('skill-click', skill.id)"
          >
            <div
              v-if="getProgressFill(skill.id, skill.progressions?.length ?? 0) > 0"
              class="skill-list__fill"
              :style="{
                width: `${getProgressFill(skill.id, skill.progressions?.length ?? 0)}%`,
                backgroundColor: hexToRgba(group.category.color, 0.3),
              }"
            />
            <span
              class="skill-list__status"
              :style="getStatusIconStyle(skill.id)"
            >
              <HIcon
                :name="
                  getEffectiveStatus(skill.id) === 'unlocked'
                    ? 'lock-open'
                    : statusIconName[progressStore.getProgress(skill.id).status]
                "
                :size="14"
              />
            </span>
            <span class="skill-list__name">{{ skill.name }}</span>
            <span class="skill-list__diff">D{{ skill.difficulty }}</span>
          </button>
        </div>
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

/* ── Sort bar ── */
.skill-list__sort-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px 8px;
}

.skill-list__sort-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  white-space: nowrap;
}

.skill-list__sort-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-list__sort-pill {
  padding: 2px 8px;
  border: 1px solid var(--border-muted);
  border-radius: 12px;
  font-size: 12px;
  background: var(--bg-page);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}

.skill-list__sort-pill:hover {
  background: var(--bg-hover);
}

.skill-list__sort-pill--active {
  border-color: #3b82f6;
  color: var(--text-primary);
  background: rgba(59, 130, 246, 0.08);
}

/* ── Group ── */
.skill-list__group {
  margin-bottom: 4px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}

/* ── Group header ── */
.skill-list__group-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: none;
  border-left: 4px solid;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
}

.skill-list__group-header:hover {
  background: var(--bg-hover);
}

.skill-list__group-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-weight: 600;
}

.skill-list__group-name {
  flex: 1;
  font-size: 14px;
}

.skill-list__tracker {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}

.skill-list__tracker-star {
  color: #eab308;
  font-weight: 600;
}

.skill-list__count {
  font-size: 11px;
  color: var(--text-faint);
  background: var(--bg-muted);
  border-radius: 10px;
  padding: 1px 6px;
  font-weight: 400;
}

.skill-list__chevron {
  color: var(--text-faint);
}

/* Mini progress bar */
.skill-list__mini-bar-track {
  height: 2px;
  width: 100%;
  background: var(--bg-muted);
}

.skill-list__mini-bar-fill {
  height: 100%;
  opacity: 0.7;
  transition: width 0.35s ease;
}

/* ── Accordion (CSS Grid trick) ── */
.skill-list__items {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 220ms ease;
}

.skill-list__items.is-open {
  grid-template-rows: 1fr;
}

.skill-list__items-inner {
  min-height: 0;
  overflow: hidden;
  background: var(--bg-page);
}

/* ── Skill item ── */
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
  /* Color is set via inline style (category-mixed) */
}

.skill-list__diff {
  font-size: 11px;
  color: var(--text-faint);
  font-weight: 600;
  position: relative;
  z-index: 1;
}
</style>
