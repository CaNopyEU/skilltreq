<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmVariant?: 'primary' | 'danger'
    width?: string
  }>(),
  {
    confirmVariant: 'primary',
    width: '380px',
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
  cancel: []
}>()

function onCancel() {
  emit('cancel')
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) onCancel()
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="bmodal">
      <div v-if="open" class="bmodal-backdrop" @click.self="onCancel">
        <div class="bmodal" :style="{ width }">
          <div v-if="title || $slots.header" class="bmodal__header">
            <slot name="header">
              <h3 class="bmodal__title">{{ title }}</h3>
            </slot>
          </div>

          <div class="bmodal__body">
            <slot />
          </div>

          <div v-if="$slots.footer || confirmLabel" class="bmodal__footer">
            <slot name="footer">
              <button class="bmodal__btn bmodal__btn--cancel" @click="onCancel">
                {{ cancelLabel ?? 'Zrušiť' }}
              </button>
              <button
                class="bmodal__btn bmodal__btn--confirm"
                :data-variant="confirmVariant"
                @click="emit('confirm')"
              >
                {{ confirmLabel }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bmodal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.bmodal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
  max-width: 90vw;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
}

.bmodal__header {
  margin-bottom: 12px;
}

.bmodal__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.bmodal__body {
  font-size: 13px;
  color: var(--text-body);
  line-height: 1.55;
}

.bmodal__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.bmodal__btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-muted);
  transition: background 0.15s;
}

.bmodal__btn--cancel {
  background: var(--bg-muted);
  color: var(--text-secondary);
}

.bmodal__btn--cancel:hover {
  background: var(--bg-hover);
}

.bmodal__btn--confirm[data-variant='primary'] {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.bmodal__btn--confirm[data-variant='primary']:hover {
  background: #2563eb;
}

.bmodal__btn--confirm[data-variant='danger'] {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

.bmodal__btn--confirm[data-variant='danger']:hover {
  background: #dc2626;
}

/* Transition */
.bmodal-enter-active,
.bmodal-leave-active {
  transition: opacity 0.18s ease;
}

.bmodal-enter-active .bmodal,
.bmodal-leave-active .bmodal {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.bmodal-enter-from,
.bmodal-leave-to {
  opacity: 0;
}

.bmodal-enter-from .bmodal,
.bmodal-leave-to .bmodal {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}
</style>
