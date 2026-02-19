<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import type { Category, Skill } from '../../db/schema'
import { useProgressStore } from '../../stores/useProgressStore'
import type { ProgressStatus } from '../../stores/useProgressStore'
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

const statusColors: Record<ProgressStatus, string> = {
  locked: '#9ca3af',
  in_progress: '#3b82f6',
  unlocked: '#22c55e',
  mastered: '#eab308',
}

const bgColor = computed(() => {
  const hex = category.value?.color ?? '#6b7280'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.15)`
})

const borderColor = computed(() => statusColors[progress.value.status])
</script>

<template>
  <div
    class="skill-node"
    :style="{
      backgroundColor: bgColor,
      borderColor: borderColor,
    }"
  >
    <Handle type="target" :position="Position.Top" />
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
}

.skill-node__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2937;
}

.skill-node__badge {
  position: absolute;
  top: 4px;
  right: 6px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 10px;
  padding: 1px 4px;
  color: #374151;
  font-weight: 600;
}
</style>
