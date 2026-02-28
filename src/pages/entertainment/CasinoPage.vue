<template>
  <div class="casino-page">
    <NavBar title="娱乐场" back />

    <!-- 余额栏 -->
    <div class="balance-bar">
      <div class="balance-info">
        <span class="balance-label">金币余额</span>
        <span class="balance-value"><span class="coin-icon">$</span> {{ walletStore.balance.toLocaleString() }}</span>
      </div>
      <button class="recharge-btn" @click="recharge">+ 充值</button>
    </div>

    <!-- 游戏选项卡 -->
    <div class="game-tabs">
      <div
        v-for="tab in gameTabs"
        :key="tab.id"
        class="game-tab"
        :class="{ active: activeGame === tab.id }"
        @click="activeGame = tab.id"
      >
        <div class="tab-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="tab.svg"></svg>
        </div>
        <span class="tab-name">{{ tab.name }}</span>
      </div>
    </div>

    <!-- 老虎机 -->
    <div v-if="activeGame === 'slots'" class="game-area">
      <div class="slots-machine">
        <div class="slots-header">
          <div class="jackpot-label">★ JACKPOT</div>
          <div class="jackpot-value">{{ jackpot.toLocaleString() }}</div>
        </div>
        <div class="slots-reels">
          <div v-for="(reel, i) in slotReels" :key="i" class="reel" :class="{ spinning: slotSpinning }">
            <div class="reel-symbol" :style="{ color: getSlotColor(reel) }">{{ reel }}</div>
          </div>
        </div>
        <div v-if="slotResult" class="slot-result" :class="slotResult.type">
          {{ slotResult.text }}
        </div>
        <div class="slots-bet">
          <span>下注：</span>
          <div class="bet-options">
            <button
              v-for="b in [10, 50, 100, 500]"
              :key="b"
              :class="{ active: slotBet === b }"
              @click="slotBet = b"
            >
              {{ b }}
            </button>
          </div>
        </div>
        <button
          class="spin-btn"
          :disabled="slotSpinning || walletStore.balance < slotBet"
          @click="spinSlots"
        >
          {{ slotSpinning ? '旋转中...' : 'SPIN' }}
        </button>
      </div>
    </div>

    <!-- 骰子游戏 -->
    <div v-if="activeGame === 'dice'" class="game-area">
      <div class="dice-game">
        <div class="dice-display">
          <div v-for="(d, i) in diceValues" :key="i" class="dice" :class="{ rolling: diceRolling }">
            <svg class="dice-svg" viewBox="0 0 60 60">
              <rect x="2" y="2" width="56" height="56" rx="10" fill="#fff" stroke="#ddd" stroke-width="1"/>
              <template v-if="d === 1">
                <circle cx="30" cy="30" r="5" fill="#333"/>
              </template>
              <template v-else-if="d === 2">
                <circle cx="18" cy="18" r="5" fill="#333"/>
                <circle cx="42" cy="42" r="5" fill="#333"/>
              </template>
              <template v-else-if="d === 3">
                <circle cx="18" cy="18" r="5" fill="#333"/>
                <circle cx="30" cy="30" r="5" fill="#333"/>
                <circle cx="42" cy="42" r="5" fill="#333"/>
              </template>
              <template v-else-if="d === 4">
                <circle cx="18" cy="18" r="5" fill="#333"/>
                <circle cx="42" cy="18" r="5" fill="#333"/>
                <circle cx="18" cy="42" r="5" fill="#333"/>
                <circle cx="42" cy="42" r="5" fill="#333"/>
              </template>
              <template v-else-if="d === 5">
                <circle cx="18" cy="18" r="5" fill="#333"/>
                <circle cx="42" cy="18" r="5" fill="#333"/>
                <circle cx="30" cy="30" r="5" fill="#333"/>
                <circle cx="18" cy="42" r="5" fill="#333"/>
                <circle cx="42" cy="42" r="5" fill="#333"/>
              </template>
              <template v-else>
                <circle cx="18" cy="15" r="5" fill="#e74c3c"/>
                <circle cx="42" cy="15" r="5" fill="#e74c3c"/>
                <circle cx="18" cy="30" r="5" fill="#e74c3c"/>
                <circle cx="42" cy="30" r="5" fill="#e74c3c"/>
                <circle cx="18" cy="45" r="5" fill="#e74c3c"/>
                <circle cx="42" cy="45" r="5" fill="#e74c3c"/>
              </template>
            </svg>
          </div>
        </div>
        <div v-if="diceTotal > 0 && !diceRolling" class="dice-total">
          点数：{{ diceTotal }} — {{ diceTotal >= 11 ? '大' : '小' }}
        </div>
        <div v-if="diceResultText" class="dice-result" :class="diceResultType">
          {{ diceResultText }}
        </div>
        <div class="dice-bet-section">
          <div class="bet-amount-row">
            <span>下注金额：</span>
            <div class="bet-options">
              <button
                v-for="b in [10, 50, 100, 500]"
                :key="b"
                :class="{ active: diceBet === b }"
                @click="diceBet = b"
              >
                {{ b }}
              </button>
            </div>
          </div>
          <div class="dice-choice">
            <button
              class="choice-btn big"
              :class="{ active: diceChoice === 'big' }"
              @click="diceChoice = 'big'"
            >
              大 (11-18)
            </button>
            <button
              class="choice-btn small"
              :class="{ active: diceChoice === 'small' }"
              @click="diceChoice = 'small'"
            >
              小 (3-10)
            </button>
          </div>
        </div>
        <button
          class="roll-btn"
          :disabled="diceRolling || !diceChoice || walletStore.balance < diceBet"
          @click="rollDice"
        >
          {{ diceRolling ? '摇骰中...' : '摇骰子' }}
        </button>
      </div>
    </div>

    <!-- 幸运转盘 -->
    <div v-if="activeGame === 'wheel'" class="game-area">
      <div class="wheel-game">
        <div class="wheel-container">
          <div class="wheel" :style="{ transform: `rotate(${wheelAngle}deg)`, transition: wheelTransition }">
            <div
              v-for="(seg, i) in wheelSegments"
              :key="i"
              class="wheel-segment"
              :style="{ transform: `rotate(${i * segAngle}deg)`, background: seg.color }"
            >
              <div class="segment-content" :style="{ transform: `rotate(${segAngle / 2}deg)` }">
                <span class="seg-emoji">{{ seg.emoji }}</span>
                <span class="seg-label">{{ seg.label }}</span>
              </div>
            </div>
          </div>
          <div class="wheel-pointer">▼</div>
          <div class="wheel-center" @click="spinWheel">
            {{ wheelSpinning ? '...' : 'GO' }}
          </div>
        </div>
        <div v-if="wheelResult" class="wheel-result">
          ★ 恭喜获得：{{ wheelResult }}
        </div>
        <div class="wheel-cost">
          每次转动消耗 <strong>50</strong> 金币
        </div>
        <button
          class="wheel-spin-btn"
          :disabled="wheelSpinning || walletStore.balance < 50"
          @click="spinWheel"
        >
          {{ wheelSpinning ? '转动中...' : '转动转盘' }}
        </button>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <div class="history-header">
        <span>游戏记录</span>
        <span class="clear-btn" @click="history = []">清空</span>
      </div>
      <div v-if="history.length === 0" class="history-empty">暂无记录</div>
      <div v-else class="history-list">
        <div v-for="(h, i) in history.slice().reverse().slice(0, 20)" :key="i" class="history-item">
          <span class="h-game">{{ h.game }}</span>
          <span class="h-detail">{{ h.detail }}</span>
          <span class="h-result" :class="h.win ? 'win' : 'lose'">
            {{ h.win ? '+' : '' }}{{ h.amount }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useWalletStore } from '@/stores/wallet'
import { gameApi } from '@/api/services'

const walletStore = useWalletStore()

interface HistoryItem {
  game: string
  detail: string
  amount: number
  win: boolean
}

const gameTabs = [
  { id: 'slots', name: '老虎机', svg: '<rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/>' },
  { id: 'dice', name: '骰子', svg: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/>' },
  { id: 'wheel', name: '转盘', svg: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>' },
]

const activeGame = ref('slots')
const history = ref<HistoryItem[]>([])

// ===== 老虎机 =====
const slotSymbols = ['7', 'A', 'K', 'Q', 'J', 'W', 'X', 'BAR']
const slotReels = ref(['7', '7', '7'])

function getSlotColor(symbol: string): string {
  const map: Record<string, string> = {
    '7': '#e74c3c', 'A': '#ffd700', 'K': '#a29bfe', 'Q': '#00b894',
    'J': '#0984e3', 'W': '#fd79a8', 'X': '#fdcb6e', 'BAR': '#dfe6e9',
  }
  return map[symbol] || '#fff'
}
const slotSpinning = ref(false)
const slotBet = ref(50)
const slotResult = ref<{ text: string; type: string } | null>(null)
const jackpot = ref(88888)

function spinSlots() {
  if (slotSpinning.value || walletStore.balance < slotBet.value) return
  walletStore.balance -= slotBet.value
  walletStore.addTransaction({ type: 'expense', category: 'other', description: '老虎机下注', amount: slotBet.value })
  slotSpinning.value = true
  slotResult.value = null

  let count = 0
  const interval = setInterval(() => {
    slotReels.value = slotReels.value.map(() =>
      slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
    )
    count++
    if (count > 15) {
      clearInterval(interval)
      const final = [0, 1, 2].map(() =>
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
      )
      slotReels.value = final
      slotSpinning.value = false

      if (final[0] === final[1] && final[1] === final[2]) {
        const multiplier = final[0] === '7' ? 50 : final[0] === 'BAR' ? 20 : 10
        const win = slotBet.value * multiplier
        walletStore.balance += win
        walletStore.addTransaction({ type: 'income', category: 'other', description: '老虎机三连中奖', amount: win })
        slotResult.value = { text: `三连！赢得 ${win} 金币！`, type: 'win' }
        addHistory({ game: '老虎机', detail: `${final.join(' ')} 三连`, amount: win, win: true })
      } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
        const win = slotBet.value * 2
        walletStore.balance += win
        walletStore.addTransaction({ type: 'income', category: 'other', description: '老虎机两连中奖', amount: win })
        slotResult.value = { text: `两连！赢得 ${win} 金币`, type: 'win' }
        addHistory({ game: '老虎机', detail: `${final.join(' ')} 两连`, amount: win, win: true })
      } else {
        slotResult.value = { text: '没有中奖', type: 'lose' }
        addHistory({ game: '老虎机', detail: final.join(' '), amount: -slotBet.value, win: false })
      }
    }
  }, 80)
}

// ===== 骰子 =====
const diceValues = ref([1, 1, 1])
const diceTotal = ref(0)
const diceRolling = ref(false)
const diceBet = ref(50)
const diceChoice = ref<'big' | 'small' | ''>('')
const diceResultText = ref('')
const diceResultType = ref('')

function rollDice() {
  if (diceRolling.value || !diceChoice.value || walletStore.balance < diceBet.value) return
  walletStore.balance -= diceBet.value
  walletStore.addTransaction({ type: 'expense', category: 'other', description: '骰子下注', amount: diceBet.value })
  diceRolling.value = true
  diceResultText.value = ''

  let count = 0
  const interval = setInterval(() => {
    diceValues.value = [
      Math.ceil(Math.random() * 6),
      Math.ceil(Math.random() * 6),
      Math.ceil(Math.random() * 6),
    ]
    count++
    if (count > 12) {
      clearInterval(interval)
      diceRolling.value = false
      const total = diceValues.value.reduce((a, b) => a + b, 0)
      diceTotal.value = total
      const isBig = total >= 11
      const playerWin = (diceChoice.value === 'big' && isBig) || (diceChoice.value === 'small' && !isBig)

      if (playerWin) {
        const win = diceBet.value * 2
        walletStore.balance += win
        walletStore.addTransaction({ type: 'income', category: 'other', description: '骰子中奖', amount: win })
        diceResultText.value = `猜对了！赢得 ${win} 金币`
        diceResultType.value = 'win'
        addHistory({ game: '骰子', detail: `${total}点 ${isBig ? '大' : '小'} 猜${diceChoice.value === 'big' ? '大' : '小'}`, amount: win, win: true })
      } else {
        diceResultText.value = `猜错了，${total}点是${isBig ? '大' : '小'}`
        diceResultType.value = 'lose'
        addHistory({ game: '骰子', detail: `${total}点 猜错`, amount: -diceBet.value, win: false })
      }
    }
  }, 100)
}

// ===== 幸运转盘 =====
const wheelSegments = [
  { label: '10币', emoji: '$', color: '#ff6b6b', value: 10 },
  { label: '50币', emoji: '$$', color: '#ffd93d', value: 50 },
  { label: '100币', emoji: 'x2', color: '#6bcb77', value: 100 },
  { label: '再来', emoji: 'GO', color: '#4d96ff', value: 0 },
  { label: '200币', emoji: 'x4', color: '#ff6b6b', value: 200 },
  { label: '20币', emoji: '+', color: '#ffd93d', value: 20 },
  { label: '500币', emoji: 'x10', color: '#6bcb77', value: 500 },
  { label: '谢谢', emoji: '--', color: '#4d96ff', value: -1 },
]

const segAngle = 360 / wheelSegments.length
const wheelAngle = ref(0)
const wheelSpinning = ref(false)
const wheelResult = ref('')
const wheelTransition = ref('none')

function spinWheel() {
  if (wheelSpinning.value || walletStore.balance < 50) return
  walletStore.balance -= 50
  walletStore.addTransaction({ type: 'expense', category: 'other', description: '转盘下注', amount: 50 })
  wheelSpinning.value = true
  wheelResult.value = ''

  const targetIdx = Math.floor(Math.random() * wheelSegments.length)
  const targetAngle = 360 - (targetIdx * segAngle + segAngle / 2)
  const spins = 5 + Math.floor(Math.random() * 3)
  const finalAngle = wheelAngle.value + spins * 360 + targetAngle - (wheelAngle.value % 360)

  wheelTransition.value = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
  wheelAngle.value = finalAngle

  setTimeout(() => {
    wheelSpinning.value = false
    wheelTransition.value = 'none'
    const seg = wheelSegments[targetIdx]
    if (seg.value > 0) {
      walletStore.balance += seg.value
      walletStore.addTransaction({ type: 'income', category: 'other', description: '转盘中奖', amount: seg.value })
      wheelResult.value = `中奖：${seg.label}`
      addHistory({ game: '转盘', detail: seg.label, amount: seg.value, win: true })
    } else if (seg.value === 0) {
      wheelResult.value = '免费再来一次！'
      walletStore.balance += 50
      addHistory({ game: '转盘', detail: '免费一次', amount: 0, win: true })
    } else {
      wheelResult.value = '谢谢参与'
      addHistory({ game: '转盘', detail: '未中奖', amount: -50, win: false })
    }
  }, 4200)
}

// Helper: add history to local + API
function addHistory(item: HistoryItem) {
  history.value.push(item)
  gameApi.createRecord(item).catch(() => {})
}

function recharge() {
  walletStore.topUp(1000)
}

onMounted(async () => {
  // Load game records from API
  try {
    const res = await gameApi.listRecords()
    if (res.data && res.data.length > 0) {
      history.value = res.data.map(r => ({
        game: r.game,
        detail: r.detail,
        amount: r.amount,
        win: r.win,
      }))
    }
  } catch { /* ignore */ }
})
</script>

<style scoped>
.casino-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow-y: auto;
}

.balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  margin: 8px 12px;
  border-radius: 14px;
  color: #fff;
}

.balance-label { font-size: 12px; opacity: 0.7; }
.balance-value { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 4px; margin-top: 2px; }

.coin-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.recharge-btn {
  padding: 6px 16px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.game-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
}

.game-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px;
  border-radius: 14px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.game-tab.active {
  border-color: var(--color-primary);
  background: var(--bg-tertiary);
}

.tab-icon-wrap {
  width: 28px;
  height: 28px;
}

.tab-icon-wrap svg {
  width: 100%;
  height: 100%;
  color: var(--text-secondary);
}

.game-tab.active .tab-icon-wrap svg {
  color: var(--color-primary);
}

.tab-name { font-size: 12px; color: var(--text-secondary); font-weight: 500; }

.game-area {
  padding: 8px 12px;
}

/* ===== 老虎机 ===== */
.slots-machine {
  background: linear-gradient(180deg, #1a1a2e, #0f3460);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
}

.slots-header {
  margin-bottom: 16px;
}

.jackpot-label {
  font-size: 14px;
  color: #ffd700;
  font-weight: 700;
}

.jackpot-value {
  font-size: 28px;
  font-weight: 800;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.slots-reels {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.reel {
  width: 80px;
  height: 80px;
  background: #fff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #ffd700;
}

.reel.spinning {
  animation: reel-shake 0.1s infinite;
}

@keyframes reel-shake {
  0%, 100% { transform: translateY(-2px); }
  50% { transform: translateY(2px); }
}

.reel-symbol {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -1px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
  font-family: 'Inter', sans-serif;
}

.slot-result {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 10px;
}

.slot-result.win { color: #4caf50; background: rgba(76, 175, 80, 0.15); }
.slot-result.lose { color: #ff6b6b; background: rgba(255, 107, 107, 0.15); }

.slots-bet {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.bet-options {
  display: flex;
  gap: 6px;
}

.bet-options button {
  padding: 4px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.bet-options button.active {
  background: #ffd700;
  color: #000;
  border-color: #ffd700;
  font-weight: 600;
}

.spin-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ff3b30, #ff6b6b);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 2px;
}

.spin-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== 骰子 ===== */
.dice-game {
  background: linear-gradient(180deg, #0d7377, #14586b);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
}

.dice-display {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dice {
  width: 70px;
  height: 70px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.dice-svg {
  width: 100%;
  height: 100%;
}

.dice.rolling {
  animation: dice-roll 0.15s infinite;
}

@keyframes dice-roll {
  0% { transform: rotate(-10deg) scale(1.05); }
  50% { transform: rotate(10deg) scale(0.95); }
  100% { transform: rotate(-10deg) scale(1.05); }
}

.dice-total {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.dice-result {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 10px;
}

.dice-result.win { color: #4caf50; background: rgba(76, 175, 80, 0.2); }
.dice-result.lose { color: #ff6b6b; background: rgba(255, 107, 107, 0.2); }

.dice-bet-section {
  margin-bottom: 12px;
}

.bet-amount-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.dice-choice {
  display: flex;
  gap: 10px;
}

.choice-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid transparent;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-btn.big {
  background: rgba(255, 59, 48, 0.2);
  color: #ff6b6b;
}

.choice-btn.big.active {
  background: #ff3b30;
  color: #fff;
  border-color: #ff6b6b;
}

.choice-btn.small {
  background: rgba(52, 199, 89, 0.2);
  color: #6bcb77;
}

.choice-btn.small.active {
  background: #34c759;
  color: #fff;
  border-color: #6bcb77;
}

.roll-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.roll-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== 转盘 ===== */
.wheel-game {
  text-align: center;
  padding: 8px 0;
}

.wheel-container {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto 16px;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: 4px solid #ffd700;
}

.wheel-segment {
  position: absolute;
  width: 50%;
  height: 50%;
  top: 0;
  right: 0;
  transform-origin: bottom left;
  clip-path: polygon(0 0, 100% 0, 0 100%);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.segment-content {
  position: absolute;
  top: 20px;
  right: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.seg-emoji { font-size: 16px; }
.seg-label { font-size: 9px; color: #fff; font-weight: 600; }

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  color: #ff3b30;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.wheel-result {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.wheel-cost {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 10px;
}

.wheel-spin-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.wheel-spin-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== 历史记录 ===== */
.history-section {
  padding: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.history-header .clear-btn {
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
  font-weight: 400;
}

.history-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-quaternary);
  font-size: 13px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border-radius: 10px;
  font-size: 13px;
}

.h-game { font-weight: 600; color: var(--text-primary); flex-shrink: 0; }
.h-detail { flex: 1; color: var(--text-tertiary); font-size: 12px; }
.h-result { font-weight: 700; flex-shrink: 0; }
.h-result.win { color: #34c759; }
.h-result.lose { color: #ff3b30; }
</style>
