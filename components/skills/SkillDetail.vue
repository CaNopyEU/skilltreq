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

function onStatusChange(e: Event) {
  if (!skill.value) return
  const val = (e.target as HTMLSelectElement).value as ProgressStatus
  progressStore.setStatus(skill.value.id, val)
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
      <select class="skill-detail__select" :value="progress.status" @change="onStatusChange">
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
          <span class="skill-detail__prog-name">{{ prog.name }}</span>
        </button>
      </div>
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
  </div>
</template>

<style scoped>
.skill-detail {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background: white;
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
}

.skill-detail__close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 0 4px;
  line-height: 1;
}

.skill-detail__close:hover {
  color: #1f2937;
}

.skill-detail__meta {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.skill-detail__badge {
  font-size: 11px;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 2px 8px;
  color: #374151;
  font-weight: 500;
}

.skill-detail__desc {
  font-size: 14px;
  color: #4b5563;
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
  color: #9ca3af;
  margin-bottom: 6px;
}

.skill-detail__select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
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
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
}

.skill-detail__prog-step:hover {
  background: #f3f4f6;
}

.skill-detail__prog-step--done {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

.skill-detail__prog-step--active {
  background: #dbeafe;
  border-color: #bfdbfe;
  color: #1e40af;
  font-weight: 600;
}

.skill-detail__prog-num {
  font-size: 11px;
  font-weight: 700;
  width: 18px;
  text-align: center;
  color: inherit;
}

.skill-detail__prog-name {
  flex: 1;
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

.skill-detail__req-tag {
  font-size: 11px;
  background: #fef9c3;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 2px 6px;
  color: #92400e;
}
</style>
