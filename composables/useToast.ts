import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

let _id = 0
const toasts = ref<Toast[]>([])

export function useToast() {
  function remove(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function add(message: string, type: ToastType = 'info', duration = 3000) {
    const id = ++_id
    toasts.value.push({ id, type, message })
    setTimeout(() => remove(id), duration)
  }

  return {
    toasts,
    remove,
    success: (msg: string, dur?: number) => add(msg, 'success', dur),
    error: (msg: string, dur?: number) => add(msg, 'error', dur),
    info: (msg: string, dur?: number) => add(msg, 'info', dur),
    warning: (msg: string, dur?: number) => add(msg, 'warning', dur),
  }
}
