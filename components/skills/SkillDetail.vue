<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import { useFocusState } from '../../composables/useFocusState'
import { useToast } from '../../composables/useToast'
import type { ProgressStatus } from '../../stores/useProgressStore'

const emit = defineEmits<{ close: [] }>()

const skillStore = useSkillStore()
const progressStore = useProgressStore()
const { setFocus } = useFocusState()
const toast = useToast()

const skill = computed(() => skillStore.selectedSkill)
const progress = computed(() => (skill.value ? progressStore.getProgress(skill.value.id) : null))
const category = computed(() => skillStore.categories.find((c) => c.id === skill.value?.categoryId))
const categoryHex = computed(() => category.value?.color ?? '#6b7280')

const categoryIcons: Record<string, string> = {
  pull: '↑', push: '↓', legs: '⟳', core: '◎', rings: '○',
}
const categoryIcon = computed(() => category.value ? (categoryIcons[category.value.id] ?? '·') : '')

const statusLabel: Record<ProgressStatus, string> = {
  locked: 'Locked',
  in_progress: 'In Progress',
  completed: 'Completed',
  mastered: 'Mastered',
}
const statusIcon: Record<ProgressStatus, string> = {
  locked: '○', in_progress: '◉', completed: '✓', mastered: '★',
}

// Progress
const totalSteps = computed(() => skill.value?.progressions?.length ?? 0)
const currentStep = computed(() => progress.value?.current_step ?? 0)
const progressPct = computed(() => {
  if (!totalSteps.value) return 0
  return Math.round(Math.min(100, (currentStep.value / totalSteps.value) * 100))
})

// Prerequisite parents (skills this one requires)
const parents = computed(() => {
  if (!skill.value?.requires?.length) return []
  return skill.value.requires
    .map((id) => {
      const s = skillStore.skills.find((sk) => sk.id === id)
      return s ? { skill: s, status: progressStore.getProgress(id).status } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
})

// Children (skills that require this one)
const children = computed(() => {
  if (!skill.value) return []
  return skillStore.skills
    .filter((s) => s.requires?.includes(skill.value!.id))
    .map((s) => ({ skill: s, status: progressStore.getProgress(s.id).status }))
})

function navigate(skillId: string) {
  skillStore.selectSkill(skillId)
  setFocus(skillId, skillStore.skills)
}

// Ambient header glow per status
const headerGlow = computed(() => {
  const s = progress.value?.status
  if (!s || s === 'locked') return 'none'
  const map: Partial<Record<ProgressStatus, string>> = {
    in_progress: '0 0 40px rgba(59,130,246,0.2)',
    completed:   '0 0 40px rgba(34,197,94,0.15)',
    mastered:    '0 0 40px rgba(245,158,11,0.2)',
  }
  return map[s] ?? 'none'
})

// Status change — no parent-locked restriction; confirmation only when locking with active children
const selectKey = ref(0)

const activeChildren = computed(() =>
  children.value.filter((c) => c.status !== 'locked'),
)

const showLockedModal = ref(false)

function onStatusChange(e: Event) {
  if (!skill.value) return
  const val = (e.target as HTMLSelectElement).value as ProgressStatus
  if (val === 'locked' && activeChildren.value.length > 0) {
    showLockedModal.value = true
    return
  }
  progressStore.setStatus(skill.value.id, val, totalSteps.value)
}

function onLockedConfirm() {
  if (!skill.value) return
  const count = activeChildren.value.length
  progressStore.setStatus(skill.value.id, 'locked', totalSteps.value)
  toast.info(`Zamknutý. Ovplyvnené závislosti: ${count}`)
  showLockedModal.value = false
}

function onLockedCancel() {
  showLockedModal.value = false
  selectKey.value++
}

function onLastStepDblClick() {
  if (!skill.value) return
  progressStore.setStatus(skill.value.id, 'completed', totalSteps.value)
  toast.success(`${skill.value.name} — dokončený`)
}

// Mastery confirmation modal
const showMasteryModal = ref(false)

function onMasteryDblClick() {
  showMasteryModal.value = true
}

function onMasteryConfirm() {
  if (!skill.value) return
  progressStore.setStatus(skill.value.id, 'mastered', totalSteps.value)
  showMasteryModal.value = false
  toast.success(`${skill.value.name} — Mastered ★`)
}
</script>

<template>
  <BaseModal
    :open="showLockedModal"
    title="Zamknúť skill?"
    confirm-label="Zamknúť"
    confirm-variant="danger"
    cancel-label="Zrušiť"
    @confirm="onLockedConfirm"
    @close="onLockedCancel"
  >
    <p>Nasledujúce závislosti sú aktívne a môžu byť ovplyvnené:</p>
    <ul class="locked-modal__list">
      <li v-for="c in activeChildren" :key="c.skill.id" class="locked-modal__item">
        <span class="locked-modal__dot" :data-status="c.status" />
        {{ c.skill.name }}
      </li>
    </ul>
  </BaseModal>

  <BaseModal
    :open="showMasteryModal"
    title="Potvrdiť Mastery"
    confirm-label="Áno, Mastered"
    cancel-label="Ešte nie"
    @confirm="onMasteryConfirm"
    @close="showMasteryModal = false"
  >
    <p>Dosiahol si plné zvládnutie <strong>{{ skill?.name }}</strong>?</p>
    <p v-if="skill?.masteryCriteria" class="mastery-modal__crit">{{ skill.masteryCriteria }}</p>
  </BaseModal>

  <div v-if="skill && progress" class="drawer" :data-status="progress.status">
    <!-- ── Header ── -->
    <div class="drawer__header" :style="{ boxShadow: headerGlow }">
      <div class="drawer__header-top">
        <span class="drawer__cat-icon">{{ categoryIcon }}</span>
        <h2 class="drawer__title">{{ skill.name }}</h2>
        <span class="drawer__badge" :data-status="progress.status">
          {{ statusIcon[progress.status] }} {{ statusLabel[progress.status] }}
        </span>
        <button class="drawer__close" @click="emit('close')">✕</button>
      </div>

      <!-- Category micro bar -->
      <div class="drawer__cat-bar" :style="{ backgroundColor: categoryHex }" />

      <!-- In-progress: mini track bar -->
      <div v-if="progress.status === 'in_progress'" class="drawer__track">
        <div class="drawer__track-fill" :style="{ width: progressPct + '%' }" />
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="drawer__body">
      <p v-if="skill.description" class="drawer__desc">{{ skill.description }}</p>

      <!-- In Progress: step list -->
      <section v-if="progress.status === 'in_progress' && totalSteps > 0" class="drawer__section">
        <div class="drawer__row-head">
          <span class="drawer__label">Progressions</span>
          <span class="drawer__pct">{{ progressPct }}%</span>
        </div>
        <div class="drawer__steps">
          <button
            v-for="(prog, i) in skill.progressions"
            :key="i"
            class="drawer__step"
            :class="{
              'drawer__step--done': i < currentStep,
              'drawer__step--active': i === currentStep,
              'drawer__step--final': i === totalSteps - 1,
            }"
            :title="i === totalSteps - 1 ? 'Double-click na dokončenie skilu' : undefined"
            @click="progressStore.setStep(skill.id, i)"
            @dblclick.stop="i === totalSteps - 1 && onLastStepDblClick()"
          >
            <span class="drawer__step-num">
              {{ i + 1 }}
              <span v-if="i === totalSteps - 1" class="drawer__step-final-mark">★</span>
            </span>
            <span class="drawer__step-body">
              <span class="drawer__step-name">{{ prog.name }}</span>
              <span v-if="prog.mastery_criteria" class="drawer__step-crit">{{ prog.mastery_criteria }}</span>
            </span>
          </button>
        </div>
      </section>

      <!-- Completed: mastery unlock prompt -->
      <section v-if="progress.status === 'completed'" class="drawer__section">
        <div
          class="drawer__mastery-prompt"
          title="Double-click na prechod do Mastered"
          @dblclick="onMasteryDblClick"
        >
          <span class="drawer__mastery-prompt-icon">★</span>
          <span class="drawer__mastery-prompt-text">
            <span class="drawer__mastery-prompt-label">Mastery dostupné</span>
            <span v-if="skill.masteryCriteria" class="drawer__mastery-prompt-crit">{{ skill.masteryCriteria }}</span>
          </span>
          <span class="drawer__mastery-prompt-hint">dblclick</span>
        </div>
      </section>

      <!-- Mastered: badge + criteria -->
      <section v-if="progress.status === 'mastered'" class="drawer__section">
        <div class="drawer__mastered-chip">★ Mastered</div>
        <p v-if="skill.masteryCriteria" class="drawer__mastery-crit">{{ skill.masteryCriteria }}</p>
      </section>

      <!-- Status selector -->
      <div class="drawer__section">
        <label class="drawer__label">Status</label>
        <select :key="selectKey" class="drawer__select" :value="progress.status" @change="onStatusChange">
          <option value="locked">○ Locked</option>
          <option value="in_progress">◉ In Progress</option>
          <option value="completed">✓ Completed</option>
          <option value="mastered">★ Mastered</option>
        </select>
      </div>

      <!-- Prerequisites (parent skills) -->
      <section v-if="parents.length" class="drawer__section">
        <h3 class="drawer__section-title">Prerequisite</h3>
        <div class="drawer__rels">
          <button
            v-for="p in parents"
            :key="p.skill.id"
            class="drawer__rel"
            @click="navigate(p.skill.id)"
          >
            <span class="drawer__rel-dot" :data-status="p.status" />
            <span class="drawer__rel-name">{{ p.skill.name }}</span>
            <span class="drawer__rel-arrow">→</span>
          </button>
        </div>
      </section>

      <!-- Children (skills this unlocks) -->
      <section v-if="children.length" class="drawer__section">
        <h3 class="drawer__section-title">Unlocks</h3>
        <div class="drawer__rels">
          <button
            v-for="c in children"
            :key="c.skill.id"
            class="drawer__rel"
            :class="{ 'drawer__rel--locked': c.status === 'locked' }"
            @click="navigate(c.skill.id)"
          >
            <span class="drawer__rel-dot" :data-status="c.status" />
            <span class="drawer__rel-name">{{ c.skill.name }}</span>
            <span class="drawer__rel-arrow">→</span>
          </button>
        </div>
      </section>

      <!-- Tutorials -->
      <div v-if="skill.tutorials?.main || skill.tutorials?.alt" class="drawer__section">
        <label class="drawer__label">Tutorials</label>
        <div class="drawer__links">
          <a v-if="skill.tutorials?.main" :href="skill.tutorials.main" target="_blank" class="drawer__link">
            Main ↗
          </a>
          <a v-if="skill.tutorials?.alt" :href="skill.tutorials.alt" target="_blank" class="drawer__link">
            Alt ↗
          </a>
        </div>
      </div>

      <!-- Notes -->
      <div class="drawer__section">
        <label class="drawer__label">Notes</label>
        <textarea
          class="drawer__notes"
          :value="progress.note"
          placeholder="Add a note..."
          rows="3"
          @input="progressStore.setNote(skill.id, ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Locked modal list ── */
.locked-modal__list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.locked-modal__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.locked-modal__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.locked-modal__dot[data-status='in_progress'] { background: var(--status-in-progress); }
.locked-modal__dot[data-status='completed']   { background: var(--status-completed); }
.locked-modal__dot[data-status='mastered']    { background: var(--status-mastered); }

/* ── Root ── */
.drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--drawer-bg);
  overflow: hidden;
}

/* ── Header ── */
.drawer__header {
  padding: 14px 14px 0;
  flex-shrink: 0;
  animation: drawer-header-open 200ms ease both;
  transition: box-shadow 0.3s ease;
}

@keyframes drawer-header-open {
  from { transform: scale(0.98); opacity: 0.7; }
  to   { transform: scale(1);    opacity: 1; }
}

.drawer__header-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.drawer__cat-icon {
  font-size: 16px;
  line-height: 1.3;
  color: #cbd5e1;
  opacity: 0.7;
  flex-shrink: 0;
  margin-top: 2px;
}

.drawer__title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  color: var(--text-primary);
}

.drawer[data-status='locked'] .drawer__title {
  opacity: 0.7;
}

/* Status badge */
.drawer__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.drawer__badge[data-status='locked'] {
  background: color-mix(in srgb, var(--status-locked) 18%, transparent);
  color: var(--status-locked);
}

.drawer__badge[data-status='in_progress'] {
  background: color-mix(in srgb, var(--status-in-progress) 18%, transparent);
  color: var(--status-in-progress);
}

.drawer__badge[data-status='completed'] {
  background: color-mix(in srgb, var(--status-completed) 18%, transparent);
  color: var(--status-completed);
}

.drawer__badge[data-status='mastered'] {
  background: linear-gradient(
    90deg,
    var(--status-mastered),
    color-mix(in srgb, var(--status-mastered) 55%, white) 50%,
    var(--status-mastered)
  );
  background-size: 200% auto;
  color: #1a0a00;
  animation: shimmer 3s linear infinite;
}

.drawer__close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.12s;
}
.drawer__close:hover { color: var(--text-primary); }

/* Category micro bar */
.drawer__cat-bar {
  height: 4px;
  border-radius: 2px;
}

/* In-progress mini track */
.drawer__track {
  height: 3px;
  margin-top: 8px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--status-in-progress) 18%, transparent);
  overflow: hidden;
}

.drawer__track-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    var(--status-in-progress),
    color-mix(in srgb, var(--status-in-progress) 60%, white)
  );
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
  transition: width 0.35s ease;
}

/* ── Body ── */
.drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  border-top: 1px solid var(--drawer-border);
  margin-top: 12px;
}

.drawer__desc {
  font-size: 13px;
  color: var(--text-body);
  line-height: 1.55;
  margin: 0 0 16px;
}

/* ── Sections ── */
.drawer__section {
  margin-bottom: 20px;
}

.drawer__section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  margin: 0 0 6px;
}

.drawer__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.drawer__label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  margin-bottom: 6px;
}

.drawer__pct {
  font-size: 11px;
  font-weight: 700;
  color: var(--status-in-progress);
}

/* ── Steps ── */
.drawer__steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer__step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-surface);
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background 0.12s;
  width: 100%;
}
.drawer__step:hover { background: var(--bg-hover); }

.drawer__step--done {
  background: var(--prog-done-bg);
  border-color: var(--prog-done-border);
  color: var(--prog-done-text);
}

.drawer__step--active {
  background: var(--prog-active-bg);
  border-color: var(--prog-active-border);
  color: var(--prog-active-text);
  font-weight: 600;
}

.drawer__step--final:not(.drawer__step--done) {
  border-color: color-mix(in srgb, var(--status-completed) 40%, transparent);
}

.drawer__step-num {
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  padding-top: 1px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.drawer__step-final-mark {
  font-size: 8px;
  color: var(--status-completed);
  line-height: 1;
  opacity: 0.8;
}

.drawer__step-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer__step-name { font-size: 13px; }

.drawer__step-crit {
  font-size: 11px;
  opacity: 0.7;
  line-height: 1.4;
}

/* ── Mastery prompt (completed state) ── */
.drawer__mastery-prompt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px dashed color-mix(in srgb, var(--status-mastered) 50%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--status-mastered) 6%, transparent);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.drawer__mastery-prompt:hover {
  background: color-mix(in srgb, var(--status-mastered) 12%, transparent);
  border-color: color-mix(in srgb, var(--status-mastered) 70%, transparent);
}

.drawer__mastery-prompt-icon {
  font-size: 18px;
  color: var(--status-mastered);
  flex-shrink: 0;
}

.drawer__mastery-prompt-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer__mastery-prompt-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--status-mastered);
}

.drawer__mastery-prompt-crit {
  font-size: 11px;
  color: var(--text-body);
  line-height: 1.4;
}

.drawer__mastery-prompt-hint {
  font-size: 10px;
  color: var(--text-faint);
  white-space: nowrap;
}

/* ── Mastery confirmation modal body ── */
.mastery-modal__crit {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-body);
  padding: 8px 10px;
  background: var(--bg-muted);
  border-radius: 6px;
  border-left: 3px solid var(--status-mastered);
  line-height: 1.5;
}

/* ── Mastered ── */
.drawer__mastered-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: linear-gradient(
    90deg,
    var(--status-mastered),
    color-mix(in srgb, var(--status-mastered) 55%, white) 50%,
    var(--status-mastered)
  );
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
  color: #1a0a00;
  margin-bottom: 10px;
}

.drawer__mastery-crit {
  font-size: 12px;
  color: var(--text-body);
  line-height: 1.5;
  margin: 0;
  padding: 8px 10px;
  background: var(--bg-muted);
  border-radius: 6px;
  border-left: 3px solid var(--status-mastered);
}

/* ── Select ── */
.drawer__select {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-page);
  color: var(--text-primary);
  cursor: pointer;
}

/* ── Relations ── */
.drawer__rels {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer__rel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background 0.12s, border-color 0.12s;
}
.drawer__rel:hover {
  background: var(--bg-surface);
  border-color: var(--border);
}

.drawer__rel--locked { opacity: 0.5; }

.drawer__rel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.drawer__rel-dot[data-status='locked']      { background: var(--status-locked); }
.drawer__rel-dot[data-status='in_progress'] { background: var(--status-in-progress); }
.drawer__rel-dot[data-status='completed']   { background: var(--status-completed); }
.drawer__rel-dot[data-status='mastered']    { background: var(--status-mastered); }

.drawer__rel-name { flex: 1; }

.drawer__rel-arrow {
  font-size: 11px;
  color: var(--text-faint);
}

/* ── Tutorials ── */
.drawer__links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.drawer__link {
  font-size: 12px;
  color: var(--status-in-progress);
  text-decoration: none;
  padding: 4px 10px;
  border: 1px solid color-mix(in srgb, var(--status-in-progress) 30%, transparent);
  border-radius: 6px;
  transition: background 0.12s;
}
.drawer__link:hover {
  background: color-mix(in srgb, var(--status-in-progress) 8%, transparent);
}

/* ── Notes ── */
.drawer__notes {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-page);
  color: var(--text-primary);
  resize: vertical;
  line-height: 1.5;
  font-family: inherit;
  box-sizing: border-box;
}
.drawer__notes::placeholder { color: var(--text-faint); }
.drawer__notes:focus {
  outline: none;
  border-color: var(--status-in-progress);
}
</style>
