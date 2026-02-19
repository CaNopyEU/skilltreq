<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import SkillNode from './SkillNode.vue'
import SkillEdge from './SkillEdge.vue'
import GraphCenterController from './GraphCenterController.vue'
import { useSkillStore } from '../../stores/useSkillStore'
import { useGraphLayout } from '../../composables/useGraphLayout'

const emit = defineEmits<{
  'node-click': [skillId: string]
}>()

const skillStore = useSkillStore()
const { buildLayout } = useGraphLayout()

const direction = computed(() => (skillStore.viewMode === 'graph-lr' ? 'LR' : 'TB'))

const layout = computed(() => buildLayout(skillStore.filteredSkills, direction.value))

const nodeTypes = { skill: SkillNode }
const edgeTypes = { 'skill-edge': SkillEdge }

function onNodeClick({ node }: { node: { id: string } }) {
  emit('node-click', node.id)
}
</script>

<template>
  <div class="skill-graph">
    <VueFlow
      :nodes="layout.nodes"
      :edges="layout.edges"
      fit-view-on-init
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      @node-click="onNodeClick"
    >
      <Controls />
      <GraphCenterController />
    </VueFlow>
  </div>
</template>

<style scoped>
.skill-graph {
  width: 100%;
  height: 100%;
}
</style>
