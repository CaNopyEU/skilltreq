<script setup lang="ts">
import { getBezierPath, type EdgeProps } from '@vue-flow/core'
import { type Ref } from 'vue'
import { useProgressStore } from '../../stores/useProgressStore'
import { useFocusState } from '../../composables/useFocusState'

const props = defineProps<EdgeProps>()
const progressStore = useProgressStore()
const { focusedSkillId, isInFocusBranch } = useFocusState()
const graphIsPaused = inject<Ref<boolean>>('graphIsPaused', ref(false))

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

const sourceStatus = computed(() => progressStore.getProgress(props.source).status)
const targetStatus = computed(() => progressStore.getProgress(props.target).status)

const strokeColor = computed(() => {
  if (targetStatus.value === 'in_progress') return 'var(--status-in-progress)'
  if (sourceStatus.value === 'mastered') return 'var(--status-mastered)'
  if (sourceStatus.value === 'completed') return 'var(--status-completed)'
  return 'var(--status-locked)'
})

// Energy particle when flowing INTO an in_progress skill
const isActive = computed(() => targetStatus.value === 'in_progress')

// Mastered edge shimmer: source is mastered, no active particle
const isMasteredEdge = computed(() => sourceStatus.value === 'mastered' && !isActive.value)

// Dashed only when prerequisite is locked
const isDashed = computed(() => sourceStatus.value === 'locked')

// Focus relationship
const isParentEdge = computed(() => focusedSkillId.value !== null && props.target === focusedSkillId.value)
const isChildEdge = computed(() => focusedSkillId.value !== null && props.source === focusedSkillId.value)
const isInFocus = computed(() => isParentEdge.value || isChildEdge.value)

// Whether this edge is in the focus branch at all
const isFocusActive = computed(() => {
  if (focusedSkillId.value === null) return false
  return isInFocusBranch(props.source) && isInFocusBranch(props.target)
})

const strokeWidth = computed(() => {
  if (isParentEdge.value) return 2
  if (isChildEdge.value) return 1.5
  return 1
})

const strokeOpacity = computed(() => {
  if (focusedSkillId.value !== null) {
    if (isInFocus.value) return isParentEdge.value ? 1.0 : 0.9
    return 0.1
  }
  if (sourceStatus.value === 'locked') return 0.25
  if (isActive.value) return 0.35
  if (isMasteredEdge.value) return 0.6  // base; animate overrides this
  return 0.6  // completed
})

// SMIL dur is a presentation attribute — CSS var() is not supported, use literal strings
const energyDuration = computed(() => {
  if (isInFocus.value) return '1.7s'
  if (isFocusActive.value) return '2s'
  return '2.6s'
})

// Unique ID for <mpath> reference
const mpathId = computed(() => `ep-${props.id}`)
</script>

<template>
  <g>
    <!--
      Invisible path used as the motion track for <mpath>.
      Must be in the same SVG as the animateMotion elements.
    -->
    <path :id="mpathId" :d="pathData" fill="none" stroke="none" />

    <!-- ── Regular base line ── -->
    <path
      v-if="!isMasteredEdge"
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      :stroke-opacity="strokeOpacity"
      :stroke-dasharray="isDashed ? '4 6' : 'none'"
      :marker-end="markerEnd"
    />

    <!-- ── Mastered line — solid gold with shimmer pulse ── -->
    <path
      v-else
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      stroke-opacity="0.5"
      :marker-end="markerEnd"
    >
      <animate attributeName="stroke-opacity" values="0.4;0.85;0.4" dur="3s" repeatCount="indefinite" />
    </path>

    <!-- ── Electric particle — edges flowing into in_progress skills ── -->
    <template v-if="isActive && !graphIsPaused">
      <!-- Trailing aura -->
      <circle r="5" :fill="strokeColor" fill-opacity="0.08">
        <animateMotion :dur="energyDuration" repeatCount="indefinite" rotate="auto">
          <mpath :href="`#${mpathId}`" />
        </animateMotion>
      </circle>

      <!-- Main particle -->
      <circle r="3.5" :fill="strokeColor">
        <animate attributeName="fill-opacity" values="0.35;0.55;0.3;0.5;0.4" dur="0.4s" repeatCount="indefinite" />
        <animateMotion :dur="energyDuration" repeatCount="indefinite" rotate="auto">
          <mpath :href="`#${mpathId}`" />
        </animateMotion>
      </circle>

      <!-- Bright core -->
      <circle r="1.8" fill="white">
        <animate attributeName="fill-opacity" values="0.8;1;0.75;1;0.85" dur="0.4s" repeatCount="indefinite" />
        <animateMotion :dur="energyDuration" repeatCount="indefinite" rotate="auto">
          <mpath :href="`#${mpathId}`" />
        </animateMotion>
      </circle>
    </template>
  </g>
</template>
