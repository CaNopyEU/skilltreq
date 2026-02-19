<script setup lang="ts">
import { useSkillStore } from '../../stores/useSkillStore'
import { useProgressStore } from '../../stores/useProgressStore'
import type { ProgressStatus } from '../../stores/useProgressStore'

const emit = defineEmits<{
  close: []
}>()

const skillStore = useSkillStore()
const progressStore = useProgressStore()

const skill = computed(() => skillStore.selectedSkill)
const progress = computed(() => (skill.value ? progressStore.getProgress(skill.value.id) : null))

const statusOptions: { value: ProgressStatus; label: string }[] = [
  { value: 'locked', label: '🔒 Locked' },
  { value: 'in_progress', label: '🔵 In Progress' },
  { value: 'unlocked', label: '✅ Unlocked' },
  { value: 'mastered', label: '⭐ Mastered' },
]

// Prerequisite modal state
const showPrereqModal = ref(false)
const pendingStatus = ref<ProgressStatus | null>(null)
const selectKey = ref(0)

const blockingPrereqs = computed(() => {
  if (!skill.value?.requires?.length) return []
  return skill.value.requires
    .map((reqId) => {
      const s = skillStore.skills.find((sk) => sk.id === reqId)
      const p = progressStore.getProgress(reqId)
      return s ? { id: reqId, name: s.name, status: p.status } : null
    })
    .filter(
      (s): s is { id: string; name: string; status: ProgressStatus } =>
        s !== null && (s.status === 'locked' || s.status === 'in_progress'),
    )
})

function onStatusChange(e: Event) {
  if (!skill.value) return
  const val = (e.target as HTMLSelectElement).value as ProgressStatus

  if (blockingPrereqs.value.length > 0) {
    pendingStatus.value = val
    showPrereqModal.value = true
    return
  }

  progressStore.setStatus(skill.value.id, val, skill.value.progressions?.length ?? 0)
}

function onPrereqConfirm() {
  if (!skill.value || !pendingStatus.value) return
  progressStore.setStatus(skill.value.id, pendingStatus.value, skill.value.progressions?.length ?? 0)
  showPrereqModal.value = false
  pendingStatus.value = null
}

function onPrereqCancel() {
  showPrereqModal.value = false
  pendingStatus.value = null
  selectKey.value++ // reset select to current status
}

function onStepChange(step: number) {
  if (!skill.value) return
  progressStore.setStep(skill.value.id, step)
}

const difficultyLabel = computed(() => {
  const d = skill.value?.difficulty ?? 0
  if (d <= 3) return 'Beginner'
  if (d <= 6) return 'Intermediate'
  if (d <= 8) return 'Advanced'
  return 'Elite'
})
</script>

<template>
  <PrereqModal
    v-if="showPrereqModal"
    :blocking="blockingPrereqs"
    @confirm="onPrereqConfirm"
    @cancel="onPrereqCancel"
  />

  <div v-if="skill && progress" class="skill-detail">
    <div class="skill-detail__header">
      <h2 class="skill-detail__title">{{ skill.name }}</h2>
      <button class="skill-detail__close" @click="emit('close')">✕</button>
    </div>

    <div class="skill-detail__meta">
      <span class="skill-detail__badge">{{ skill.sport }}</span>
      <span class="skill-detail__badge">D{{ skill.difficulty }} · {{ difficultyLabel }}</span>
    </div>

    <p v-if="skill.description" class="skill-detail__desc">{{ skill.description }}</p>

    <div class="skill-detail__section">
      <label class="skill-detail__label">Status</label>
      <select :key="selectKey" class="skill-detail__select" :value="progress.status" @change="onStatusChange">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div v-if="skill.progressions && skill.progressions.length > 0" class="skill-detail__section">
      <label class="skill-detail__label">Progressions</label>
      <div class="skill-detail__progressions">
        <button
          v-for="(prog, i) in skill.progressions"
          :key="i"
          class="skill-detail__prog-step"
          :class="{ 'skill-detail__prog-step--done': i < progress.current_step, 'skill-detail__prog-step--active': i === progress.current_step }"
          @click="onStepChange(i)"
        >
          <span class="skill-detail__prog-num">{{ i + 1 }}</span>
          <span class="skill-detail__prog-content">
            <span class="skill-detail__prog-name">{{ prog.name }}</span>
            <span v-if="prog.mastery_criteria" class="skill-detail__prog-criteria">{{ prog.mastery_criteria }}</span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="skill.masteryCriteria" class="skill-detail__section">
      <label class="skill-detail__label">Mastery criteria</label>
      <p class="skill-detail__mastery">{{ skill.masteryCriteria }}</p>
    </div>

    <div v-if="skill.tutorials" class="skill-detail__section">
      <label class="skill-detail__label">Tutorials</label>
      <div class="skill-detail__tutorials">
        <a v-if="skill.tutorials.main" :href="skill.tutorials.main" target="_blank" class="skill-detail__link">
          Main Tutorial ↗
        </a>
        <a v-if="skill.tutorials.alt" :href="skill.tutorials.alt" target="_blank" class="skill-detail__link">
          Alt Tutorial ↗
        </a>
      </div>
    </div>

    <div v-if="skill.requires && skill.requires.length > 0" class="skill-detail__section">
      <label class="skill-detail__label">Requires</label>
      <div class="skill-detail__requires">
        <span v-for="reqId in skill.requires" :key="reqId" class="skill-detail__req-tag">{{ reqId }}</span>
      </div>
    </div>

    <div class="skill-detail__section">
      <label class="skill-detail__label">Notes</label>
      <textarea
        class="skill-detail__notes"
        :value="progress.note"
        placeholder="Add a note..."
        rows="3"
        @input="progressStore.setNote(skill.id, ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
.skill-detail {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-page);
}

.skill-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.skill-detail__title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  color: var(--text-primary);
}

.skill-detail__close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 4px;
  line-height: 1;
}

.skill-detail__close:hover {
  color: var(--text-primary);
}

.skill-detail__meta {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.skill-detail__badge {
  font-size: 11px;
  background: var(--bg-muted);
  border-radius: 4px;
  padding: 2px 8px;
  color: var(--text-secondary);
  font-weight: 500;
}

.skill-detail__desc {
  font-size: 14px;
  color: var(--text-body);
  margin-bottom: 16px;
  line-height: 1.5;
}

.skill-detail__section {
  margin-bottom: 16px;
}

.skill-detail__label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  margin-bottom: 6px;
}

.skill-detail__select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-page);
  color: var(--text-primary);
  cursor: pointer;
}

.skill-detail__progressions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-detail__prog-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-surface);
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: var(--text-secondary);
}

.skill-detail__prog-step:hover {
  background: var(--bg-hover);
}

.skill-detail__prog-step--done {
  background: var(--prog-done-bg);
  border-color: var(--prog-done-border);
  color: var(--prog-done-text);
}

.skill-detail__prog-step--active {
  background: var(--prog-active-bg);
  border-color: var(--prog-active-border);
  color: var(--prog-active-text);
  font-weight: 600;
}

.skill-detail__prog-num {
  font-size: 11px;
  font-weight: 700;
  width: 18px;
  text-align: center;
  color: inherit;
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 1px;
}

.skill-detail__prog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.skill-detail__prog-name {
  font-size: 13px;
}

.skill-detail__prog-criteria {
  font-size: 11px;
  opacity: 0.75;
  line-height: 1.4;
}

.skill-detail__mastery {
  font-size: 13px;
  color: var(--text-body);
  line-height: 1.5;
  margin: 0;
  padding: 8px 10px;
  background: var(--bg-muted);
  border-radius: 6px;
  border-left: 3px solid var(--status-mastered);
}

.skill-detail__tutorials {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-detail__link {
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
}

.skill-detail__link:hover {
  text-decoration: underline;
}

.skill-detail__requires {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-detail__notes {
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

.skill-detail__notes::placeholder {
  color: var(--text-faint);
}

.skill-detail__notes:focus {
  outline: none;
  border-color: var(--status-in-progress);
}

.skill-detail__req-tag {
  font-size: 11px;
  background: var(--req-tag-bg);
  border: 1px solid var(--req-tag-border);
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--req-tag-text);
}
</style>
