<script setup lang="ts">
import { useToast, type ToastType } from '../composables/useToast'
import type { IconName } from './HIcon.vue'

const { toasts, remove } = useToast()

const iconName: Record<ToastType, IconName> = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'information-circle',
  warning: 'exclamation-triangle',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :data-type="toast.type"
          role="status"
          @click="remove(toast.id)"
        >
          <HIcon :name="iconName[toast.type]" :size="16" class="toast__icon" />
          <span class="toast__msg">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 400;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  border: 1px solid transparent;
  max-width: 320px;
  line-height: 1.4;
}

.toast[data-type='success'] {
  background: var(--prog-done-bg);
  border-color: var(--prog-done-border);
  color: var(--prog-done-text);
}

.toast[data-type='error'] {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.toast[data-type='info'] {
  background: var(--prog-active-bg);
  border-color: var(--prog-active-border);
  color: var(--prog-active-text);
}

.toast[data-type='warning'] {
  background: var(--req-tag-bg);
  border-color: var(--req-tag-border);
  color: var(--req-tag-text);
}

.toast__icon {
  font-size: 14px;
  flex-shrink: 0;
}

/* TransitionGroup */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.toast-move {
  transition: transform 0.2s ease;
}
</style>
