import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'

export interface FeatureItem {
  id: string
  name: string
  category: string
  enabled: boolean
}

export const useFeaturesStore = defineStore('features', () => {
  const features = ref<FeatureItem[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  // Quick lookup map: featureId -> enabled
  const enabledMap = computed(() => {
    const map: Record<string, boolean> = {}
    for (const f of features.value) {
      map[f.id] = f.enabled
    }
    return map
  })

  /** Check if a feature is enabled. Defaults to true if unknown. */
  function isEnabled(featureId: string): boolean {
    if (!loaded.value) return true // not loaded yet, allow by default
    const val = enabledMap.value[featureId]
    return val === undefined ? true : val
  }

  async function fetchFeatures() {
    if (loaded.value) return // only fetch once per session
    loading.value = true
    try {
      const res = await api.get<{ data: FeatureItem[] }>('/api/features')
      features.value = res.data || []
      loaded.value = true
    } catch {
      // If it fails, keep everything enabled by default
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /** Admin: update feature flags */
  async function updateFeatures(flags: Record<string, boolean>) {
    await api.put('/api/features', flags)
    // Apply locally
    for (const f of features.value) {
      if (flags[f.id] !== undefined) {
        f.enabled = flags[f.id]
      }
    }
  }

  return {
    features,
    loading,
    loaded,
    enabledMap,
    isEnabled,
    fetchFeatures,
    updateFeatures,
  }
})
