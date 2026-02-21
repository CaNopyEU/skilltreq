<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import type { Category, Skill } from '../../db/schema'
import { useProgressStore } from '../../stores/useProgressStore'
import { useSkillStore } from '../../stores/useSkillStore'
import { useFocusState } from '../../composables/useFocusState'

interface SkillNodeData {
  skill: Skill
}

const props = defineProps<NodeProps<SkillNodeData>>()

const progressStore = useProgressStore()
const skillStore = useSkillStore()
const { focusedSkillId, isInFocusBranch } = useFocusState()

const progress = computed(() => progressStore.getProgress(props.data.skill.id))
const category = computed<Category | undefined>(() =>
  skillStore.categories.find((c) => c.id === props.data.skill.categoryId),
)

const categoryHex = computed(() => category.value?.color ?? '#6b7280')

const statusKey = computed(() => `var(--status-${progress.value.status.replace('_', '-')})`)

// Background tinted by status colour — category shown only via the bottom bar
const bgColor = computed(() => `color-mix(in srgb, ${statusKey.value} 12%, var(--bg-surface))`)

// Progress fill uses status colour
const fillColor = computed(() => `color-mix(in srgb, ${statusKey.value} 35%, transparent)`)

const borderColor = computed(() => statusKey.value)

const isMastered = computed(() => progress.value.status === 'mastered')
const isFocused = computed(() => props.data.skill.id === focusedSkillId.value)
const isDimmed = computed(() => focusedSkillId.value !== null && !isInFocusBranch(props.data.skill.id))

const isLocked = computed(() => progress.value.status === 'locked')

const glowShadow = computed(() => {
  if (isFocused.value) return `var(--focus-shadow)`
  if (isLocked.value) return 'none'
  const v = `var(--status-${progress.value.status.replace('_', '-')}-glow)`
  return `0 0 0 1px ${v}, 0 0 14px ${v}, inset 0 0 8px ${v}`
})

const nodeOpacity = computed(() => {
  if (isDimmed.value) return 0.55
  if (isLocked.value) return 0.6
  return 1
})

const totalSteps = computed(() => props.data.skill.progressions?.length ?? 0)
const fillWidth = computed(() => {
  if (totalSteps.value === 0) return '0%'
  const pct = Math.min(100, (progress.value.current_step / totalSteps.value) * 100)
  return `${pct}%`
})

const categoryIcon = computed(() => {
  const icons: Record<string, string> = {
    pull: '↑',
    push: '↓',
    legs: '⟳',
    core: '◎',
    rings: '○',
  }
  return category.value ? (icons[category.value.id] ?? '·') : ''
})
</script>

<template>
  <div
    class="skill-node"
    :class="{
      'skill-node--focused': isFocused,
      'skill-node--dimmed': isDimmed,
      'skill-node--mastered': isMastered,
    }"
    :style="{ background: bgColor, borderColor, boxShadow: glowShadow, opacity: nodeOpacity }"
  >
    <Handle type="target" :position="Position.Top" />

    <div v-if="totalSteps > 0" class="skill-node__fill" :style="{ width: fillWidth, backgroundColor: fillColor }" />

    <span class="skill-node__cat-icon" :style="{ color: categoryHex }">{{ categoryIcon }}</span>
    <div class="skill-node__name">{{ data.skill.abbr || data.skill.name }}</div>
    <div class="skill-node__badge">{{ data.skill.difficulty }}</div>

    <div class="skill-node__category-bar" :style="{ backgroundColor: categoryHex }" />

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.skill-node {
  width: 160px;
  height: 60px;
  border: 2px solid;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 0 24px 0 8px;
  box-sizing: border-box;
  overflow: hidden;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
}

.skill-node--focused {
  transform: scale(var(--focus-scale));
  z-index: 10;
}

.skill-node--dimmed {
  opacity: 0.55;
}

.skill-node--mastered {
  /* border-image breaks border-radius — gold border colour handled by borderColor computed */
  border-width: 2px;
}

.skill-node--mastered .skill-node__name {
  background: linear-gradient(90deg, #f59e0b 0%, #fde68a 50%, #f59e0b 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
}

.skill-node__fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transition: width 0.35s ease;
  pointer-events: none;
  z-index: 0;
}

.skill-node__cat-icon {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  opacity: 0.65;
  z-index: 1;
  pointer-events: none;
  line-height: 1;
}

.skill-node__name {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--node-text);
}

.skill-node__badge {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: 6px;
  background: var(--node-badge-bg);
  border-radius: 4px;
  font-size: 10px;
  padding: 1px 4px;
  color: var(--node-badge-text);
  font-weight: 600;
}

.skill-node__category-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 2;
  pointer-events: none;
}

/* Hide handle dots — Vue Flow still uses them for edge positioning internally */
:deep(.vue-flow__handle) {
  opacity: 0;
  pointer-events: none;
}
</style>
