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

      <!-- 银行卡弹窗 -->
      <Transition name="fade">
        <div v-if="showBankCards" class="modal-overlay" @click.self="showBankCards = false">
          <div class="panel-modal">
            <div class="modal-header">
              <span>银行卡</span>
              <button class="close-btn" @click="showBankCards = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="panel-body">
              <div v-for="card in bankCards" :key="card.id" class="bank-card" :style="{ background: card.gradient }">
                <div class="card-top">
                  <span class="card-bank">{{ card.bank }}</span>
                  <span class="card-type">{{ card.type }}</span>
                </div>
                <div class="card-number">**** **** **** {{ card.last4 }}</div>
                <div class="card-bottom">
                  <span class="card-holder">持卡人</span>
                  <span class="card-balance">余额 ¥{{ formatMoney(card.balance) }}</span>
                </div>
              </div>
              <button class="add-card-btn" @click="addBankCard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>添加银行卡</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 理财产品弹窗 -->
      <Transition name="fade">
        <div v-if="showInvest" class="modal-overlay" @click.self="showInvest = false">
          <div class="panel-modal">
            <div class="modal-header">
              <span>理财产品</span>
              <button class="close-btn" @click="showInvest = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="panel-body">
              <div v-for="fund in investFunds" :key="fund.id" class="invest-card">
                <div class="invest-header">
                  <span class="invest-name">{{ fund.name }}</span>
                  <span class="invest-badge" :class="fund.risk">{{ fund.riskLabel }}</span>
                </div>
                <div class="invest-metrics">
                  <div class="metric">
                    <span class="metric-value" :class="fund.todayReturn >= 0 ? 'up' : 'down'">
                      {{ fund.todayReturn >= 0 ? '+' : '' }}{{ fund.todayReturn.toFixed(2) }}%
                    </span>
                    <span class="metric-label">今日收益率</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">¥{{ formatMoney(fund.amount) }}</span>
                    <span class="metric-label">持有金额</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value up">+¥{{ fund.totalReturn.toFixed(2) }}</span>
                    <span class="metric-label">累计收益</span>
                  </div>
                </div>
                <div class="invest-chart">
                  <svg viewBox="0 0 200 40" class="mini-chart">
                    <polyline :points="fund.chartPoints" fill="none" stroke="#00b894" stroke-width="1.5" />
                    <polyline :points="fund.chartPoints" fill="url(#chartGrad)" stroke="none" opacity="0.15" />
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00b894" />
                        <stop offset="100%" stop-color="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 优惠券弹窗 -->
      <Transition name="fade">
        <div v-if="showCoupons" class="modal-overlay" @click.self="showCoupons = false">
          <div class="panel-modal">
            <div class="modal-header">
              <span>优惠券</span>
              <button class="close-btn" @click="showCoupons = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="panel-body">
              <div v-for="coupon in coupons" :key="coupon.id" class="coupon-card" :class="{ used: coupon.used }">
                <div class="coupon-left" :style="{ background: coupon.used ? '#636e72' : coupon.color }">
                  <span class="coupon-amount">¥{{ coupon.discount }}</span>
                  <span class="coupon-condition">满{{ coupon.minSpend }}可用</span>
                </div>
                <div class="coupon-right">
                  <span class="coupon-name">{{ coupon.name }}</span>
                  <span class="coupon-expire">有效期至 {{ coupon.expire }}</span>
                  <button v-if="!coupon.used" class="coupon-use-btn" @click="useCoupon(coupon)">立即使用</button>
                  <span v-else class="coupon-used-tag">已使用</span>
                </div>
                <div class="coupon-circle coupon-circle-top"></div>
                <div class="coupon-circle coupon-circle-bottom"></div>
              </div>
              <div v-if="coupons.length === 0" class="empty-tx" style="padding:40px">
                暂无优惠券
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 支付设置弹窗 -->
      <Transition name="fade">
        <div v-if="showPaySettings" class="modal-overlay" @click.self="showPaySettings = false">
          <div class="panel-modal">
            <div class="modal-header">
              <span>支付设置</span>
              <button class="close-btn" @click="showPaySettings = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="panel-body">
              <div class="settings-group">
                <div class="setting-item" v-for="s in paySettings" :key="s.label">
                  <div class="setting-left">
                    <div class="setting-icon" :style="{ background: s.iconBg }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" v-html="s.iconPath"></svg>
                    </div>
                    <div class="setting-info">
                      <span class="setting-label">{{ s.label }}</span>
                      <span class="setting-desc">{{ s.desc }}</span>
                    </div>
                  </div>
                  <div class="setting-toggle" :class="{ on: s.enabled }" @click="s.enabled = !s.enabled">
                    <div class="toggle-knob"></div>
                  </div>
                </div>
              </div>
              <div class="settings-group" style="margin-top:12px">
                <div class="setting-item" @click="handlePayPassword">
                  <div class="setting-left">
                    <div class="setting-icon" style="background:linear-gradient(135deg,#e17055,#d63031)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div class="setting-info">
                      <span class="setting-label">修改支付密码</span>
                      <span class="setting-desc">保障您的资金安全</span>
                    </div>
                  </div>
                  <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
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
const showBankCards = ref(false)
const showInvest = ref(false)
const showCoupons = ref(false)
const showPaySettings = ref(false)
const topUpAmount = ref<number | string>('')
const topUpInputRef = ref<HTMLInputElement | null>(null)

// ===== 银行卡数据 =====
interface BankCard {
  id: number
  bank: string
  type: string
  last4: string
  balance: number
  gradient: string
}

const bankCards = ref<BankCard[]>([
  { id: 1, bank: '中国工商银行', type: '储蓄卡', last4: '8842', balance: 52360.00, gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)' },
  { id: 2, bank: '招商银行', type: '信用卡', last4: '3317', balance: 15000.00, gradient: 'linear-gradient(135deg, #2980b9, #3498db)' },
])

function addBankCard() {
  const banks = ['中国银行', '建设银行', '交通银行', '农业银行', '浦发银行']
  const types = ['储蓄卡', '信用卡']
  const gradients = [
    'linear-gradient(135deg, #00b894, #00cec9)',
    'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    'linear-gradient(135deg, #fdcb6e, #e17055)',
    'linear-gradient(135deg, #e84393, #fd79a8)',
    'linear-gradient(135deg, #636e72, #2d3436)',
  ]
  bankCards.value.push({
    id: Date.now(),
    bank: banks[Math.floor(Math.random() * banks.length)],
    type: types[Math.floor(Math.random() * types.length)],
    last4: String(Math.floor(1000 + Math.random() * 9000)),
    balance: Math.floor(Math.random() * 100000) / 100,
    gradient: gradients[Math.floor(Math.random() * gradients.length)],
  })
}

// ===== 理财产品数据 =====
interface InvestFund {
  id: number
  name: string
  risk: string
  riskLabel: string
  todayReturn: number
  amount: number
  totalReturn: number
  chartPoints: string
}

function generateChart(): string {
  const points: string[] = []
  let y = 20
  for (let x = 0; x <= 200; x += 10) {
    y = Math.max(5, Math.min(35, y + (Math.random() - 0.45) * 6))
    points.push(`${x},${y}`)
  }
  // Close the area
  points.push('200,40')
  points.push('0,40')
  return points.join(' ')
}

const investFunds = ref<InvestFund[]>([
  { id: 1, name: '稳健理财·月月盈', risk: 'low', riskLabel: '低风险', todayReturn: 0.012, amount: 5000, totalReturn: 128.50, chartPoints: generateChart() },
  { id: 2, name: '进取型·科技成长', risk: 'high', riskLabel: '高风险', todayReturn: -0.35, amount: 3000, totalReturn: 256.80, chartPoints: generateChart() },
])

// ===== 优惠券数据 =====
interface Coupon {
  id: number
  name: string
  discount: number
  minSpend: number
  expire: string
  color: string
  used: boolean
}

const coupons = ref<Coupon[]>([
  { id: 1, name: '新用户专享', discount: 10, minSpend: 50, expire: '2026-03-31', color: 'linear-gradient(135deg, #e74c3c, #c0392b)', used: false },
  { id: 2, name: '周末购物券', discount: 5, minSpend: 30, expire: '2026-03-15', color: 'linear-gradient(135deg, #e17055, #fdcb6e)', used: false },
  { id: 3, name: '外卖满减券', discount: 8, minSpend: 40, expire: '2026-02-28', color: 'linear-gradient(135deg, #00b894, #55efc4)', used: true },
])

function useCoupon(coupon: Coupon) {
  coupon.used = true
}

// ===== 支付设置数据 =====
const paySettings = ref([
  {
    label: '免密支付',
    desc: '小额交易无需输入密码',
    iconBg: 'linear-gradient(135deg, #00b894, #55efc4)',
    iconPath: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    enabled: true,
  },
  {
    label: '指纹支付',
    desc: '使用指纹验证支付',
    iconBg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    iconPath: '<path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v3"/><path d="M8 11V9a4 4 0 0 1 8 0"/><path d="M6 11V8a6 6 0 0 1 12 0v3"/><path d="M14 14a2 2 0 0 1-2 2"/><path d="M12 18a4 4 0 0 1-4-4v-3"/>',
    enabled: false,
  },
  {
    label: '到账通知',
    desc: '收到转账时推送通知',
    iconBg: 'linear-gradient(135deg, #fdcb6e, #f39c12)',
    iconPath: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    enabled: true,
  },
])

function handlePayPassword() {
  alert('支付密码修改功能（虚拟）')
}

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
    router.push('/friends')
  } else if (action === 'casino') {
    router.push('/casino')
  } else if (action === 'bankcard') {
    showBankCards.value = true
  } else if (action === 'invest') {
    showInvest.value = true
  } else if (action === 'coupon') {
    showCoupons.value = true
  } else if (action === 'settings') {
    showPaySettings.value = true
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

/* 通用面板弹窗 */
.panel-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-body::-webkit-scrollbar {
  display: none;
}

/* 银行卡 */
.bank-card {
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.bank-card::after {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-bank {
  font-size: 16px;
  font-weight: 700;
}

.card-type {
  font-size: 12px;
  opacity: 0.7;
  background: rgba(255,255,255,0.15);
  padding: 2px 10px;
  border-radius: 10px;
}

.card-number {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 3px;
  margin-bottom: 16px;
  font-family: 'Courier New', monospace;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  opacity: 0.8;
}

.add-card-btn {
  width: 100%;
  padding: 16px;
  border: 2px dashed var(--separator);
  border-radius: 16px;
  background: none;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.add-card-btn:active {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

/* 理财产品 */
.invest-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
}

.invest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.invest-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.invest-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.invest-badge.low {
  background: rgba(0, 184, 148, 0.12);
  color: #00b894;
}

.invest-badge.high {
  background: rgba(214, 48, 49, 0.12);
  color: #d63031;
}

.invest-metrics {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-value.up { color: #00b894; }
.metric-value.down { color: #d63031; }

.metric-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.mini-chart {
  width: 100%;
  height: 40px;
}

/* 优惠券 */
.coupon-card {
  display: flex;
  background: var(--bg-secondary);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
  transition: opacity 0.3s;
}

.coupon-card.used {
  opacity: 0.5;
}

.coupon-left {
  width: 100px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.coupon-amount {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.coupon-condition {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 4px;
  white-space: nowrap;
}

.coupon-right {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coupon-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.coupon-expire {
  font-size: 12px;
  color: var(--text-tertiary);
}

.coupon-use-btn {
  align-self: flex-start;
  margin-top: 6px;
  padding: 5px 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.coupon-use-btn:active {
  transform: scale(0.95);
}

.coupon-used-tag {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 6px;
}

.coupon-circle {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-primary);
  left: 92px;
}

.coupon-circle-top { top: -8px; }
.coupon-circle-bottom { bottom: -8px; }

/* 支付设置 */
.settings-group {
  background: var(--bg-secondary);
  border-radius: 14px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
}

.setting-item:not(:last-child) {
  border-bottom: 0.5px solid var(--separator);
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.setting-icon svg {
  width: 18px;
  height: 18px;
}

.setting-info {
  display: flex;
  flex-direction: column;
}

.setting-label {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.setting-toggle {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--bg-tertiary);
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
  flex-shrink: 0;
}

.setting-toggle.on {
  background: linear-gradient(135deg, #00b894, #55efc4);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.setting-toggle.on .toggle-knob {
  transform: translateX(20px);
}
</style>
