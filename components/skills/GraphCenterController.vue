<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'

const { findNode, setCenter, viewport } = useVueFlow()
const skillStore = useSkillStore()
const progressStore = useProgressStore()

const selectedProgress = computed(() =>
  skillStore.selectedSkillId ? progressStore.getProgress(skillStore.selectedSkillId) : null,
)

const TRANSITION_MS = 450

async function centerOnSelected() {
  const id = skillStore.selectedSkillId
  if (!id) return
  await nextTick()
  const node = findNode(id)
  if (!node) return

  const pane = document.querySelector<HTMLElement>('.vue-flow__transformationpane')
  if (!pane) return

  // 1. Add transition class
  pane.classList.add('centering')

  // 2. Wait for browser to paint the transition property (rAF = after next paint)
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  // 3. Now change transform — CSS transition fires because it was already painted
  setCenter(node.position.x + 80, node.position.y + 30, { zoom: viewport.value.zoom })

  // 4. Remove class after animation completes
  setTimeout(() => pane.classList.remove('centering'), TRANSITION_MS)
}

watch(() => skillStore.selectedSkillId, centerOnSelected)
watch(selectedProgress, centerOnSelected)
watch(() => skillStore.filteredSkills, centerOnSelected)
</script>

<template>
  <div style="display: none" />
</template>
