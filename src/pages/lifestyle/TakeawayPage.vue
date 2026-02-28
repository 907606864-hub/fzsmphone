<template>
  <div class="takeaway-page">
    <NavBar title="外卖" back-to="/">
      <template #right>
        <button class="icon-btn" :disabled="aiStore.takeawayLoading" @click="refreshData">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: aiStore.takeawayLoading }">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </template>
    </NavBar>

    <!-- Search -->
    <div class="search-wrap">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input v-model="search" type="text" placeholder="搜索餐厅或菜品" />
      </div>
    </div>

    <!-- Categories -->
    <div class="categories">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="cat-btn"
        :class="{ active: currentCat === cat.id }"
        @click="currentCat = cat.id"
      >
        <span class="cat-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="cat.svg"></svg>
        </span>
        <span class="cat-label">{{ cat.label }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="aiStore.takeawayLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <div class="loading-text">AI 正在生成餐厅...</div>
    </div>

    <!-- Error -->
    <div v-if="aiStore.lastError && !aiStore.takeawayLoading" class="error-state">
      <div class="error-text">{{ aiStore.lastError }}</div>
      <button class="retry-btn" @click="refreshData">重试</button>
    </div>

    <!-- Restaurant List -->
    <div class="restaurant-list">
      <div v-if="filteredRestaurants.length === 0 && !aiStore.takeawayLoading" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3h18v18H3zM12 8v4M12 16h.01"/>
        </svg>
        <div class="empty-title">暂无餐厅</div>
        <button class="generate-btn" @click="refreshData">生成餐厅</button>
      </div>

      <div
        v-for="r in filteredRestaurants"
        :key="r.id"
        class="restaurant-card"
      >
        <div class="rest-img">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
        <div class="rest-info">
          <div class="rest-name">{{ r.name }}</div>
          <div class="rest-meta">
            <span class="rest-rating">★ {{ r.rating }}</span>
            <span class="rest-sep">·</span>
            <span class="rest-time">{{ r.delivery_time }}</span>
          </div>
          <div class="rest-tags">
            <span class="rest-cat">{{ r.category }}</span>
            <span v-if="r.min_order > 0" class="rest-min">¥{{ r.min_order }}起送</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useSocialAIStore } from '@/stores/socialAI'

const aiStore = useSocialAIStore()

const categories = [
  { id: 'all', label: '全部', svg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
  { id: '快餐', label: '快餐', svg: '<path d="M17 11H3M21 15H7M17 19H3M21 7H3"/>' },
  { id: '中餐', label: '中餐', svg: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>' },
  { id: '火锅', label: '火锅', svg: '<path d="M12 2c0 3-4 4-4 8s4 5 4 5 4-1 4-5-4-5-4-8z"/><ellipse cx="12" cy="19" rx="7" ry="3"/>' },
  { id: '烧烤', label: '烧烤', svg: '<line x1="4" y1="22" x2="4" y2="10"/><circle cx="4" cy="7" r="3"/><line x1="12" y1="22" x2="12" y2="10"/><circle cx="12" cy="7" r="3"/><line x1="20" y1="22" x2="20" y2="10"/><circle cx="20" cy="7" r="3"/>' },
  { id: '甜品', label: '甜品', svg: '<path d="M12 2a4 4 0 0 1 4 4c0 1-1 2-2 3h-4c-1-1-2-2-2-3a4 4 0 0 1 4-4zM6 9h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9z"/>' },
  { id: '饮品', label: '饮品', svg: '<path d="M17 8l-5 14-5-14"/><path d="M6 8h12"/><path d="M9 8a3 3 0 1 0 0-6"/>' },
]

const search = ref('')
const currentCat = ref('all')

const filteredRestaurants = computed(() => {
  let list = aiStore.takeawayRestaurants
  if (currentCat.value !== 'all') {
    list = list.filter(r => r.category === currentCat.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
  }
  return list
})

function refreshData() {
  aiStore.generateTakeawayContent()
}

onMounted(() => {
  aiStore.loadData('takeaway')
  if (aiStore.takeawayRestaurants.length === 0) {
    aiStore.generateTakeawayContent()
  }
})
</script>

<style scoped>
.takeaway-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

.search-wrap {
  padding: 8px 16px;
  background: var(--bg-primary);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--fill-tertiary);
  border-radius: 10px;
  padding: 0 12px;
  height: 36px;
}

.search-box svg { width: 16px; height: 16px; color: var(--text-quaternary); flex-shrink: 0; }

.search-box input {
  flex: 1; border: none; background: none; font-size: 14px;
  color: var(--text-primary); outline: none;
}
.search-box input::placeholder { color: var(--text-quaternary); }

/* Categories */
.categories {
  display: flex;
  gap: 0;
  padding: 10px 12px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--separator);
  overflow-x: auto;
  flex-shrink: 0;
}
.categories::-webkit-scrollbar { display: none; }

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  background: none;
  cursor: pointer;
  min-width: 56px;
  border-radius: 12px;
  transition: all 0.15s;
}

.cat-btn.active { background: rgba(88, 86, 214, 0.1); }

.cat-icon-wrap {
  width: 28px;
  height: 28px;
}

.cat-icon-wrap svg {
  width: 100%;
  height: 100%;
  color: var(--text-secondary);
}

.cat-btn.active .cat-icon-wrap svg {
  color: var(--brand-primary);
}

.cat-label { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
.cat-btn.active .cat-label { color: var(--brand-primary); font-weight: 600; }

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--fill-tertiary);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text { font-size: 14px; color: var(--text-tertiary); }

/* Error */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 8px;
}
.error-text { font-size: 13px; color: var(--ios-red); text-align: center; }
.retry-btn {
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid var(--brand-primary);
  background: none;
  color: var(--brand-primary);
  font-size: 13px;
  cursor: pointer;
}

/* Restaurant List */
.restaurant-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.restaurant-card {
  display: flex;
  gap: 12px;
  background: var(--bg-primary);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.15s var(--ease-ios);
}

.restaurant-card:active { transform: scale(0.98); }

.rest-img {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #ffd93d33, #ff6b6b33);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rest-img svg { width: 36px; height: 36px; color: var(--text-tertiary); }

.rest-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.rest-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rest-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.rest-rating { color: var(--ios-orange); }
.rest-sep { color: var(--text-quaternary); }

.rest-tags {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.rest-cat {
  color: var(--text-tertiary);
  background: var(--fill-tertiary);
  padding: 1px 6px;
  border-radius: 4px;
}

.rest-min {
  color: var(--text-tertiary);
}

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 12px; }
.empty-icon { width: 48px; height: 48px; color: var(--text-quaternary); }
.empty-title { font-size: 17px; font-weight: 600; color: var(--text-secondary); }

.generate-btn {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  background: var(--brand-primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.icon-btn {
  width: 32px; height: 32px; border: none; background: none;
  color: var(--brand-primary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:active { opacity: 0.5; }
.icon-btn svg { width: 22px; height: 22px; }
.icon-btn svg.spinning { animation: spin 1s linear infinite; }
</style>
