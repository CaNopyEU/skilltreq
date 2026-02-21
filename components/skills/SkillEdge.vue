<script setup lang="ts">
import { getBezierPath, type EdgeProps } from '@vue-flow/core'
import { type Ref } from 'vue'
import { useProgressStore } from '../../stores/useProgressStore'
import { useSkillStore } from '../../stores/useSkillStore'
import { useFocusState } from '../../composables/useFocusState'
import { resolveEdgeVariant, type NodeStatus } from '../../utils/resolveEdgeVariant'

const props = defineProps<EdgeProps>()
const progressStore = useProgressStore()
const skillStore = useSkillStore()
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

// Use effective status: stored 'locked' becomes 'unlocked' when all prereqs are met
function effectiveStatus(nodeId: string): NodeStatus {
  const s = progressStore.getProgress(nodeId).status
  return s === 'locked' && skillStore.isSkillUnlocked(nodeId) ? 'unlocked' : s
}

const sourceStatus = computed(() => effectiveStatus(props.source))
const targetStatus = computed(() => effectiveStatus(props.target))

const variant = computed(() => resolveEdgeVariant(sourceStatus.value, targetStatus.value))

const gradientId = computed(() => `mtc-grad-${props.id}`)

const strokeColor = computed(() => {
  switch (variant.value) {
    case 'locked_dashed':
    case 'locked_solid':          return 'var(--status-locked)'
    case 'available':             return 'var(--status-unlocked)'
    case 'in_progress':           return 'var(--status-in-progress)'
    case 'completed':             return 'var(--status-completed)'
    case 'mastered':              return 'var(--status-mastered)'
    case 'mastered_to_completed': return `url(#${gradientId.value})`
  }
})

// Energy particle when flowing INTO an in_progress skill
const isActive = computed(() => targetStatus.value === 'in_progress')

// Available: completed/mastered parent → unlocked child (path is clear)
const isAvailable = computed(() => variant.value === 'available')

// Mastered edge: gold shimmer pulse (mastered→mastered or mastered→in_progress)
const isMasteredEdge = computed(() => variant.value === 'mastered' && !isActive.value)

// Gradient edge: mastered parent → completed child
const isMasteredToCompleted = computed(() => variant.value === 'mastered_to_completed')

// Dashed only for locked parent
const isDashed = computed(() => variant.value === 'locked_dashed')

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
  if (variant.value === 'available') return 1.5
  return 1
})

const strokeOpacity = computed(() => {
  if (focusedSkillId.value !== null) {
    if (isInFocus.value) return isParentEdge.value ? 1.0 : 0.9
    return 0.1
  }
  if (variant.value === 'locked_dashed') return 0.25
  if (variant.value === 'locked_solid') return 0.4
  if (variant.value === 'available') return 0.65
  if (isActive.value) return 0.35
  return 0.6  // completed, mastered, mastered_to_completed — animate overrides for mastered
})

// Particle speed in px/s — constant regardless of edge length
const PARTICLE_SPEED = 120 // px/s base
const PARTICLE_SPEED_BRANCH = 150
const PARTICLE_SPEED_FOCUS = 190

// Straight-line distance between endpoints (proportional to Bezier path length)
const edgeDistance = computed(() => {
  const dx = props.targetX - props.sourceX
  const dy = props.targetY - props.sourceY
  return Math.sqrt(dx * dx + dy * dy)
})

// SMIL dur is a presentation attribute — CSS var() is not supported, use literal strings
const energyDuration = computed(() => {
  const dist = Math.max(40, edgeDistance.value) // floor to avoid sub-frame durations
  if (isInFocus.value) return `${(dist / PARTICLE_SPEED_FOCUS).toFixed(2)}s`
  if (isFocusActive.value) return `${(dist / PARTICLE_SPEED_BRANCH).toFixed(2)}s`
  return `${(dist / PARTICLE_SPEED).toFixed(2)}s`
})

// Unique ID for <mpath> reference
const mpathId = computed(() => `ep-${props.id}`)
</script>

<template>
  <g>
    <!-- Gradient def for mastered_to_completed edge -->
    <defs v-if="isMasteredToCompleted">
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        :x1="props.sourceX" :y1="props.sourceY"
        :x2="props.targetX" :y2="props.targetY"
      >
        <stop offset="0%" stop-color="var(--status-mastered)" />
        <stop offset="100%" stop-color="var(--status-completed)" />
      </linearGradient>
    </defs>

    <!--
      Invisible path used as the motion track for <mpath>.
      Must be in the same SVG as the animateMotion elements.
    -->
    <path :id="mpathId" :d="pathData" fill="none" stroke="none" />

    <!-- ── Available line — teal pulse, path is clear ── -->
    <path
      v-if="isAvailable"
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      stroke-opacity="0.5"
      :marker-end="markerEnd"
    >
      <animate attributeName="stroke-opacity" values="0.35;0.65;0.35" dur="2.5s" repeatCount="indefinite" />
    </path>

    <!-- ── Mastered line — solid gold with shimmer pulse ── -->
    <path
      v-if="isMasteredEdge"
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      stroke-opacity="0.5"
      :marker-end="markerEnd"
    >
      <animate attributeName="stroke-opacity" values="0.4;0.85;0.4" dur="3s" repeatCount="indefinite" />
    </path>

    <!-- ── Mastered→Completed gradient line with subtle pulse ── -->
    <path
      v-else-if="isMasteredToCompleted"
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      stroke-opacity="0.55"
      :marker-end="markerEnd"
    >
      <animate attributeName="stroke-opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite" />
    </path>

    <!-- ── Regular base line ── -->
    <path
      v-else
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      :stroke-opacity="strokeOpacity"
      :stroke-dasharray="isDashed ? '4 6' : 'none'"
      :marker-end="markerEnd"
    />

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
