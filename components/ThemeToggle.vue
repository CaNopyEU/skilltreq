<script setup lang="ts">
const { theme, setTheme } = useTheme()

const options = [
  { value: 'system' as const, label: 'Auto' },
  { value: 'light' as const, label: '☀' },
  { value: 'dark' as const, label: '🌙' },
]
</script>

<template>
  <div class="theme-toggle">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="theme-toggle__btn"
      :class="{ 'theme-toggle__btn--active': theme === opt.value }"
      @click="setTheme(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  gap: 2px;
  background: var(--bg-muted);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2px;
}

.theme-toggle__btn {
  padding: 2px 8px;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1.5;
}

.theme-toggle__btn--active {
  background: var(--bg-page);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
</style>
