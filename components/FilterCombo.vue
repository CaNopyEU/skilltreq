<script setup lang="ts">
export interface FilterOption {
  value: string
  label: string
  color?: string  // hex color — shows as a dot
  meta?: string   // right-aligned secondary text (e.g. "3/8 ★1")
}

const props = withDefaults(
  defineProps<{
    label: string
    options: FilterOption[]
    modelValue: string | string[]
    multi?: boolean
    placeholder?: string
  }>(),
  { multi: false, placeholder: 'All' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const isOpen = ref(false)
const rootRef = ref<HTMLElement>()

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function isSelected(value: string): boolean {
  if (props.multi) return (props.modelValue as string[]).includes(value)
  return props.modelValue === value
}

function select(value: string) {
  if (props.multi) {
    const current = props.modelValue as string[]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', value)
    close()
  }
}

// Whether any non-default filter is active (used for trigger highlight)
const isFiltered = computed(() => {
  if (props.multi) return (props.modelValue as string[]).length > 0
  const val = props.modelValue as string
  return val !== '' && val !== 'all'
})

const triggerText = computed(() => {
  if (props.multi) {
    const sel = props.modelValue as string[]
    if (!sel.length) return props.placeholder
    if (sel.length === 1) return props.options.find((o) => o.value === sel[0])?.label ?? props.placeholder
    return `${sel.length} selected`
  }
  const val = props.modelValue as string
  return props.options.find((o) => o.value === val)?.label ?? props.placeholder
})

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
  <div ref="rootRef" class="filter-combo" @keydown="handleKeydown">
    <span class="filter-combo__label">{{ label }}</span>

    <div class="filter-combo__wrapper">
      <button
        type="button"
        class="filter-combo__trigger"
        :class="{ 'filter-combo__trigger--active': isFiltered }"
        @click="toggle"
      >
        <span class="filter-combo__trigger-text">{{ triggerText }}</span>
        <HIcon :name="isOpen ? 'chevron-up' : 'chevron-down'" :size="11" class="filter-combo__chevron" />
      </button>

      <div v-if="isOpen" class="filter-combo__dropdown">
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="filter-combo__option"
          :class="{ 'filter-combo__option--selected': isSelected(opt.value) }"
          @click="select(opt.value)"
        >
          <!-- Checkbox for multi-select -->
          <span v-if="multi" class="filter-combo__check" :class="{ 'filter-combo__check--on': isSelected(opt.value) }">
            <HIcon v-if="isSelected(opt.value)" name="check" :size="9" />
          </span>

          <!-- Color dot for categories -->
          <span v-if="opt.color" class="filter-combo__dot" :style="{ backgroundColor: opt.color }" />

          <span class="filter-combo__opt-label">{{ opt.label }}</span>

          <!-- Right-aligned meta (tracker) -->
          <span v-if="opt.meta" class="filter-combo__meta">{{ opt.meta }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-combo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-combo__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  white-space: nowrap;
}

.filter-combo__wrapper {
  position: relative;
}

/* ── Trigger ── */
.filter-combo__trigger {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-page);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  min-width: 76px;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}

.filter-combo__trigger:hover {
  background: var(--bg-hover);
}

.filter-combo__trigger--active {
  border-color: #3b82f6;
  color: var(--text-primary);
}

.filter-combo__trigger-text {
  flex: 1;
  text-align: left;
}

.filter-combo__chevron {
  color: var(--text-faint);
  flex-shrink: 0;
}

/* ── Dropdown ── */
.filter-combo__dropdown {
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
.filter-combo__option {
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

.filter-combo__option:hover {
  background: var(--bg-hover);
}

.filter-combo__option--selected {
  color: var(--text-primary);
}

/* ── Checkbox (multi only) ── */
.filter-combo__check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-muted);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--bg-page);
  color: transparent;
}

.filter-combo__check--on {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* ── Color dot ── */
.filter-combo__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Labels ── */
.filter-combo__opt-label {
  flex: 1;
  white-space: nowrap;
}

.filter-combo__meta {
  font-size: 11px;
  color: var(--text-faint);
  white-space: nowrap;
  margin-left: 4px;
}
</style>
