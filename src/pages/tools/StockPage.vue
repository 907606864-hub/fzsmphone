<template>
  <div class="stock-page">
    <NavBar title="股票行情">
      <template #right>
        <button class="gen-btn" @click="handleGenerate" :disabled="aiStore.generating">
          {{ aiStore.stockLoading ? 'AI生成中...' : 'AI生成' }}
        </button>
      </template>
    </NavBar>

    <!-- 指数概览 -->
    <div class="indices-row">
      <div v-for="idx in indices" :key="idx.name" class="index-card">
        <span class="index-name">{{ idx.name }}</span>
        <span class="index-value">{{ idx.value.toFixed(2) }}</span>
        <span class="index-change" :class="idx.change >= 0 ? 'up' : 'down'">
          {{ idx.change >= 0 ? '+' : '' }}{{ idx.change.toFixed(2) }}%
        </span>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <input v-model="searchText" placeholder="搜索股票代码或名称..." class="search-input" />
    </div>

    <!-- 自选列表 -->
    <div class="section-header">
      <h3>自选股</h3>
      <button class="add-btn" @click="showAddStock = true">+ 添加</button>
    </div>

    <div class="stock-list">
      <div class="stock-list-header">
        <span>名称</span>
        <span>最新价</span>
        <span>涨跌幅</span>
      </div>
      <div
        v-for="stock in filteredStocks"
        :key="stock.code"
        class="stock-item"
        @click="selectedStock = stock"
      >
        <div class="stock-name-col">
          <span class="stock-name">{{ stock.name }}</span>
          <span class="stock-code">{{ stock.code }}</span>
        </div>
        <span class="stock-price">{{ stock.price.toFixed(2) }}</span>
        <span class="stock-change" :class="stock.change >= 0 ? 'up' : 'down'">
          {{ stock.change >= 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
        </span>
      </div>
    </div>

    <!-- 股票详情弹窗 -->
    <div v-if="selectedStock" class="overlay" @click.self="selectedStock = null">
      <div class="detail-panel">
        <div class="detail-header">
          <div>
            <h3>{{ selectedStock.name }}</h3>
            <span class="detail-code">{{ selectedStock.code }}</span>
          </div>
          <button class="close-btn" @click="selectedStock = null">✕</button>
        </div>
        <div class="detail-price-row">
          <span class="detail-price" :class="selectedStock.change >= 0 ? 'up' : 'down'">
            {{ selectedStock.price.toFixed(2) }}
          </span>
          <span class="detail-change" :class="selectedStock.change >= 0 ? 'up' : 'down'">
            {{ selectedStock.change >= 0 ? '+' : '' }}{{ selectedStock.change.toFixed(2) }}%
          </span>
        </div>

        <!-- 模拟K线 -->
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div
              v-for="(bar, i) in chartBars"
              :key="i"
              class="chart-bar"
              :class="bar > 0 ? 'bar-up' : 'bar-down'"
              :style="{ height: Math.abs(bar) * 3 + 'px' }"
            ></div>
          </div>
        </div>

        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-label">开盘</span>
            <span class="info-value">{{ (selectedStock.price * 0.99).toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最高</span>
            <span class="info-value up">{{ (selectedStock.price * 1.02).toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最低</span>
            <span class="info-value down">{{ (selectedStock.price * 0.97).toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">成交量</span>
            <span class="info-value">{{ selectedStock.volume }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">市值</span>
            <span class="info-value">{{ selectedStock.marketCap }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">市盈率</span>
            <span class="info-value">{{ selectedStock.pe }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加股票 -->
    <div v-if="showAddStock" class="overlay" @click.self="showAddStock = false">
      <div class="add-panel">
        <div class="detail-header">
          <h3>添加自选股</h3>
          <button class="close-btn" @click="showAddStock = false">✕</button>
        </div>
        <div class="add-list">
          <div
            v-for="stock in availableStocks"
            :key="stock.code"
            class="add-item"
            @click="addStock(stock)"
          >
            <div class="stock-name-col">
              <span class="stock-name">{{ stock.name }}</span>
              <span class="stock-code">{{ stock.code }}</span>
            </div>
            <span class="add-icon">+</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useSocialAIStore } from '@/stores/socialAI'

const aiStore = useSocialAIStore()

interface StockItem {
  code: string
  name: string
  price: number
  change: number
  volume: string
  marketCap: string
  pe: string
}

const searchText = ref('')
const selectedStock = ref<StockItem | null>(null)
const showAddStock = ref(false)

const indices = ref([
  { name: '上证指数', value: 3246.12, change: 0.85 },
  { name: '深证成指', value: 10562.34, change: -0.32 },
  { name: '创业板指', value: 2156.78, change: 1.23 },
])

const defaultStocks: StockItem[] = [
  { code: '600519', name: '贵州茅台', price: 1688.50, change: 1.25, volume: '3.2万手', marketCap: '2.12万亿', pe: '33.5' },
  { code: '000858', name: '五粮液', price: 156.80, change: -0.68, volume: '5.8万手', marketCap: '6088亿', pe: '25.2' },
  { code: '601318', name: '中国平安', price: 48.92, change: 0.45, volume: '12.3万手', marketCap: '8945亿', pe: '8.6' },
  { code: '000001', name: '平安银行', price: 12.35, change: -1.12, volume: '28.5万手', marketCap: '2398亿', pe: '5.2' },
  { code: '300750', name: '宁德时代', price: 198.60, change: 2.34, volume: '8.6万手', marketCap: '4856亿', pe: '28.9' },
  { code: '601899', name: '紫金矿业', price: 15.82, change: 0.89, volume: '18.2万手', marketCap: '4168亿', pe: '12.3' },
]

const stocks = ref<StockItem[]>([...defaultStocks])

const allStocks: StockItem[] = [
  { code: '600036', name: '招商银行', price: 35.20, change: 0.57, volume: '15.6万手', marketCap: '8882亿', pe: '6.8' },
  { code: '002594', name: '比亚迪', price: 268.50, change: 3.12, volume: '6.2万手', marketCap: '7812亿', pe: '42.1' },
  { code: '601012', name: '隆基绿能', price: 25.60, change: -2.15, volume: '22.1万手', marketCap: '1938亿', pe: '15.6' },
]

const chartBars = computed(() => {
  const bars: number[] = []
  for (let i = 0; i < 30; i++) {
    bars.push((Math.random() - 0.45) * 20)
  }
  return bars
})

const filteredStocks = computed(() => {
  if (!searchText.value) return stocks.value
  const q = searchText.value.toLowerCase()
  return stocks.value.filter(
    (s) => s.name.includes(q) || s.code.includes(q)
  )
})

const availableStocks = computed(() => {
  const codes = new Set(stocks.value.map((s) => s.code))
  return allStocks.filter((s) => !codes.has(s.code))
})

function addStock(stock: StockItem) {
  stocks.value.push(stock)
  showAddStock.value = false
  saveWatchlist()
}

const STOCK_KEY = 'stock-watchlist'

function saveWatchlist() {
  try {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stocks.value.map(s => s.code)))
  } catch { /* ignore */ }
}

function loadWatchlist() {
  try {
    const saved = localStorage.getItem(STOCK_KEY)
    if (saved) {
      const codes: string[] = JSON.parse(saved)
      const all = [...stocks.value, ...allStocks]
      const loaded = codes.map(c => all.find(s => s.code === c)).filter(Boolean) as StockItem[]
      if (loaded.length > 0) stocks.value = loaded
    }
  } catch { /* ignore */ }
}

// AI 生成
async function handleGenerate() {
  await aiStore.generateStockContent()
  applyAIData()
}

function applyAIData() {
  if (aiStore.stockIndices.length > 0) {
    indices.value = aiStore.stockIndices.map(idx => ({
      name: idx.name,
      value: idx.value,
      change: idx.change,
    }))
  }
  if (aiStore.stockItems.length > 0) {
    stocks.value = aiStore.stockItems.map(s => ({
      code: s.code,
      name: s.name,
      price: s.price,
      change: s.change,
      volume: s.volume,
      marketCap: s.marketCap,
      pe: s.pe,
    }))
  }
}

// 实时价格模拟
let priceTimer: ReturnType<typeof setInterval> | null = null

function simulatePrices() {
  // 指数波动
  indices.value.forEach(idx => {
    const delta = (Math.random() - 0.48) * 0.15
    idx.change = +(idx.change + delta).toFixed(2)
    idx.value = +(idx.value * (1 + delta / 100)).toFixed(2)
  })
  // 股票波动
  stocks.value.forEach(s => {
    const delta = (Math.random() - 0.48) * 0.3
    s.change = +(s.change + delta).toFixed(2)
    s.price = +(s.price * (1 + delta / 100)).toFixed(2)
  })
}

onMounted(() => {
  // 加载 AI 缓存数据
  aiStore.loadData('stock')
  applyAIData()
  // 如果没有 AI 数据，走原来的 watchlist 逻辑
  if (aiStore.stockItems.length === 0) {
    loadWatchlist()
  }
  priceTimer = setInterval(simulatePrices, 3000)
})

onUnmounted(() => {
  if (priceTimer) clearInterval(priceTimer)
})
</script>

<style scoped>
.stock-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow-y: auto;
}

.gen-btn {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.gen-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.indices-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
}

.index-card {
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.index-name {
  font-size: 11px;
  color: var(--text-tertiary);
}

.index-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.index-change {
  font-size: 12px;
  font-weight: 600;
}

.up { color: #e74c3c; }
.down { color: #27ae60; }

.search-bar {
  padding: 4px 16px 8px;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.add-btn {
  background: none;
  border: none;
  color: var(--accent-blue);
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
}

.stock-list {
  padding: 0 16px;
}

.stock-list-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 12px;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.stock-item:active {
  opacity: 0.7;
}

.stock-name-col {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stock-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stock-code {
  font-size: 11px;
  color: var(--text-tertiary);
}

.stock-price {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  width: 80px;
  text-align: right;
}

.stock-change {
  font-size: 13px;
  font-weight: 700;
  width: 70px;
  text-align: right;
  padding: 4px 8px;
  border-radius: 6px;
}

.stock-change.up {
  background: rgba(231, 76, 60, 0.1);
}

.stock-change.down {
  background: rgba(39, 174, 96, 0.1);
}

/* 弹窗 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.detail-panel,
.add-panel {
  width: 100%;
  max-width: 393px;
  max-height: 80vh;
  background: var(--bg-secondary);
  border-radius: 20px 20px 0 0;
  padding: 20px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.detail-code {
  font-size: 12px;
  color: var(--text-tertiary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.detail-price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-price {
  font-size: 32px;
  font-weight: 700;
}

.detail-change {
  font-size: 16px;
  font-weight: 600;
}

.chart-placeholder {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  height: 120px;
  display: flex;
  align-items: flex-end;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  width: 100%;
  height: 100%;
}

.chart-bar {
  flex: 1;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
}

.bar-up {
  background: #e74c3c;
}

.bar-down {
  background: #27ae60;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.add-list {
  display: flex;
  flex-direction: column;
}

.add-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.add-item:active {
  opacity: 0.7;
}

.add-icon {
  font-size: 22px;
  color: var(--accent-blue);
  font-weight: 700;
}
</style>
