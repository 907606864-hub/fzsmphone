<template>
  <div class="shopping-page">
    <NavBar title="购物" back>
      <template #right>
        <button class="refresh-btn" :disabled="aiStore.shoppingLoading" @click="refreshProducts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: aiStore.shoppingLoading }">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </template>
    </NavBar>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input">
        <GradientIcon name="search" :size="16" :inline="true" />
        <input v-model="searchText" placeholder="搜索商品" @input="filterProducts" />
        <span v-if="searchText" class="clear-btn" @click="searchText = ''; filterProducts()">✕</span>
      </div>
      <div class="cart-icon" @click="showCart = true">
        <GradientIcon name="cart" :size="22" />
        <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="tab"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id; filterProducts()"
      >
        <GradientIcon :name="cat.iconKey" :size="18" />
        <span class="tab-label">{{ cat.name }}</span>
      </div>
    </div>

    <!-- Banner -->
    <div v-if="activeCategory === 'all'" class="banner-area">
      <div class="banner" :style="{ background: banners[currentBanner].bg }">
        <div class="banner-text">
          <div class="banner-title">{{ banners[currentBanner].title }}</div>
          <div class="banner-sub">{{ banners[currentBanner].sub }}</div>
        </div>
        <div class="banner-emoji"><GradientIcon :name="banners[currentBanner].iconKey" :size="36" /></div>
      </div>
      <div class="banner-dots">
        <span v-for="(_, i) in banners" :key="i" :class="{ active: i === currentBanner }" @click="currentBanner = i"></span>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="products-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        @click="selectProduct(product)"
      >
        <div class="product-image"><GradientIcon :name="product.iconKey" :size="48" shape="square" /></div>
        <div class="product-info">
          <div class="product-name">{{ product.name }}</div>
          <div class="product-desc">{{ product.description || product.desc }}</div>
          <div class="product-bottom">
            <span class="product-price">¥{{ product.price.toFixed(2) }}</span>
            <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice.toFixed(2) }}</span>
            <span class="product-sales">{{ product.sales }}人付款</span>
          </div>
        </div>
      </div>
      <div v-if="filteredProducts.length === 0 && !aiStore.shoppingLoading" class="empty-state">
        <div class="empty-icon"><GradientIcon name="search" :size="40" /></div>
        <div class="empty-text">没有找到相关商品</div>
        <button class="gen-btn" @click="refreshProducts">AI 生成商品</button>
      </div>
      <div v-if="aiStore.shoppingLoading" class="loading-hint">
        <div class="loading-spinner"></div>
        <span>AI 正在生成商品...</span>
      </div>
    </div>

    <!-- 商品详情弹窗 -->
    <div v-if="selectedProduct" class="modal-overlay" @click.self="selectedProduct = null">
      <div class="product-detail">
        <div class="detail-header">
          <div class="detail-image"><GradientIcon :name="selectedProduct.iconKey" :size="64" shape="square" /></div>
          <span class="close-btn" @click="selectedProduct = null">✕</span>
        </div>
        <div class="detail-body">
          <h3>{{ selectedProduct.name }}</h3>
          <div class="detail-price">
            <span class="price-now">¥{{ selectedProduct.price.toFixed(2) }}</span>
            <span v-if="selectedProduct.originalPrice" class="price-original">¥{{ selectedProduct.originalPrice.toFixed(2) }}</span>
            <span class="discount-tag" v-if="selectedProduct.originalPrice">
              {{ Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100) }}% OFF
            </span>
          </div>
          <p class="detail-desc">{{ selectedProduct.fullDesc }}</p>
          <div class="detail-specs">
            <div class="spec-item" v-for="spec in selectedProduct.specs" :key="spec.label">
              <span class="spec-label">{{ spec.label }}</span>
              <span class="spec-value">{{ spec.value }}</span>
            </div>
          </div>
          <div class="quantity-row">
            <span>数量</span>
            <div class="quantity-control">
              <button @click="detailQty = Math.max(1, detailQty - 1)">−</button>
              <span>{{ detailQty }}</span>
              <button @click="detailQty++">+</button>
            </div>
          </div>
          <div class="detail-actions">
            <button class="btn-fav" @click="toggleFav(selectedProduct)">
              {{ selectedProduct.fav ? '♥ 已收藏' : '♡ 收藏' }}
            </button>
            <button class="btn-cart" @click="addToCart(selectedProduct, detailQty); selectedProduct = null">
              加入购物车
            </button>
            <button class="btn-buy" @click="buyNow(selectedProduct, detailQty)">
              立即购买
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 购物车弹窗 -->
    <div v-if="showCart" class="modal-overlay" @click.self="showCart = false">
      <div class="cart-panel">
        <div class="cart-header">
          <h3>购物车</h3>
          <span class="close-btn" @click="showCart = false">✕</span>
        </div>
        <div v-if="cart.length === 0" class="cart-empty">
          <div class="empty-icon"><GradientIcon name="cart" :size="40" /></div>
          <div>购物车是空的</div>
        </div>
        <div v-else class="cart-items">
          <div v-for="item in cart" :key="item.product.id" class="cart-item">
            <div class="cart-item-emoji"><GradientIcon :name="item.product.iconKey" :size="36" shape="square" /></div>
            <div class="cart-item-info">
              <div class="cart-item-name">{{ item.product.name }}</div>
              <div class="cart-item-price">¥{{ item.product.price.toFixed(2) }}</div>
            </div>
            <div class="cart-item-qty">
              <button @click="updateCartQty(item, -1)">−</button>
              <span>{{ item.qty }}</span>
              <button @click="updateCartQty(item, 1)">+</button>
            </div>
            <span class="cart-item-delete" @click="removeFromCart(item)">✕</span>
          </div>
        </div>
        <div v-if="cart.length > 0" class="cart-footer">
          <div class="cart-total">
            <span>合计：</span>
            <span class="total-price">¥{{ cartTotal.toFixed(2) }}</span>
          </div>
          <button class="btn-checkout" @click="checkout">结算 ({{ cartCount }})</button>
        </div>
      </div>
    </div>

    <!-- 订单成功弹窗 -->
    <div v-if="orderSuccess" class="modal-overlay" @click.self="orderSuccess = false">
      <div class="order-success">
        <div class="success-icon"><GradientIcon name="checkmark" :size="48" /></div>
        <h3>下单成功！</h3>
        <p>订单号：{{ orderNo }}</p>
        <p>支付金额：¥{{ orderAmount.toFixed(2) }}</p>
        <button @click="orderSuccess = false">好的</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import GradientIcon from '@/components/common/GradientIcon.vue'
import { useWalletStore } from '@/stores/wallet'
import { useSocialAIStore } from '@/stores/socialAI'

const aiStore = useSocialAIStore()

interface ProductSpec {
  label: string
  value: string
}

interface Product {
  id: number | string
  name: string
  iconKey: string
  desc: string
  description?: string
  fullDesc: string
  price: number
  originalPrice?: number
  category: string
  sales: number
  fav: boolean
  specs: ProductSpec[]
}

interface CartItem {
  product: Product
  qty: number
}

const categories = [
  { id: 'all', name: '全部', iconKey: 'all' },
  { id: 'digital', name: '数码', iconKey: 'digital' },
  { id: '服饰', name: '服饰', iconKey: 'fashion' },
  { id: '美妆', name: '美妆', iconKey: 'beauty' },
  { id: '食品', name: '食品', iconKey: 'food' },
  { id: '生活', name: '生活', iconKey: 'home' },
  { id: '书籍', name: '书籍', iconKey: 'gift' },
]

// Convert AI products to local Product type
function aiToLocalProducts(): Product[] {
  return aiStore.shoppingProducts.map((p, i) => ({
    id: p.id || i,
    name: p.name,
    iconKey: p.iconKey || 'gift',
    desc: p.description || '',
    description: p.description,
    fullDesc: p.description || '',
    price: p.price,
    originalPrice: p.originalPrice > p.price ? p.originalPrice : undefined,
    category: p.category,
    sales: p.sales || Math.floor(Math.random() * 5000),
    fav: p.fav || false,
    specs: [],
  }))
}

const allProducts = ref<Product[]>([])

const searchText = ref('')
const activeCategory = ref('all')
const filteredProducts = ref<Product[]>([])
const selectedProduct = ref<Product | null>(null)
const detailQty = ref(1)
const cart = ref<CartItem[]>([])
const showCart = ref(false)
const orderSuccess = ref(false)
const orderNo = ref('')
const orderAmount = ref(0)
const currentBanner = ref(0)
let bannerTimer: ReturnType<typeof setInterval> | null = null

const banners = [
  { title: '春季大促', sub: '全场低至5折', iconKey: 'flower', bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { title: '情侣专区', sub: '甜蜜好物推荐', iconKey: 'heart', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { title: '数码狂欢', sub: '新品首发优惠', iconKey: 'fire', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
]

const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0))
const cartTotal = computed(() => cart.value.reduce((s, i) => s + i.product.price * i.qty, 0))

function filterProducts() {
  let list = allProducts.value
  if (activeCategory.value !== 'all') {
    list = list.filter(p => p.category === activeCategory.value)
  }
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(kw) || p.desc.toLowerCase().includes(kw))
  }
  filteredProducts.value = list
}

function selectProduct(p: Product) {
  selectedProduct.value = p
  detailQty.value = 1
}

async function toggleFav(p: Product) {
  p.fav = !p.fav
  saveFavs()
}

function addToCart(p: Product, qty: number) {
  const existing = cart.value.find(i => i.product.id === p.id)
  if (existing) {
    existing.qty += qty
  } else {
    cart.value.push({ product: p, qty })
  }
  saveCart()
}

function updateCartQty(item: CartItem, delta: number) {
  item.qty += delta
  if (item.qty <= 0) {
    cart.value = cart.value.filter(i => i.product.id !== item.product.id)
  }
  saveCart()
}

function removeFromCart(item: CartItem) {
  cart.value = cart.value.filter(i => i.product.id !== item.product.id)
  saveCart()
}

async function buyNow(p: Product, qty: number) {
  const total = p.price * qty
  const walletStore = useWalletStore()
  if (walletStore.balance < total) {
    alert('余额不足，请先充值')
    return
  }
  walletStore.addTransaction({
    type: 'expense',
    category: 'other',
    description: `购买 ${p.name} x${qty}`,
    amount: total,
  })
  orderAmount.value = total
  orderNo.value = 'SP' + Date.now().toString(36).toUpperCase()
  selectedProduct.value = null
  orderSuccess.value = true
}

async function checkout() {
  const walletStore = useWalletStore()
  if (walletStore.balance < cartTotal.value) {
    alert('余额不足，请先充值')
    return
  }
  walletStore.addTransaction({
    type: 'expense',
    category: 'other',
    description: `购物车结算 (${cartCount.value}件)`,
    amount: cartTotal.value,
  })
  orderAmount.value = cartTotal.value
  orderNo.value = 'SP' + Date.now().toString(36).toUpperCase()
  cart.value = []
  saveCart()
  showCart.value = false
  orderSuccess.value = true
}

function refreshProducts() {
  aiStore.generateShoppingContent()
}

const CART_KEY = 'shopping-cart'
const FAV_KEY = 'shopping-favs'

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart.value.map(i => ({ id: i.product.id, qty: i.qty }))))
  } catch { /* ignore */ }
}

function saveFavs() {
  try {
    const favIds = allProducts.value.filter(p => p.fav).map(p => p.id)
    localStorage.setItem(FAV_KEY, JSON.stringify(favIds))
  } catch { /* ignore */ }
}

function loadLocalFavs() {
  try {
    const saved = localStorage.getItem(FAV_KEY)
    if (saved) {
      const favIds = JSON.parse(saved)
      allProducts.value.forEach(p => { p.fav = favIds.includes(p.id) })
    }
  } catch { /* ignore */ }
}

function loadLocalCart() {
  try {
    const saved = localStorage.getItem(CART_KEY)
    if (saved) {
      const items: { id: number | string; qty: number }[] = JSON.parse(saved)
      cart.value = items
        .map(i => {
          const product = allProducts.value.find(p => p.id === i.id)
          return product ? { product, qty: i.qty } : null
        })
        .filter(Boolean) as CartItem[]
    }
  } catch { /* ignore */ }
}

function loadData() {
  // Load AI-generated products if available
  aiStore.loadData('shopping')
  if (aiStore.shoppingProducts.length > 0) {
    const aiProducts = aiToLocalProducts()
    allProducts.value = [...aiProducts, ...allProducts.value]
  }
  loadLocalFavs()
  loadLocalCart()
  filterProducts()
  if (aiStore.shoppingProducts.length === 0) {
    aiStore.generateShoppingContent().then(() => {
      if (aiStore.shoppingProducts.length > 0) {
        const aiProducts = aiToLocalProducts()
        allProducts.value = [...aiProducts, ...allProducts.value.filter(p => typeof p.id === 'number')]
        filterProducts()
      }
    })
  }
}

onMounted(() => {
  loadData()
  bannerTimer = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % banners.length
  }, 4000)
})

onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})
</script>

<style scoped>
.shopping-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow-y: auto;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--bg-primary);
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary);
  border-radius: 20px;
  padding: 8px 12px;
}

.search-input input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: var(--text-primary);
}

.search-icon { font-size: 14px; opacity: 0.5; }
.clear-btn { cursor: pointer; opacity: 0.5; font-size: 12px; }

.cart-icon {
  position: relative;
  font-size: 22px;
  cursor: pointer;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.category-tabs {
  display: flex;
  gap: 4px;
  padding: 4px 12px 8px;
  overflow-x: auto;
}

.category-tabs::-webkit-scrollbar { display: none; }

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.tab.active {
  background: var(--color-primary);
}

.tab-icon { font-size: 18px; }
.tab-label { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
.tab.active .tab-label { color: #fff; font-weight: 600; }

.banner-area {
  padding: 0 16px 8px;
}

.banner {
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.banner-title { font-size: 20px; font-weight: 700; }
.banner-sub { font-size: 13px; margin-top: 4px; opacity: 0.9; }
.banner-emoji { font-size: 40px; }

.banner-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}

.banner-dots span {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--text-quaternary);
  cursor: pointer;
  transition: all 0.3s;
}

.banner-dots span.active {
  width: 18px;
  background: var(--color-primary);
}

.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 8px 12px 20px;
}

.product-card {
  background: var(--bg-secondary);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:active { transform: scale(0.97); }

.product-image {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
  background: var(--bg-tertiary);
}

.product-info {
  padding: 10px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-bottom {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}

.product-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff3b30;
}

.original-price {
  font-size: 11px;
  color: var(--text-quaternary);
  text-decoration: line-through;
}

.product-sales {
  font-size: 10px;
  color: var(--text-quaternary);
  margin-left: auto;
}

/* 详情弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.product-detail {
  width: 100%;
  max-width: 393px;
  max-height: 85%;
  background: var(--bg-primary);
  border-radius: 20px 20px 0 0;
  overflow-y: auto;
}

.detail-header {
  position: relative;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  background: var(--bg-tertiary);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.detail-body {
  padding: 16px;
}

.detail-body h3 {
  font-size: 18px;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.detail-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.price-now { font-size: 22px; font-weight: 700; color: #ff3b30; }
.price-original { font-size: 13px; color: var(--text-quaternary); text-decoration: line-through; }

.discount-tag {
  font-size: 11px;
  background: #ff3b30;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.detail-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
}

.detail-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.spec-item {
  background: var(--bg-tertiary);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
}

.spec-label { color: var(--text-tertiary); margin-right: 4px; }
.spec-value { color: var(--text-primary); font-weight: 500; }

.quantity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--text-primary);
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-control button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-control span { font-weight: 600; min-width: 20px; text-align: center; }

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-fav { background: var(--bg-tertiary); color: var(--text-primary); }
.btn-cart { background: #ff9500; color: #fff; }
.btn-buy { background: #ff3b30; color: #fff; }

/* 购物车 */
.cart-panel {
  width: 100%;
  max-width: 393px;
  max-height: 70%;
  background: var(--bg-primary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-primary);
}

.cart-header h3 {
  margin: 0;
  font-size: 17px;
  color: var(--text-primary);
}

.cart-header .close-btn {
  position: static;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.cart-empty {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
}

.cart-empty .empty-icon { font-size: 40px; margin-bottom: 8px; }

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-secondary);
}

.cart-item-emoji { font-size: 32px; }

.cart-item-info { flex: 1; }
.cart-item-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.cart-item-price { font-size: 13px; color: #ff3b30; font-weight: 600; }

.cart-item-qty {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-item-qty button {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-primary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-item-qty span { font-size: 13px; font-weight: 600; min-width: 16px; text-align: center; }
.cart-item-delete { cursor: pointer; font-size: 16px; }

.cart-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-total { font-size: 14px; color: var(--text-primary); }
.total-price { font-size: 18px; font-weight: 700; color: #ff3b30; }

.btn-checkout {
  padding: 10px 24px;
  background: #ff3b30;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* 订单成功 */
.order-success {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  margin: auto;
  width: 280px;
}

.success-icon { font-size: 48px; margin-bottom: 12px; }

.order-success h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: var(--text-primary);
}

.order-success p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
}

.order-success button {
  margin-top: 16px;
  padding: 10px 32px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: var(--text-tertiary);
}

.empty-state .empty-icon { font-size: 40px; margin-bottom: 8px; }
.empty-state .empty-text { font-size: 14px; }

.refresh-btn {
  width: 32px; height: 32px; border: none; background: none;
  color: var(--brand-primary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.refresh-btn svg { width: 20px; height: 20px; }
.refresh-btn svg.spinning { animation: shop-spin 1s linear infinite; }

@keyframes shop-spin { to { transform: rotate(360deg); } }

.loading-hint {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--fill-tertiary);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: shop-spin 0.8s linear infinite;
}

.gen-btn {
  margin-top: 12px;
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  background: var(--brand-primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
</style>
