<template>
  <div class="restaurant-page">
    <NavBar title="餐厅" back-to="/takeaway" />

    <div class="page-content">
      <!-- 生成按钮 -->
      <button v-if="filteredRestaurants.length === 0 && !loading" class="gen-btn" @click="generateData">
        ✦ 生成餐厅数据
      </button>

      <!-- 加载 -->
      <div class="loading" v-if="loading">生成中...</div>

      <!-- 分类标签 -->
      <div class="category-tabs" v-if="!loading && allRestaurants.length > 0">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="cat-tab"
          :class="{ active: activeCategory === cat.value }"
          @click="activeCategory = cat.value"
        >
          {{ cat.icon }} {{ cat.label }}
        </button>
      </div>

      <!-- 空状态 -->
      <div class="empty" v-if="!loading && allRestaurants.length > 0 && filteredRestaurants.length === 0">
        <div class="empty-icon">◈</div>
        <p>该分类暂无餐厅</p>
      </div>

      <!-- 餐厅列表 -->
      <div class="restaurant-list" v-if="filteredRestaurants.length > 0">
        <div
          v-for="rest in filteredRestaurants"
          :key="rest.id"
          class="restaurant-card"
          @click="selectRestaurant(rest)"
        >
          <div class="rest-image">
            <div class="rest-image-placeholder">▢</div>
          </div>
          <div class="rest-info">
            <div class="rest-name">{{ rest.name }}</div>
            <div class="rest-meta">
              <span class="rest-rating">★ {{ rest.rating }}</span>
              <span class="rest-time">◔ {{ rest.delivery_time }}</span>
            </div>
            <div class="rest-min">¥{{ rest.min_order }} 起送</div>
          </div>
        </div>
      </div>

      <!-- 餐厅菜单弹窗 -->
      <div class="menu-overlay" v-if="selectedRestaurant" @click.self="selectedRestaurant = null">
        <div class="menu-panel">
          <div class="menu-header">
            <div class="menu-title">{{ selectedRestaurant.name }}</div>
            <button class="close-btn" @click="selectedRestaurant = null">✕</button>
          </div>

          <div class="menu-items">
            <div v-if="!selectedRestaurant.menu || selectedRestaurant.menu.length === 0" class="menu-empty">
              暂无菜品
            </div>
            <div
              v-for="(item, idx) in selectedRestaurant.menu"
              :key="idx"
              class="menu-item"
            >
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-price">¥{{ item.price.toFixed(2) }}</div>
              </div>
              <button class="add-cart-btn" @click="addToCart(item)">
                +
              </button>
            </div>
          </div>

          <!-- 购物车栏 -->
          <div class="cart-bar" v-if="cartCount > 0">
            <div class="cart-info">
              <span class="cart-badge">{{ cartCount }}</span>
              <span class="cart-total">¥{{ cartTotal.toFixed(2) }}</span>
            </div>
            <button class="checkout-btn" @click="handleCheckout">去结算</button>
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
import type { TakeawayRestaurant, TakeawayMenuItem } from '@/utils/socialParsers'

const socialAI = useSocialAIStore()
const loading = ref(false)
const activeCategory = ref('')
const selectedRestaurant = ref<TakeawayRestaurant | null>(null)

// Local cart
const cart = ref<Map<string, { name: string; price: number; quantity: number }>>(new Map())
const cartCount = computed(() => Array.from(cart.value.values()).reduce((s, i) => s + i.quantity, 0))
const cartTotal = computed(() => Array.from(cart.value.values()).reduce((s, i) => s + i.price * i.quantity, 0))

const categories = [
  { value: '', label: '全部', icon: '▲' },
  { value: '快餐', label: '快餐', icon: '◆' },
  { value: '中餐', label: '中餐', icon: '◈' },
  { value: '火锅', label: '火锅', icon: '◎' },
  { value: '甜品', label: '甜品', icon: '●' },
  { value: '饮品', label: '饮品', icon: '◇' },
  { value: '烧烤', label: '烧烤', icon: '▣' },
]

const allRestaurants = computed(() => socialAI.takeawayRestaurants || [])
const filteredRestaurants = computed(() => {
  if (!activeCategory.value) return allRestaurants.value
  return allRestaurants.value.filter((r: TakeawayRestaurant) =>
    r.category.includes(activeCategory.value)
  )
})

onMounted(() => {
  socialAI.loadData('takeaway')
})

async function generateData() {
  loading.value = true
  try {
    await socialAI.generateTakeawayContent()
  } finally {
    loading.value = false
  }
}

function selectRestaurant(rest: TakeawayRestaurant) {
  selectedRestaurant.value = rest
  cart.value = new Map()
}

function addToCart(item: TakeawayMenuItem) {
  const existing = cart.value.get(item.name)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.set(item.name, { name: item.name, price: item.price, quantity: 1 })
  }
  cart.value = new Map(cart.value)
}

function handleCheckout() {
  selectedRestaurant.value = null
  cart.value = new Map()
}
</script>

<style scoped>
.restaurant-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.gen-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff6b35, #ff9553);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
}

.gen-btn:active { transform: scale(0.98); }

.loading, .empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.cat-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-tab.active {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

/* 餐厅列表 */
.restaurant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.restaurant-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}

.restaurant-card:active { transform: scale(0.98); }

.rest-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
}

.rest-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rest-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  font-size: 32px;
}

.rest-info { flex: 1; }

.rest-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.rest-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.rest-min {
  font-size: 12px;
  color: var(--text-tertiary, #999);
}

/* 菜单弹窗 */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.menu-panel {
  width: 100%;
  max-width: 393px;
  max-height: 75vh;
  background: var(--bg-primary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.menu-title {
  font-weight: 600;
  font-size: 17px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
}

.menu-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.menu-empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.menu-item:last-child { border-bottom: none; }

.item-info { flex: 1; }

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.item-price {
  font-size: 14px;
  color: #ff6b35;
  font-weight: 600;
  margin-top: 4px;
}

.add-cart-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--accent-blue);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 12px;
}

.add-cart-btn:active { transform: scale(0.9); }

/* 购物车栏 */
.cart-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.cart-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-badge {
  background: #ff6b35;
  color: white;
  font-size: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.cart-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.checkout-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  background: #ff6b35;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.checkout-btn:active { transform: scale(0.95); }
</style>
