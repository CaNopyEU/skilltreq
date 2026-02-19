<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import type { Category, Skill } from '../../db/schema'
import { useProgressStore } from '../../stores/useProgressStore'
import { useSkillStore } from '../../stores/useSkillStore'

interface SkillNodeData {
  skill: Skill
}

const props = defineProps<NodeProps<SkillNodeData>>()

const progressStore = useProgressStore()
const skillStore = useSkillStore()

const progress = computed(() => progressStore.getProgress(props.data.skill.id))
const category = computed<Category | undefined>(() =>
  skillStore.categories.find((c) => c.id === props.data.skill.categoryId),
)

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const categoryHex = computed(() => category.value?.color ?? '#6b7280')

// Solid background: var(--bg-surface) + category colour overlay layered on top.
// Using CSS background shorthand with multiple layers keeps the node opaque (no grid bleed-through).
const bgColor = computed(() => {
  const overlay = hexToRgba(categoryHex.value, 0.14)
  return `linear-gradient(${overlay}, ${overlay}), var(--bg-surface)`
})

const fillColor = computed(() => hexToRgba(categoryHex.value, 0.45))
const borderColor = computed(() => `var(--status-${progress.value.status.replace('_', '-')})`)

const glowShadow = computed(() => {
  const v = `var(--status-${progress.value.status.replace('_', '-')}-glow)`
  return `0 0 0 1px ${v}, 0 0 14px ${v}, inset 0 0 8px ${v}`
})

const totalSteps = computed(() => props.data.skill.progressions?.length ?? 0)
const fillWidth = computed(() => {
  if (totalSteps.value === 0) return '0%'
  const pct = Math.min(100, (progress.value.current_step / totalSteps.value) * 100)
  return `${pct}%`
})
</script>

<template>
  <div class="skill-node" :style="{ background: bgColor, borderColor, boxShadow: glowShadow }">
    <Handle type="target" :position="Position.Top" />

    <div v-if="totalSteps > 0" class="skill-node__fill" :style="{ width: fillWidth, backgroundColor: fillColor }" />

    <div class="skill-node__name">{{ data.skill.abbr || data.skill.name }}</div>
    <div class="skill-node__badge">{{ data.skill.difficulty }}</div>

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

/* Hide handle dots — Vue Flow still uses them for edge positioning internally */
:deep(.vue-flow__handle) {
  opacity: 0;
  pointer-events: none;
}
</style>
