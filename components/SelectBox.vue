<script setup lang="ts">
import type { IconName } from './HIcon.vue'

export interface SelectOption {
  value: string
  label: string
  icon?: IconName  // optional leading icon (uses HIcon)
}

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    modelValue: string
    placeholder?: string
    block?: boolean   // true → display: block; width: 100%
  }>(),
  { placeholder: 'Select...', block: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const rootRef = ref<HTMLElement>()

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function select(value: string) {
  emit('update:modelValue', value)
  close()
}

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue))
const selectedLabel = computed(() => selectedOption.value?.label ?? props.placeholder)

// Close on outside click
function handleDocClick(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) close()
}

onMounted(() => document.addEventListener('click', handleDocClick, true))
onUnmounted(() => document.removeEventListener('click', handleDocClick, true))

// Close on Escape
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
</script>

<template>
  <div
    ref="rootRef"
    class="select-box"
    :class="{ 'select-box--block': block }"
    @keydown="handleKeydown"
  >
    <button type="button" class="select-box__trigger" @click="toggle">
      <HIcon
        v-if="selectedOption?.icon"
        :name="selectedOption.icon"
        :size="13"
        class="select-box__trigger-icon"
      />
      <span class="select-box__value">{{ selectedLabel }}</span>
      <HIcon :name="isOpen ? 'chevron-up' : 'chevron-down'" :size="11" class="select-box__chevron" />
    </button>

    <div v-if="isOpen" class="select-box__dropdown">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="select-box__option"
        :class="{ 'select-box__option--selected': opt.value === modelValue }"
        @click="select(opt.value)"
      >
        <HIcon v-if="opt.icon" :name="opt.icon" :size="13" class="select-box__opt-icon" />
        <span class="select-box__opt-label">{{ opt.label }}</span>
        <HIcon v-if="opt.value === modelValue" name="check" :size="11" class="select-box__opt-check" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.select-box {
  position: relative;
  display: inline-block;
}

.select-box--block {
  display: block;
  width: 100%;
}

/* ── Trigger ── */
.select-box__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-page);
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
  width: 100%;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
}

.select-box__trigger:hover {
  background: var(--bg-hover);
}

.select-box__trigger-icon {
  color: var(--text-faint);
  flex-shrink: 0;
}

.select-box__value {
  flex: 1;
}

.select-box__chevron {
  color: var(--text-faint);
  flex-shrink: 0;
}

/* ── Dropdown ── */
.select-box__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 200;
  overflow: hidden;
}

/* ── Options ── */
.select-box__option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.select-box__option:hover {
  background: var(--bg-hover);
}

.select-box__option--selected {
  color: var(--text-primary);
  font-weight: 500;
}

.select-box__opt-icon {
  color: var(--text-faint);
  flex-shrink: 0;
}

.select-box__option--selected .select-box__opt-icon {
  color: var(--text-secondary);
}

.select-box__opt-label {
  flex: 1;
  white-space: nowrap;
}

.select-box__opt-check {
  color: var(--status-in-progress);
  flex-shrink: 0;
}
</style>
