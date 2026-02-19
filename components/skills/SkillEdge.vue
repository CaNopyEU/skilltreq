<script setup lang="ts">
import { getBezierPath, type EdgeProps } from '@vue-flow/core'
import { useProgressStore } from '../../stores/useProgressStore'

const props = defineProps<EdgeProps>()
const progressStore = useProgressStore()

const pathData = computed(() =>
    getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })[0],
)

function statusVar(status: string) {
  return `var(--status-${status.replace('_', '-')})`
}

const strokeColor = computed(() => {
  const parentStatus = progressStore.getProgress(props.source).status
  const childStatus = progressStore.getProgress(props.target).status
  if (parentStatus === 'mastered') {
    return childStatus === 'locked' ? 'var(--status-in-progress)' : statusVar(childStatus)
  }
  if (parentStatus === 'unlocked') return 'var(--status-in-progress)'
  return 'var(--status-locked)'
})

// Particle only when prerequisite is fulfilled
const isActive = computed(() => {
  const s = progressStore.getProgress(props.source).status
  return s === 'unlocked' || s === 'mastered'
})

// Unique ID for <mpath> reference — edge id is unique per Vue Flow instance
const mpathId = computed(() => `ep-${props.id}`)
</script>

<template>
  <g>
    <!--
      Invisible path used as the motion track for <mpath>.
      Must be in the same SVG as the animateMotion elements.
    -->
    <path :id="mpathId" :d="pathData" fill="none" stroke="none" />

    <!-- ── Faint base line — always shows the full connection ── -->
    <path
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      stroke-width="1"
      :stroke-opacity="isActive ? 0.1 : 0.28"
      :stroke-dasharray="isActive ? 'none' : '3 7'"
      :marker-end="markerEnd"
    />

    <!-- ── Electric particle — active edges only ── -->
    <template v-if="isActive">
      <!-- Outer aura -->
      <circle r="7" :fill="strokeColor">
        <animate attributeName="fill-opacity" values="0.06;0.14;0.05;0.18;0.07" dur="0.35s" repeatCount="indefinite" />
        <animateMotion dur="1.6s" repeatCount="indefinite" rotate="auto">
          <mpath :href="`#${mpathId}`" />
        </animateMotion>
      </circle>

      <!-- Mid glow -->
      <circle r="3.5" :fill="strokeColor">
        <animate attributeName="fill-opacity" values="0.35;0.55;0.3;0.5;0.4" dur="0.35s" repeatCount="indefinite" />
        <animateMotion dur="1.6s" repeatCount="indefinite" rotate="auto">
          <mpath :href="`#${mpathId}`" />
        </animateMotion>
      </circle>

      <!-- Bright core -->
      <circle r="1.8" fill="white">
        <animate attributeName="fill-opacity" values="0.8;1;0.75;1;0.85" dur="0.35s" repeatCount="indefinite" />
        <animateMotion dur="1.6s" repeatCount="indefinite" rotate="auto">
          <mpath :href="`#${mpathId}`" />
        </animateMotion>
      </circle>
    </template>
  </g>
</template>
