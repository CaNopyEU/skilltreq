import { defineStore } from 'pinia'

export type ProgressStatus = 'locked' | 'in_progress' | 'unlocked' | 'mastered'

export interface SkillProgress {
  status: ProgressStatus
  current_step: number
  note: string
}

interface ProgressData {
  version: string
  skills: Record<string, SkillProgress>
}

const STORAGE_KEY = 'skilltreq:progress'

function loadFromStorage(): ProgressData {
  if (typeof localStorage === 'undefined') return { version: '1.0', skills: {} }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ProgressData
  } catch {
    // ignore
  }
  return { version: '1.0', skills: {} }
}

function saveToStorage(data: ProgressData) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useProgressStore = defineStore('progress', () => {
  const data = ref<ProgressData>({ version: '1.0', skills: {} })

  function init() {
    data.value = loadFromStorage()
  }

  function getProgress(skillId: string): SkillProgress {
    return data.value.skills[skillId] ?? { status: 'locked', current_step: 0, note: '' }
  }

  function setStatus(skillId: string, status: ProgressStatus) {
    const current = getProgress(skillId)
    data.value.skills[skillId] = { ...current, status }
    saveToStorage(data.value)
  }

  function advanceStep(skillId: string) {
    const current = getProgress(skillId)
    data.value.skills[skillId] = { ...current, current_step: current.current_step + 1 }
    saveToStorage(data.value)
  }

  function setNote(skillId: string, note: string) {
    const current = getProgress(skillId)
    data.value.skills[skillId] = { ...current, note }
    saveToStorage(data.value)
  }

  function setStep(skillId: string, step: number) {
    const current = getProgress(skillId)
    data.value.skills[skillId] = { ...current, current_step: step }
    saveToStorage(data.value)
  }

  return {
    data,
    init,
    getProgress,
    setStatus,
    advanceStep,
    setNote,
    setStep,
  }
})
