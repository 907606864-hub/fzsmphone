<template>
  <div class="currency-page">
    <NavBar title="汇率换算" />

    <!-- 换算卡片 -->
    <div class="converter-card">
      <!-- 源货币 -->
      <div class="currency-row">
        <button class="currency-selector" @click="selectingFor = 'from'">
          <span class="currency-flag">{{ fromCurrency.flag }}</span>
          <span class="currency-code">{{ fromCurrency.code }}</span>
          <span class="chevron">›</span>
        </button>
        <input
          v-model="fromAmount"
          type="number"
          class="amount-input"
          placeholder="0"
          @input="convertFromTo"
        />
      </div>

      <!-- 交换按钮 -->
      <div class="swap-row">
        <div class="rate-text">1 {{ fromCurrency.code }} = {{ exchangeRate.toFixed(4) }} {{ toCurrency.code }}</div>
        <button class="swap-btn" @click="swapCurrencies">↻</button>
      </div>

      <!-- 目标货币 -->
      <div class="currency-row">
        <button class="currency-selector" @click="selectingFor = 'to'">
          <span class="currency-flag">{{ toCurrency.flag }}</span>
          <span class="currency-code">{{ toCurrency.code }}</span>
          <span class="chevron">›</span>
        </button>
        <input
          v-model="toAmount"
          type="number"
          class="amount-input"
          placeholder="0"
          @input="convertToFrom"
        />
      </div>
    </div>

    <!-- 常用货币快捷换算 -->
    <div class="section">
      <h3>常用汇率</h3>
      <div class="rates-list">
        <div v-for="rate in commonRates" :key="rate.code" class="rate-item">
          <div class="rate-left">
            <span class="rate-flag">{{ rate.flag }}</span>
            <div class="rate-info">
              <span class="rate-code">{{ rate.code }}</span>
              <span class="rate-name">{{ rate.name }}</span>
            </div>
          </div>
          <div class="rate-right">
            <span class="rate-value">{{ rate.rate.toFixed(4) }}</span>
            <span class="rate-change" :class="rate.change >= 0 ? 'up' : 'down'">
              {{ rate.change >= 0 ? '+' : '' }}{{ rate.change.toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 货币选择器 -->
    <div v-if="selectingFor" class="overlay" @click.self="selectingFor = null">
      <div class="selector-panel">
        <div class="panel-header">
          <h3>选择货币</h3>
          <button class="close-btn" @click="selectingFor = null">✕</button>
        </div>
        <input
          v-model="currencySearch"
          type="text"
          class="currency-search"
          placeholder="搜索货币..."
        />
        <div class="currency-list">
          <div
            v-for="cur in filteredCurrencies"
            :key="cur.code"
            class="currency-option"
            :class="{ active: isSelected(cur.code) }"
            @click="selectCurrency(cur)"
          >
            <span class="opt-flag">{{ cur.flag }}</span>
            <div class="opt-info">
              <span class="opt-code">{{ cur.code }}</span>
              <span class="opt-name">{{ cur.name }}</span>
            </div>
            <span v-if="isSelected(cur.code)" class="check-mark">✓</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import NavBar from '@/components/common/NavBar.vue'

interface Currency {
  code: string
  name: string
  flag: string
  rateToUSD: number
}

const currencies: Currency[] = [
  { code: 'CNY', name: '人民币', flag: '🇨🇳', rateToUSD: 7.24 },
  { code: 'USD', name: '美元', flag: '🇺🇸', rateToUSD: 1 },
  { code: 'EUR', name: '欧元', flag: '🇪🇺', rateToUSD: 0.92 },
  { code: 'GBP', name: '英镑', flag: '🇬🇧', rateToUSD: 0.79 },
  { code: 'JPY', name: '日元', flag: '🇯🇵', rateToUSD: 149.8 },
  { code: 'KRW', name: '韩元', flag: '🇰🇷', rateToUSD: 1325.5 },
  { code: 'HKD', name: '港币', flag: '🇭🇰', rateToUSD: 7.82 },
  { code: 'TWD', name: '新台币', flag: '🇹🇼', rateToUSD: 31.5 },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬', rateToUSD: 1.34 },
  { code: 'AUD', name: '澳元', flag: '🇦🇺', rateToUSD: 1.53 },
  { code: 'CAD', name: '加元', flag: '🇨🇦', rateToUSD: 1.36 },
  { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭', rateToUSD: 0.88 },
  { code: 'THB', name: '泰铢', flag: '🇹🇭', rateToUSD: 35.2 },
  { code: 'RUB', name: '俄罗斯卢布', flag: '🇷🇺', rateToUSD: 92.5 },
]

const fromCurrency = ref(currencies[0]) // CNY
const toCurrency = ref(currencies[1])   // USD
const fromAmount = ref<string>('100')
const toAmount = ref<string>('')
const selectingFor = ref<'from' | 'to' | null>(null)
const currencySearch = ref('')

const exchangeRate = computed(() => {
  return toCurrency.value.rateToUSD / fromCurrency.value.rateToUSD
})

const commonRates = computed(() => {
  const base = fromCurrency.value
  return currencies
    .filter((c) => c.code !== base.code)
    .slice(0, 6)
    .map((c) => ({
      ...c,
      rate: c.rateToUSD / base.rateToUSD,
      change: (Math.random() - 0.5) * 2,
    }))
})

const filteredCurrencies = computed(() => {
  if (!currencySearch.value) return currencies
  const q = currencySearch.value.toLowerCase()
  return currencies.filter(
    (c) => c.code.toLowerCase().includes(q) || c.name.includes(q)
  )
})

function convertFromTo() {
  const val = parseFloat(fromAmount.value)
  if (isNaN(val)) {
    toAmount.value = ''
    return
  }
  toAmount.value = (val * exchangeRate.value).toFixed(2)
}

function convertToFrom() {
  const val = parseFloat(toAmount.value)
  if (isNaN(val)) {
    fromAmount.value = ''
    return
  }
  fromAmount.value = (val / exchangeRate.value).toFixed(2)
}

function swapCurrencies() {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
  convertFromTo()
}

function isSelected(code: string): boolean {
  if (selectingFor.value === 'from') return fromCurrency.value.code === code
  return toCurrency.value.code === code
}

function selectCurrency(cur: Currency) {
  if (selectingFor.value === 'from') {
    fromCurrency.value = cur
  } else {
    toCurrency.value = cur
  }
  selectingFor.value = null
  currencySearch.value = ''
  convertFromTo()
}

// 初始换算
convertFromTo()
</script>

<style scoped>
.currency-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow-y: auto;
}

.converter-card {
  margin: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 20px;
}

.currency-row {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.currency-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary);
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  min-width: 100px;
}

.currency-flag {
  font-size: 22px;
}

.currency-code {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.chevron {
  font-size: 16px;
  color: var(--text-tertiary);
  margin-left: auto;
}

.amount-input {
  flex: 1;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 600;
  text-align: right;
  outline: none;
  overflow: hidden;
  text-overflow: ellipsis;
  appearance: textfield;
  -moz-appearance: textfield;
  box-sizing: border-box;
}

.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.amount-input:focus {
  border-color: var(--accent-blue);
}

.swap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.rate-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.swap-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-blue);
  border: none;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

.swap-btn:active {
  transform: rotate(180deg);
}

/* 常用汇率 */
.section {
  padding: 0 16px 16px;
}

.section h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.rates-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border-radius: 14px;
}

.rate-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate-flag {
  font-size: 24px;
}

.rate-info {
  display: flex;
  flex-direction: column;
}

.rate-code {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.rate-name {
  font-size: 11px;
  color: var(--text-tertiary);
}

.rate-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.rate-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.rate-change {
  font-size: 12px;
  font-weight: 600;
}

.up { color: #e74c3c; }
.down { color: #27ae60; }

/* 货币选择器 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.selector-panel {
  width: 100%;
  max-width: 393px;
  max-height: 70vh;
  background: var(--bg-secondary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.currency-search {
  margin: 12px 16px;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.currency-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.currency-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  border-radius: 8px;
}

.currency-option:active {
  background: var(--bg-tertiary);
}

.currency-option.active {
  background: rgba(0, 122, 255, 0.08);
}

.opt-flag {
  font-size: 26px;
}

.opt-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.opt-code {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.opt-name {
  font-size: 12px;
  color: var(--text-tertiary);
}

.check-mark {
  font-size: 18px;
  color: var(--accent-blue);
  font-weight: 700;
}
</style>
