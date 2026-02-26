<template>
  <div class="wallet-page">
    <NavBar title="钱包" :show-back="true" back-to="/">
      <template #right>
        <button class="nav-btn" @click="showHistory = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </template>
    </NavBar>

    <div class="wallet-content">
      <!-- 余额卡片 -->
      <div class="balance-card">
        <div class="balance-header">
          <span class="balance-label">总资产（虚拟）</span>
          <button class="eye-btn" @click="showBalance = !showBalance">
            <svg v-if="showBalance" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        </div>
        <div class="balance-amount">
          <span class="currency">¥</span>
          <span class="amount">{{ showBalance ? formatMoney(walletStore.balance) : '****' }}</span>
        </div>
        <div class="balance-sub">
          昨日收益 <span class="income-value">+{{ showBalance ? '12.50' : '**' }}</span>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <div class="action-item" @click="handleAction('transfer')">
          <div class="action-icon" style="background: linear-gradient(135deg, #5B6EF5, #8B5CF6)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="3"/>
              <path d="M2 10h20"/>
              <path d="M6 16h4"/>
            </svg>
          </div>
          <span>转账</span>
        </div>
        <div class="action-item" @click="handleAction('redpacket')">
          <div class="action-icon" style="background: linear-gradient(135deg, #E6162D, #FF4757)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <rect x="3" y="1" width="18" height="22" rx="3"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span>红包</span>
        </div>
        <div class="action-item" @click="handleTopUp">
          <div class="action-icon" style="background: linear-gradient(135deg, #00B894, #55EFC4)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span>充值</span>
        </div>
        <div class="action-item" @click="handleAction('withdraw')">
          <div class="action-icon" style="background: linear-gradient(135deg, #FDCB6E, #F39C12)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </div>
          <span>提现</span>
        </div>
      </div>

      <!-- 功能列表 -->
      <div class="section">
        <div class="section-title">金融服务</div>
        <div class="menu-group">
          <div class="menu-item" v-for="item in financeItems" :key="item.label" @click="handleAction(item.action)">
            <div class="menu-icon-wrap" :style="{ background: item.iconBg }">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" v-html="item.iconPath"></svg>
            </div>
            <span class="menu-label">{{ item.label }}</span>
            <div class="menu-right">
              <span v-if="item.value" class="menu-value">{{ item.value }}</span>
              <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近交易 -->
      <div class="section">
        <div class="section-title">最近交易</div>
        <div class="menu-group">
          <div v-if="walletStore.recentTransactions.length === 0" class="empty-tx">
            <span>暂无交易记录</span>
          </div>
          <div v-for="tx in walletStore.recentTransactions" :key="tx.id" class="tx-item">
            <div class="tx-icon-wrap" :class="tx.type">
              <svg v-if="tx.type === 'income'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </div>
            <div class="tx-info">
              <div class="tx-desc">{{ tx.description }}</div>
              <div class="tx-time">{{ tx.time }}</div>
            </div>
            <div class="tx-amount" :class="tx.type">
              {{ tx.type === 'income' ? '+' : '-' }}¥{{ tx.amount.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 充值弹窗 -->
    <Teleport to="#phone-overlay">
      <Transition name="fade">
        <div v-if="showTopUp" class="modal-overlay" @click.self="showTopUp = false">
          <div class="topup-modal">
            <div class="modal-header">
              <span>充值</span>
              <button class="close-btn" @click="showTopUp = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="topup-body">
              <div class="topup-amount-row">
                <span class="topup-currency">¥</span>
                <input
                  ref="topUpInputRef"
                  v-model="topUpAmount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  class="topup-input"
                />
              </div>
              <div class="topup-presets">
                <button v-for="preset in [100, 500, 1000, 5000]" :key="preset" class="topup-preset" @click="topUpAmount = preset">
                  ¥{{ preset }}
                </button>
              </div>
              <button class="topup-confirm" :disabled="!topUpAmount || Number(topUpAmount) <= 0" @click="confirmTopUp">
                确认充值
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 交易历史弹窗 -->
      <Transition name="fade">
        <div v-if="showHistory" class="modal-overlay" @click.self="showHistory = false">
          <div class="history-modal">
            <div class="modal-header">
              <span>交易记录</span>
              <button class="close-btn" @click="showHistory = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="history-list">
              <div v-if="walletStore.transactions.length === 0" class="empty-tx" style="padding: 60px 20px;">
                暂无交易记录
              </div>
              <div v-for="tx in walletStore.transactions" :key="tx.id" class="tx-item">
                <div class="tx-icon-wrap" :class="tx.type">
                  <svg v-if="tx.type === 'income'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </div>
                <div class="tx-info">
                  <div class="tx-desc">{{ tx.description }}</div>
                  <div class="tx-time">{{ tx.time }}</div>
                </div>
                <div class="tx-amount" :class="tx.type">
                  {{ tx.type === 'income' ? '+' : '-' }}¥{{ tx.amount.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import { useWalletStore } from '@/stores/wallet'

const router = useRouter()
const walletStore = useWalletStore()

const showBalance = ref(true)
const showHistory = ref(false)
const showTopUp = ref(false)
const topUpAmount = ref<number | string>('')
const topUpInputRef = ref<HTMLInputElement | null>(null)

interface FinanceItem {
  iconPath: string
  iconBg: string
  label: string
  value?: string
  action: string
}

const financeItems: FinanceItem[] = [
  {
    iconPath: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20"/>',
    iconBg: 'linear-gradient(135deg, #667eea, #764ba2)',
    label: '银行卡',
    value: '2张',
    action: 'bankcard',
  },
  {
    iconPath: '<polyline points="4 14 8 10 12 13 16 8 20 12"/><line x1="4" y1="20" x2="4" y2="4"/><line x1="4" y1="20" x2="20" y2="20"/>',
    iconBg: 'linear-gradient(135deg, #00b894, #55efc4)',
    label: '理财产品',
    value: '收益中',
    action: 'invest',
  },
  {
    iconPath: '<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><path d="M10 12h4"/>',
    iconBg: 'linear-gradient(135deg, #e17055, #fdcb6e)',
    label: '赌场',
    value: '',
    action: 'casino',
  },
  {
    iconPath: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/>',
    iconBg: 'linear-gradient(135deg, #fd79a8, #e84393)',
    label: '优惠券',
    value: '3张',
    action: 'coupon',
  },
  {
    iconPath: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    iconBg: 'linear-gradient(135deg, #636e72, #b2bec3)',
    label: '支付设置',
    value: '',
    action: 'settings',
  },
]

function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleAction(action: string) {
  if (action === 'transfer' || action === 'redpacket') {
    // 跳转到聊天列表，在聊天里使用
    router.push('/friends')
  } else if (action === 'casino') {
    router.push('/casino')
  } else {
    console.log('Action:', action)
  }
}

function handleTopUp() {
  topUpAmount.value = ''
  showTopUp.value = true
  nextTick(() => topUpInputRef.value?.focus())
}

function confirmTopUp() {
  const amt = Number(topUpAmount.value)
  if (amt <= 0) return
  walletStore.topUp(amt)
  showTopUp.value = false
}
</script>

<style scoped>
.wallet-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.wallet-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.wallet-content::-webkit-scrollbar {
  display: none;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #5B6EF5 0%, #8B5CF6 100%);
  border-radius: var(--radius-xl);
  padding: 24px;
  color: #fff;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(91, 110, 245, 0.3);
}

.balance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
}

.eye-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 4px;
}

.eye-btn svg {
  width: 20px;
  height: 20px;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.currency {
  font-size: 20px;
  font-weight: 500;
}

.amount {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -1px;
}

.balance-sub {
  font-size: 13px;
  opacity: 0.7;
}

.income-value {
  color: #7BED9F;
  font-weight: 600;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  justify-content: space-around;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  margin-bottom: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.action-item:active {
  opacity: 0.6;
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon svg {
  width: 22px;
  height: 22px;
}

.action-item span {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Section */
.section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 4px 8px;
}

.menu-group {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.menu-item:active {
  background: var(--bg-tertiary);
}

.menu-item:not(:last-child) {
  border-bottom: 0.5px solid var(--separator);
}

.menu-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon-wrap svg {
  width: 18px;
  height: 18px;
}

.menu-label {
  flex: 1;
  font-size: 16px;
  color: var(--text-primary);
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.menu-value {
  font-size: 14px;
  color: var(--text-tertiary);
}

.menu-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-quaternary);
}

/* 交易记录 */
.empty-tx {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
}

.tx-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.tx-item:not(:last-child) {
  border-bottom: 0.5px solid var(--separator);
}

.tx-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tx-icon-wrap.income {
  background: rgba(0, 184, 148, 0.12);
  color: #00b894;
}

.tx-icon-wrap.expense {
  background: rgba(225, 112, 85, 0.12);
  color: #e17055;
}

.tx-icon-wrap svg {
  width: 18px;
  height: 18px;
}

.tx-info {
  flex: 1;
  min-width: 0;
}

.tx-desc {
  font-size: 15px;
  color: var(--text-primary);
}

.tx-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.tx-amount {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.tx-amount.income {
  color: #00b894;
}

.tx-amount.expense {
  color: var(--text-primary);
}

.bottom-spacer {
  height: 20px;
}

/* 弹窗通用 */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 0.5px solid var(--separator);
  flex-shrink: 0;
}

.close-btn {
  background: var(--bg-tertiary, var(--fill-tertiary));
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

/* 历史弹窗 */
.history-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-height: 70%;
  display: flex;
  flex-direction: column;
}

.history-list {
  flex: 1;
  overflow-y: auto;
}

.history-list::-webkit-scrollbar {
  display: none;
}

/* 充值弹窗 */
.topup-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
}

.topup-body {
  padding: 24px 20px;
}

.topup-amount-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 20px;
}

.topup-currency {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.topup-input {
  width: 140px;
  border: none;
  border-bottom: 2px solid var(--separator);
  background: none;
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  outline: none;
  padding: 4px 0;
  font-family: inherit;
  -moz-appearance: textfield;
}

.topup-input::-webkit-outer-spin-button,
.topup-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.topup-input:focus {
  border-bottom-color: #00b894;
}

.topup-presets {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
}

.topup-preset {
  padding: 8px 16px;
  border: 1px solid var(--separator);
  border-radius: 8px;
  background: none;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.topup-preset:active {
  background: var(--fill-tertiary);
  border-color: #00b894;
  color: #00b894;
}

.topup-confirm {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #00B894, #55EFC4);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.topup-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.topup-confirm:active:not(:disabled) {
  transform: scale(0.97);
}

/* Nav btn */
.nav-btn {
  display: flex;
  align-items: center;
  border: none;
  background: none;
  color: var(--brand-primary);
  cursor: pointer;
  padding: 6px;
}

.nav-btn svg {
  width: 22px;
  height: 22px;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
