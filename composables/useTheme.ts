export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'skilltreq:theme'

const theme = ref<Theme>('system')
let mqListenerRegistered = false

function isDark(t: Theme): boolean {
  if (t === 'dark') return true
  if (t === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark(theme.value))
}

export function useTheme() {
  function setTheme(t: Theme) {
    theme.value = t
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme()
  }

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    theme.value = stored ?? 'system'
    applyTheme()

    if (!mqListenerRegistered) {
      mqListenerRegistered = true
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
    }
  })

  return { theme: readonly(theme), setTheme }
}
