import { defineStore } from 'pinia'
import { ref } from 'vue'
import { diaryApi } from '@/api/services'
import type { Diary, DiaryInput } from '@/api/types'

const LOCAL_KEY = 'diary-local-data'
let nextLocalId = Date.now()

function loadFromLocal(): Diary[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveToLocal(diaries: Diary[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(diaries))
  } catch { /* ignore */ }
}

export const useDiaryStore = defineStore('diary', () => {
  const diaries = ref<Diary[]>([])
  const currentDiary = ref<Diary | null>(null)
  const loading = ref(false)

  async function fetchDiaries() {
    loading.value = true
    try {
      const res = await diaryApi.list()
      diaries.value = res.data || []
      // Sync to local as backup
      if (diaries.value.length > 0) saveToLocal(diaries.value)
    } catch {
      // Fallback to localStorage
      diaries.value = loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  async function fetchDiary(id: number) {
    try {
      currentDiary.value = await diaryApi.get(id)
    } catch {
      currentDiary.value = diaries.value.find(d => d.id === id) || null
    }
  }

  async function createDiary(data: DiaryInput) {
    try {
      const res = await diaryApi.create(data)
      await fetchDiaries()
      return res.id
    } catch {
      // Local fallback
      const newDiary: Diary = {
        ...data,
        id: nextLocalId++,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Diary
      diaries.value.unshift(newDiary)
      saveToLocal(diaries.value)
      return newDiary.id
    }
  }

  async function updateDiary(id: number, data: DiaryInput) {
    try {
      await diaryApi.update(id, data)
      const idx = diaries.value.findIndex(d => d.id === id)
      if (idx !== -1) {
        diaries.value[idx] = { ...diaries.value[idx], ...data, updated_at: new Date().toISOString() } as Diary
      }
      if (currentDiary.value?.id === id) {
        currentDiary.value = { ...currentDiary.value, ...data } as Diary
      }
    } catch {
      // Local fallback
      const idx = diaries.value.findIndex(d => d.id === id)
      if (idx !== -1) {
        diaries.value[idx] = { ...diaries.value[idx], ...data, updated_at: new Date().toISOString() } as Diary
      }
      if (currentDiary.value?.id === id) {
        currentDiary.value = { ...currentDiary.value, ...data } as Diary
      }
      saveToLocal(diaries.value)
    }
  }

  async function deleteDiary(id: number) {
    try {
      await diaryApi.delete(id)
    } catch { /* ignore */ }
    diaries.value = diaries.value.filter(d => d.id !== id)
    if (currentDiary.value?.id === id) {
      currentDiary.value = null
    }
    saveToLocal(diaries.value)
  }

  return {
    diaries,
    currentDiary,
    loading,
    fetchDiaries,
    fetchDiary,
    createDiary,
    updateDiary,
    deleteDiary,
  }
})
