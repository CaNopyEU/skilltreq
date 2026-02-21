<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import { useFocusState } from '../../composables/useFocusState'
import FilterPanel from '../../components/skills/FilterPanel.vue'
import SkillGraph from '../../components/skills/SkillGraph.vue'
import SkillList from '../../components/skills/SkillList.vue'
import SkillDetail from '../../components/skills/SkillDetail.vue'

const skillStore = useSkillStore()
const progressStore = useProgressStore()
const { setFocus } = useFocusState()

onMounted(async () => {
  progressStore.init()
  skillStore.setProgressGetter((id) => progressStore.getProgress(id))
  await skillStore.fetchAll()
})

function onSkillClick(skillId: string) {
  skillStore.selectSkill(skillId)
  setFocus(skillId, skillStore.skills)
}

function onDetailClose() {
  skillStore.selectSkill(null)
  setFocus(null, [])
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

      <Transition name="backdrop-fade">
        <div v-if="skillStore.selectedSkillId" class="skills-page__backdrop" @click="onDetailClose" />
      </Transition>
      <Transition name="drawer-slide">
        <aside v-if="skillStore.selectedSkillId" class="skills-page__panel">
          <SkillDetail @close="onDetailClose" />
        </aside>
      </Transition>
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

/* Drawer slide-in */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Backdrop fade */
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 200ms ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
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
