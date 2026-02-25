<template>
  <div class="feature-manage-page">
    <nav-bar title="功能管理" back-route="/" />

    <div class="page-content">
      <div v-if="!authStore.isAdmin" class="no-access">
        <p>⛔ 需要管理员权限</p>
      </div>

      <template v-else>
        <p class="page-desc">开关控制用户可用的功能模块，关闭后用户将无法看到或访问该功能。</p>

        <div v-if="loading" class="loading">加载中...</div>

        <div v-else class="feature-list">
          <div
            v-for="category in groupedFeatures"
            :key="category.name"
            class="category-section"
          >
            <div class="category-header">
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">
                {{ category.enabledCount }}/{{ category.items.length }}
              </span>
            </div>

            <div class="category-items">
              <div
                v-for="feature in category.items"
                :key="feature.id"
                class="feature-item"
              >
                <div class="feature-info">
                  <span class="feature-name">{{ feature.name }}</span>
                  <span class="feature-id">{{ feature.id }}</span>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="feature.enabled"
                    @change="toggleFeature(feature)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div v-if="saving" class="save-indicator">保存中...</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { useFeaturesStore, type FeatureItem } from '@/stores/features'

const authStore = useAuthStore()
const featuresStore = useFeaturesStore()

const loading = ref(false)
const saving = ref(false)

interface CategoryGroup {
  name: string
  items: FeatureItem[]
  enabledCount: number
}

const groupedFeatures = computed<CategoryGroup[]>(() => {
  const map = new Map<string, FeatureItem[]>()
  for (const f of featuresStore.features) {
    const list = map.get(f.category) || []
    list.push(f)
    map.set(f.category, list)
  }
  const groups: CategoryGroup[] = []
  for (const [name, items] of map) {
    groups.push({
      name,
      items,
      enabledCount: items.filter((i) => i.enabled).length,
    })
  }
  return groups
})

async function toggleFeature(feature: FeatureItem) {
  const newState = !feature.enabled
  saving.value = true
  try {
    await featuresStore.updateFeatures({ [feature.id]: newState })
  } catch (e: any) {
    alert('保存失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAdmin) return
  loading.value = true
  // Force re-fetch to get latest state
  featuresStore.loaded = false
  await featuresStore.fetchFeatures()
  loading.value = false
})
</script>

<style scoped>
.feature-manage-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg, #000);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.page-content::-webkit-scrollbar {
  display: none;
}

.page-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 20px;
  line-height: 1.5;
}

.no-access {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.loading {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
}

/* Category */
.category-section {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.category-items {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

/* Feature Item */
.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name {
  font-size: 15px;
  color: #fff;
  font-weight: 500;
}

.feature-id {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-family: monospace;
}

/* Toggle Switch (iOS style) */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: rgba(120, 120, 128, 0.32);
  border-radius: 31px;
  transition: background 0.25s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 27px;
  width: 27px;
  left: 2px;
  bottom: 2px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.06);
}

.toggle-switch input:checked + .toggle-slider {
  background: #34c759;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* Save indicator */
.save-indicator {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 100;
}
</style>
