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

// Mobile: filter overlay state
const showFilterMenu = ref(false)

// Body scroll prevention — lock scroll when drawer is open on mobile
watch(
  () => skillStore.selectedSkillId,
  (id) => {
    if (isMobile.value) {
      document.body.style.overflow = id ? 'hidden' : ''
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="skills-page">
    <!-- Desktop: filter panel in normal layout flow -->
    <div class="skills-page__filter-desktop">
      <FilterPanel />
    </div>

    <!-- Mobile: hamburger + filter overlay -->
    <template v-if="isMobile">
      <!-- Hamburger button (fixed top-left) -->
      <button class="skills-page__burger" aria-label="Open filters" @click="showFilterMenu = true">
        <HIcon name="bars-3" :size="20" />
      </button>

      <!-- Overlay backdrop (fade) -->
      <Transition name="filter-backdrop-fade">
        <div
          v-if="showFilterMenu"
          class="skills-page__filter-overlay-backdrop"
          @click="showFilterMenu = false"
        />
      </Transition>

      <!-- Filter panel (slides down from top) -->
      <Transition name="filter-panel-slide">
        <div v-if="showFilterMenu" class="skills-page__filter-panel-wrap">
          <div class="skills-page__filter-panel-header">
            <span class="skills-page__filter-panel-title">Filters</span>
            <button
              class="skills-page__filter-close"
              aria-label="Close filters"
              @click="showFilterMenu = false"
            >
              <HIcon name="x-mark" :size="16" />
            </button>
          </div>
          <FilterPanel />
        </div>
      </Transition>
    </template>

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

/* ── Drawer slide-in (desktop: from right; mobile: not used) ── */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ── Skill panel backdrop ── */
.skills-page__backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 49;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 200ms ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

/* ── Desktop filter wrapper ── */
.skills-page__filter-desktop {
  flex-shrink: 0;
}

/* ── Mobile: hamburger button ── */
.skills-page__burger {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 8px;
  left: 12px;
  z-index: 55;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-muted);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.12s, color 0.12s;
}

.skills-page__burger:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ── Mobile: filter overlay backdrop ── */
.skills-page__filter-overlay-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.35);
}

/* ── Mobile: filter panel wrap ── */
.skills-page__filter-panel-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 61;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* Filter panel mobile header */
.skills-page__filter-panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-muted);
}

.skills-page__filter-panel-title {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}

.skills-page__filter-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.skills-page__filter-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ── Filter overlay transitions ── */
.filter-backdrop-fade-enter-active,
.filter-backdrop-fade-leave-active {
  transition: opacity 200ms ease;
}
.filter-backdrop-fade-enter-from,
.filter-backdrop-fade-leave-to {
  opacity: 0;
}

.filter-panel-slide-enter-active,
.filter-panel-slide-leave-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.filter-panel-slide-enter-from,
.filter-panel-slide-leave-to {
  transform: translateY(-100%);
}

/* ── Mobile overrides ── */
@media (max-width: 767px) {
  /* Hide desktop filter panel */
  .skills-page__filter-desktop {
    display: none;
  }

  /* Skill detail drawer — bottom sheet */
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
    overflow: hidden;
  }

  .skills-page__backdrop {
    display: block;
  }
}
</style>
