<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import FilterPanel from '../../components/skills/FilterPanel.vue'
import SkillGraph from '../../components/skills/SkillGraph.vue'
import SkillList from '../../components/skills/SkillList.vue'
import SkillDetail from '../../components/skills/SkillDetail.vue'

const skillStore = useSkillStore()
const progressStore = useProgressStore()

onMounted(async () => {
  progressStore.init()
  skillStore.setProgressGetter((id) => progressStore.getProgress(id))
  await skillStore.fetchAll()
})

function onSkillClick(skillId: string) {
  skillStore.selectSkill(skillId)
}

function onDetailClose() {
  skillStore.selectSkill(null)
}

const isMobile = ref(false)

onMounted(() => {
  const check = () => {
    isMobile.value = window.innerWidth < 768
  }
  check()
  window.addEventListener('resize', check)
  onUnmounted(() => window.removeEventListener('resize', check))
})

const showGraph = computed(() => !isMobile.value && skillStore.viewMode !== 'list')
const showList = computed(() => isMobile.value || skillStore.viewMode === 'list')
</script>

<template>
  <div class="skills-page">
    <FilterPanel />

    <div class="skills-page__body">
      <div class="skills-page__main">
        <SkillGraph v-if="showGraph" @node-click="onSkillClick" />
        <SkillList v-if="showList" @skill-click="onSkillClick" />
      </div>

      <div v-if="skillStore.selectedSkillId" class="skills-page__backdrop" @click="onDetailClose" />
      <aside v-if="skillStore.selectedSkillId" class="skills-page__panel">
        <SkillDetail @close="onDetailClose" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.skills-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.skills-page__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.skills-page__main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.skills-page__panel {
  width: 320px;
  border-left: 1px solid var(--border);
  overflow-y: auto;
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .skills-page__panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 60vh;
    border-left: none;
    border-top: 1px solid var(--border);
    background: var(--bg-page);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    z-index: 50;
  }

  .skills-page__backdrop {
    display: block;
  }
}

.skills-page__backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 49;
}
</style>
