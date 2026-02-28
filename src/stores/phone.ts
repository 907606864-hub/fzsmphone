import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCharacterById } from '@/utils/aiService'
import { callApi } from '@/api/services'

export interface CallRecord {
  id: string
  name: string
  number: string
  characterId: string
  avatar?: string
  type: 'incoming' | 'outgoing' | 'missed'
  callType: 'voice' | 'video'
  time: string
  duration: string
  timestamp: number
}

export interface Contact {
  id: string
  characterId: string
  name: string
  number: string
  avatar?: string
  color: string
}

const CALL_HISTORY_KEY = 'fzsm-call-history'
const CONTACTS_KEY = 'fzsm-contacts'

export const usePhoneStore = defineStore('phone', () => {
  // === 电池 ===
  const batteryLevel = ref(85)
  const isCharging = ref(false)
  let batteryTimer: ReturnType<typeof setInterval> | null = null

  function startBatteryDrain() {
    stopBatteryTimer()
    batteryTimer = setInterval(() => {
      if (!isCharging.value && batteryLevel.value > 0) {
        batteryLevel.value = Math.max(0, batteryLevel.value - 1)
      } else if (isCharging.value && batteryLevel.value < 100) {
        batteryLevel.value = Math.min(100, batteryLevel.value + 1)
      }
    }, isCharging.value ? 2000 : 60000)
  }

  function toggleCharging() {
    isCharging.value = !isCharging.value
    startBatteryDrain()
  }

  function stopBatteryTimer() {
    if (batteryTimer) {
      clearInterval(batteryTimer)
      batteryTimer = null
    }
  }

  // === 控制中心 ===
  const brightness = ref(100)
  const volume = ref(50)
  const wifiEnabled = ref(true)
  const airplaneMode = ref(false)
  const bluetoothEnabled = ref(false)

  const networkEnabled = computed(() => !airplaneMode.value && wifiEnabled.value)

  // === 主题 ===
  const theme = ref<'light' | 'dark'>('dark')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  function initTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  // === 通话记录 ===
  const callHistory = ref<CallRecord[]>([])
  const contacts = ref<Contact[]>([])

  async function loadCallHistory() {
    try {
      const res = await callApi.list()
      if (res.data) {
        callHistory.value = res.data.map((r: any) => ({
          id: String(r.id),
          name: r.name || '',
          number: r.number || '',
          characterId: r.character_id || '',
          avatar: r.avatar || '',
          type: r.type || 'outgoing',
          callType: r.call_type || 'voice',
          time: r.time || '',
          duration: r.duration || '',
          timestamp: new Date(r.created_at || Date.now()).getTime(),
        }))
        return
      }
    } catch { /* API failed, fallback */ }
    try {
      const saved = localStorage.getItem(CALL_HISTORY_KEY)
      if (saved) callHistory.value = JSON.parse(saved)
    } catch { /* ignore */ }
  }

  function saveCallHistoryLocal() {
    try {
      const toSave = callHistory.value.slice(0, 50)
      localStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(toSave))
    } catch { /* ignore */ }
  }

  // Keep backward compat alias
  const saveCallHistory = saveCallHistoryLocal

  async function addCallRecord(record: Omit<CallRecord, 'id' | 'timestamp'>) {
    const newRecord: CallRecord = {
      ...record,
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    }
    callHistory.value.unshift(newRecord)
    saveCallHistoryLocal()
    try {
      await callApi.create({
        name: record.name,
        number: record.number,
        character_id: record.characterId,
        type: record.type,
        call_type: record.callType,
        duration: record.duration,
      })
    } catch { /* ignore API error */ }
    return newRecord
  }

  async function clearCallHistory() {
    callHistory.value = []
    saveCallHistoryLocal()
    try { await callApi.clear() } catch { /* ignore */ }
  }

  // === 联系人（从角色同步） ===
  function loadContacts() {
    try {
      // 从角色列表生成联系人
      const charsStr = localStorage.getItem('characters')
      if (!charsStr) return
      const chars = JSON.parse(charsStr)
      if (!Array.isArray(chars)) return

      const colors = ['#ff2d55', '#007aff', '#ff9500', '#5856d6', '#34c759', '#af52de', '#ff6348']
      const roleChars = chars.filter((c: any) => c.type === 'char')

      contacts.value = roleChars.map((char: any, index: number) => ({
        id: `contact-${char.id}`,
        characterId: char.id,
        name: char.name || '未命名',
        number: generatePhoneNumber(char.id),
        avatar: char.avatar || '',
        color: colors[index % colors.length],
      }))
    } catch {
      // ignore
    }
  }

  function generatePhoneNumber(charId: string | number): string {
    const id = String(charId)
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i)
      hash |= 0
    }
    const num = Math.abs(hash) % 90000000 + 10000000
    return `138${num}`
  }

  // 根据号码查找联系人
  function findContactByNumber(number: string): Contact | null {
    return contacts.value.find(c => c.number === number) || null
  }

  // 根据角色ID查找联系人
  function findContactByCharacterId(charId: string): Contact | null {
    return contacts.value.find(c => c.characterId === charId) || null
  }

  return {
    // 电池
    batteryLevel,
    isCharging,
    startBatteryDrain,
    toggleCharging,
    stopBatteryTimer,
    // 控制中心
    brightness,
    volume,
    wifiEnabled,
    airplaneMode,
    bluetoothEnabled,
    networkEnabled,
    // 主题
    theme,
    toggleTheme,
    initTheme,
    // 通话记录
    callHistory,
    loadCallHistory,
    saveCallHistory,
    addCallRecord,
    clearCallHistory,
    // 联系人
    contacts,
    loadContacts,
    findContactByNumber,
    findContactByCharacterId,
    generatePhoneNumber,
  }
})
