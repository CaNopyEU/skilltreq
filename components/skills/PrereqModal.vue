<script setup lang="ts">
import type { ProgressStatus } from '../../stores/useProgressStore'

defineProps<{
  blocking: { id: string; name: string; status: ProgressStatus }[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="prereq-modal__backdrop" @click.self="emit('cancel')">
      <div class="prereq-modal">
        <h3 class="prereq-modal__title">Prerequisites not met</h3>
        <p class="prereq-modal__desc">The following skills must be completed first:</p>
        <ul class="prereq-modal__list">
          <li v-for="s in blocking" :key="s.id" class="prereq-modal__item">
            <span class="prereq-modal__dot" :data-status="s.status" />
            {{ s.name }}
          </li>
        </ul>
        <div class="prereq-modal__actions">
          <button class="prereq-modal__btn prereq-modal__btn--cancel" @click="emit('cancel')">Cancel</button>
          <button class="prereq-modal__btn prereq-modal__btn--confirm" @click="emit('confirm')">
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.prereq-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.prereq-modal {
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
  width: 340px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.prereq-modal__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.prereq-modal__desc {
  font-size: 13px;
  color: var(--text-body);
  margin: 0 0 14px;
}

.prereq-modal__list {
  list-style: none;
  padding: 0;
  margin: 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prereq-modal__item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}

.prereq-modal__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.prereq-modal__dot[data-status='locked'] { background: var(--status-locked); }
.prereq-modal__dot[data-status='in_progress'] { background: var(--status-in-progress); }
.prereq-modal__dot[data-status='unlocked'] { background: var(--status-unlocked); }
.prereq-modal__dot[data-status='mastered'] { background: var(--status-mastered); }

.prereq-modal__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.prereq-modal__btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--border-muted);
}

.prereq-modal__btn--cancel {
  background: var(--bg-surface);
  color: var(--text-secondary);
}

.prereq-modal__btn--cancel:hover {
  background: var(--bg-hover);
}

.prereq-modal__btn--confirm {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.prereq-modal__btn--confirm:hover {
  background: #dc2626;
}
</style>
