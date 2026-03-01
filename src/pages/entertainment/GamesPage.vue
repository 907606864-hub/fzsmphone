<template>
  <div class="games-page">
    <NavBar title="游戏中心" :show-back="true" back-to="/" />

    <div class="games-content">
      <!-- 精选横幅 -->
      <div class="banner">
        <div class="banner-card">
          <div class="banner-bg"></div>
          <div class="banner-info">
            <span class="banner-tag">每日推荐</span>
            <h3>▶ 小游戏合集</h3>
            <p>和朋友一起玩，赢取虚拟金币</p>
          </div>
        </div>
      </div>

      <!-- 快捷游戏 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">快速开始</span>
        </div>
        <div class="quick-games">
          <div
            v-for="game in quickGames"
            :key="game.name"
            class="quick-game-card"
            @click="playGame(game)"
          >
            <div class="game-icon" :style="{ background: game.color }">
              <span>{{ game.icon }}</span>
            </div>
            <div class="game-name">{{ game.name }}</div>
            <div class="game-players" v-if="game.online">{{ game.online }} 在线</div>
          </div>
        </div>
      </div>

      <!-- 游戏分类 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">全部游戏</span>
          <span class="section-count">{{ allGames.length }} 款</span>
        </div>
        <div class="game-list">
          <div
            v-for="game in allGames"
            :key="game.name"
            class="game-item"
            @click="playGame(game)"
          >
            <div class="game-item-icon" :style="{ background: game.color }">
              <span>{{ game.icon }}</span>
            </div>
            <div class="game-item-info">
              <div class="game-item-name">{{ game.name }}</div>
              <div class="game-item-desc">{{ game.description }}</div>
              <div class="game-item-meta">
                <span class="meta-tag" v-for="tag in game.tags" :key="tag">{{ tag }}</span>
              </div>
            </div>
            <button class="play-btn" @click.stop="playGame(game)">
              开始
            </button>
          </div>
        </div>
      </div>

      <!-- 排行榜 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">★ 排行榜</span>
        </div>
        <div class="leaderboard">
          <div v-for="(entry, idx) in leaderboard" :key="entry.name" class="rank-item">
            <span class="rank-num" :class="{ gold: idx === 0, silver: idx === 1, bronze: idx === 2 }">
              {{ idx < 3 ? ['★', '★', '★'][idx] : idx + 1 }}
            </span>
            <div class="rank-avatar">{{ entry.name[0] }}</div>
            <span class="rank-name">{{ entry.name }}</span>
            <span class="rank-score">{{ entry.score.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 游戏弹窗 -->
    <Teleport to="#phone-overlay">
      <div v-if="activeGame" class="modal-overlay" @click.self="activeGame = null">
        <div class="game-modal">
          <div class="modal-header">
            <span>{{ activeGame.icon }} {{ activeGame.name }}</span>
            <button class="close-btn" @click="activeGame = null">✕</button>
          </div>
          <div class="game-area">
            <!-- 猜数字游戏 -->
            <template v-if="activeGame.id === 'guess'">
              <div class="mini-game">
                <p class="game-prompt">我想了一个 1-100 之间的数字，猜猜看！</p>
                <div class="guess-result" v-if="guessResult">
                  {{ guessResult }}
                </div>
                <div class="guess-input-row">
                  <input v-model.number="guessInput" type="number" min="1" max="100" placeholder="输入数字" class="guess-input" @keydown.enter="makeGuess" />
                  <button class="guess-btn" @click="makeGuess">猜！</button>
                </div>
                <div class="guess-count">已猜 {{ guessCount }} 次</div>
                <button class="new-game-btn" @click="resetGuess">新一局</button>
              </div>
            </template>

            <!-- 骰子游戏 -->
            <template v-else-if="activeGame.id === 'dice'">
              <div class="mini-game">
                <div class="dice-display">
                  <span class="dice-face">{{ diceFaces[0] }}</span>
                  <span class="dice-face">{{ diceFaces[1] }}</span>
                </div>
                <div class="dice-total" v-if="diceRolled">
                  点数合计：{{ diceFaces[0] + diceFaces[1] }}
                </div>
                <button class="roll-btn" @click="rollDice" :class="{ rolling: diceRolling }">
                  {{ diceRolling ? '投掷中...' : '投骰子' }}
                </button>
              </div>
            </template>

            <!-- 猜拳 -->
            <template v-else-if="activeGame.id === 'rps'">
              <div class="mini-game">
                <p class="game-prompt">选择你的出招：</p>
                <div class="rps-choices">
                  <button v-for="c in rpsChoices" :key="c.key" class="rps-btn" @click="playRps(c.key)">
                    <span>{{ c.icon }}</span>
                    <span class="rps-label">{{ c.label }}</span>
                  </button>
                </div>
                <div class="rps-result" v-if="rpsResult">
                  <div>对手出了：{{ rpsChoices.find(c => c.key === rpsOpponent)?.icon }}</div>
                  <div class="rps-verdict" :class="rpsResult">{{ rpsResult === 'win' ? '你赢了！' : rpsResult === 'lose' ? '你输了...' : '平局！' }}</div>
                  <div>连胜：{{ rpsStreak }}</div>
                </div>
              </div>
            </template>

            <!-- 抛硬币 -->
            <template v-else-if="activeGame.id === 'coin'">
              <div class="mini-game">
                <div class="coin-face" :class="{ flipping: coinFlipping }">
                  {{ coinResult || '◎' }}
                </div>
                <button class="roll-btn" @click="flipCoin" :disabled="coinFlipping">
                  {{ coinFlipping ? '翻转中...' : '抛！' }}
                </button>
                <div class="coin-stats" v-if="coinTotal > 0">
                  正面 {{ coinHeads }} 次（{{ Math.round(coinHeads/coinTotal*100) }}%）·
                  反面 {{ coinTails }} 次（{{ Math.round(coinTails/coinTotal*100) }}%）
                </div>
              </div>
            </template>

            <!-- 21点 -->
            <template v-else-if="activeGame.id === 'blackjack'">
              <div class="mini-game">
                <div class="bj-section">
                  <div class="bj-label">庄家{{ bjGameOver ? '' : '（?）' }}</div>
                  <div class="bj-cards">
                    <span v-for="(c, i) in bjDealer" :key="'d'+i" class="bj-card">{{ i === 1 && !bjGameOver ? '?' : c }}</span>
                  </div>
                  <div class="bj-score" v-if="bjGameOver">点数: {{ calcHand(bjDealer) }}</div>
                </div>
                <div class="bj-section">
                  <div class="bj-label">你的手牌</div>
                  <div class="bj-cards">
                    <span v-for="(c, i) in bjPlayer" :key="'p'+i" class="bj-card">{{ c }}</span>
                  </div>
                  <div class="bj-score">点数: {{ calcHand(bjPlayer) }}</div>
                </div>
                <div class="bj-verdict" v-if="bjGameOver">{{ bjVerdict }}</div>
                <div class="bj-actions" v-if="!bjGameOver">
                  <button class="guess-btn" @click="bjHit">要牌</button>
                  <button class="new-game-btn" @click="bjStand">停牌</button>
                </div>
                <button v-else class="new-game-btn" @click="bjStart">新一局</button>
              </div>
            </template>

            <!-- 记忆翻牌 -->
            <template v-else-if="activeGame.id === 'memory'">
              <div class="mini-game">
                <div class="memory-grid">
                  <div
                    v-for="(card, idx) in memoryCards"
                    :key="idx"
                    class="memory-card"
                    :class="{ flipped: card.flipped, matched: card.matched }"
                    @click="flipMemoryCard(idx)"
                  >
                    {{ card.flipped || card.matched ? card.symbol : '？' }}
                  </div>
                </div>
                <div class="memory-stats">
                  步数: {{ memoryMoves }} · 配对: {{ memoryMatched }}/8
                </div>
                <button class="new-game-btn" @click="initMemory">重新开始</button>
              </div>
            </template>

            <!-- 猜词 -->
            <template v-else-if="activeGame.id === 'wordle'">
              <div class="mini-game">
                <div class="wordle-board">
                  <div v-for="(row, ri) in wordleGuesses" :key="ri" class="wordle-row">
                    <span v-for="(ch, ci) in row" :key="ci" class="wordle-cell" :class="getWordleClass(ri, ci)">
                      {{ ch }}
                    </span>
                  </div>
                </div>
                <div class="wordle-verdict" v-if="wordleOver">{{ wordleWon ? '恭喜猜对！' : `答案是：${wordleAnswer}` }}</div>
                <div class="guess-input-row" v-if="!wordleOver">
                  <input v-model="wordleInput" maxlength="4" class="guess-input" placeholder="输入4字词" @keydown.enter="submitWordle" />
                  <button class="guess-btn" @click="submitWordle">猜</button>
                </div>
                <div class="guess-count">第 {{ wordleGuesses.length }}/6 次</div>
                <button class="new-game-btn" @click="initWordle">换一个词</button>
              </div>
            </template>

            <!-- 其他游戏占位 -->
            <template v-else>
              <div class="mini-game">
                <span class="coming-soon-icon">{{ activeGame.icon }}</span>
                <p class="coming-soon">游戏开发中，敬请期待~</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import NavBar from '@/components/common/NavBar.vue'

interface Game {
  id: string
  name: string
  icon: string
  color: string
  description: string
  tags: string[]
  online?: number
}

const quickGames: Game[] = [
  { id: 'guess', name: '猜数字', icon: '▥', color: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', description: '猜一个1-100的数字', tags: ['单人', '益智'], online: 128 },
  { id: 'dice', name: '骰子', icon: '▣', color: 'linear-gradient(135deg, #E17055, #FAB1A0)', description: '投骰子比大小', tags: ['多人', '运气'], online: 256 },
  { id: 'rps', name: '猜拳', icon: '◇', color: 'linear-gradient(135deg, #00B894, #55EFC4)', description: '石头剪刀布', tags: ['双人', '经典'], online: 89 },
  { id: 'coin', name: '抛硬币', icon: '◎', color: 'linear-gradient(135deg, #FDCB6E, #F39C12)', description: '正反面', tags: ['单人', '运气'], online: 45 },
]

const allGames: Game[] = [
  ...quickGames,
  { id: 'blackjack', name: '21点', icon: '♠', color: 'linear-gradient(135deg, #2D3436, #636E72)', description: '经典纸牌游戏，比拼运气与策略', tags: ['赌场', '纸牌'] },
  { id: 'slots', name: '老虎机', icon: '▣', color: 'linear-gradient(135deg, #E6162D, #FF4757)', description: '转动转盘，试试你的运气', tags: ['赌场', '运气'] },
  { id: 'trivia', name: '知识问答', icon: '？', color: 'linear-gradient(135deg, #3498DB, #2980B9)', description: '测试你的知识面', tags: ['多人', '益智'] },
  { id: 'memory', name: '记忆翻牌', icon: '◎', color: 'linear-gradient(135deg, #A855F7, #EC4899)', description: '考验你的记忆力', tags: ['单人', '益智'] },
  { id: 'wordle', name: '猜词', icon: '▤', color: 'linear-gradient(135deg, #00CEC9, #81ECEC)', description: '猜出今天的词语', tags: ['单人', '文字'] },
]

const leaderboard = ref([
  { name: '小明', score: 15200 },
  { name: '小红', score: 12800 },
  { name: '小华', score: 9600 },
  { name: '小李', score: 7400 },
  { name: '小张', score: 5100 },
])

const activeGame = ref<Game | null>(null)

// 猜数字
const guessTarget = ref(0)
const guessInput = ref<number | null>(null)
const guessResult = ref('')
const guessCount = ref(0)

// 骰子
const diceFaces = ref([1, 1])
const diceRolled = ref(false)
const diceRolling = ref(false)

// 猜拳
const rpsChoices = [
  { key: 'rock', icon: '◆', label: '石头' },
  { key: 'scissors', icon: '✂', label: '剪刀' },
  { key: 'paper', icon: '□', label: '布' },
]
const rpsResult = ref<'win' | 'lose' | 'draw' | ''>('')
const rpsOpponent = ref('')
const rpsStreak = ref(0)

// 抛硬币
const coinResult = ref('')
const coinFlipping = ref(false)
const coinHeads = ref(0)
const coinTails = ref(0)
const coinTotal = ref(0)

// 21点
const bjDeck = ref<string[]>([])
const bjPlayer = ref<string[]>([])
const bjDealer = ref<string[]>([])
const bjGameOver = ref(false)
const bjVerdict = ref('')

// 记忆翻牌
interface MemoryCard { symbol: string; flipped: boolean; matched: boolean }
const memoryCards = ref<MemoryCard[]>([])
const memoryMoves = ref(0)
const memoryMatched = ref(0)
let memoryFlipped: number[] = []
let memoryLocked = false

// 猜词
const wordleWords = ['春暖花开','万里长城','龙飞凤舞','心想事成','风和日丽','鸟语花香','一帆风顺','星辰大海','山高水远','天涯海角','落花流水','火树银花','明月清风','琴棋书画','诗情画意','金玉良缘','高山流水','世外桃源','花好月圆','风花雪月']
const wordleAnswer = ref('')
const wordleGuesses = ref<string[][]>([])
const wordleInput = ref('')
const wordleOver = ref(false)
const wordleWon = ref(false)

function playGame(game: Game) {
  activeGame.value = game
  if (game.id === 'guess') resetGuess()
  if (game.id === 'dice') { diceRolled.value = false; diceRolling.value = false }
  if (game.id === 'rps') { rpsResult.value = ''; rpsStreak.value = 0 }
  if (game.id === 'coin') { coinResult.value = ''; coinHeads.value = 0; coinTails.value = 0; coinTotal.value = 0 }
  if (game.id === 'blackjack') bjStart()
  if (game.id === 'memory') initMemory()
  if (game.id === 'wordle') initWordle()
}

function resetGuess() {
  guessTarget.value = Math.floor(Math.random() * 100) + 1
  guessInput.value = null
  guessResult.value = ''
  guessCount.value = 0
}

function makeGuess() {
  if (!guessInput.value) return
  guessCount.value++
  if (guessInput.value === guessTarget.value) {
    guessResult.value = `★ 恭喜！猜对了！用了 ${guessCount.value} 次`
  } else if (guessInput.value < guessTarget.value) {
    guessResult.value = '⬆️ 太小了，再大一些'
  } else {
    guessResult.value = '⬇️ 太大了，再小一些'
  }
}

function rollDice() {
  if (diceRolling.value) return
  diceRolling.value = true
  let count = 0
  const interval = setInterval(() => {
    diceFaces.value = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
    count++
    if (count > 10) { clearInterval(interval); diceRolling.value = false; diceRolled.value = true }
  }, 100)
}

// 猜拳
function playRps(choice: string) {
  const opts = ['rock', 'scissors', 'paper']
  const opp = opts[Math.floor(Math.random() * 3)]
  rpsOpponent.value = opp
  if (choice === opp) { rpsResult.value = 'draw'; rpsStreak.value = 0 }
  else if ((choice === 'rock' && opp === 'scissors') || (choice === 'scissors' && opp === 'paper') || (choice === 'paper' && opp === 'rock')) {
    rpsResult.value = 'win'; rpsStreak.value++
  } else { rpsResult.value = 'lose'; rpsStreak.value = 0 }
}

// 抛硬币
function flipCoin() {
  coinFlipping.value = true
  coinResult.value = ''
  setTimeout(() => {
    const isHead = Math.random() > 0.5
    coinResult.value = isHead ? '正' : '反'
    coinTotal.value++
    if (isHead) coinHeads.value++; else coinTails.value++
    coinFlipping.value = false
  }, 800)
}

// 21点
function newDeck(): string[] {
  const suits = ['♠','♥','♦','♣']
  const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
  const d: string[] = []
  for (const s of suits) for (const v of vals) d.push(v + s)
  // shuffle
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]] }
  return d
}
function cardVal(c: string): number {
  const v = c.replace(/[♠♥♦♣]/g, '')
  if (v === 'A') return 11
  if (['K','Q','J'].includes(v)) return 10
  return parseInt(v)
}
function calcHand(hand: string[]): number {
  let total = hand.reduce((s, c) => s + cardVal(c), 0)
  let aces = hand.filter(c => c.startsWith('A')).length
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}
function bjStart() {
  bjDeck.value = newDeck()
  bjPlayer.value = [bjDeck.value.pop()!, bjDeck.value.pop()!]
  bjDealer.value = [bjDeck.value.pop()!, bjDeck.value.pop()!]
  bjGameOver.value = false; bjVerdict.value = ''
  if (calcHand(bjPlayer.value) === 21) { bjGameOver.value = true; bjVerdict.value = 'Blackjack！你赢了！' }
}
function bjHit() {
  bjPlayer.value.push(bjDeck.value.pop()!)
  if (calcHand(bjPlayer.value) > 21) { bjGameOver.value = true; bjVerdict.value = '爆牌！你输了...' }
  else if (calcHand(bjPlayer.value) === 21) bjStand()
}
function bjStand() {
  while (calcHand(bjDealer.value) < 17) bjDealer.value.push(bjDeck.value.pop()!)
  bjGameOver.value = true
  const p = calcHand(bjPlayer.value), d = calcHand(bjDealer.value)
  if (d > 21) bjVerdict.value = '庄家爆牌！你赢了！'
  else if (p > d) bjVerdict.value = `你赢了！ ${p} vs ${d}`
  else if (p < d) bjVerdict.value = `你输了... ${p} vs ${d}`
  else bjVerdict.value = `平局 ${p} vs ${d}`
}

// 记忆翻牌
function initMemory() {
  const symbols = ['◆','◇','○','●','△','▽','□','■']
  const pairs = [...symbols, ...symbols]
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]] }
  memoryCards.value = pairs.map(s => ({ symbol: s, flipped: false, matched: false }))
  memoryMoves.value = 0; memoryMatched.value = 0; memoryFlipped = []; memoryLocked = false
}
function flipMemoryCard(idx: number) {
  if (memoryLocked) return
  const card = memoryCards.value[idx]
  if (card.flipped || card.matched) return
  card.flipped = true
  memoryFlipped.push(idx)
  if (memoryFlipped.length === 2) {
    memoryMoves.value++
    memoryLocked = true
    const [a, b] = memoryFlipped
    if (memoryCards.value[a].symbol === memoryCards.value[b].symbol) {
      memoryCards.value[a].matched = true; memoryCards.value[b].matched = true
      memoryMatched.value++; memoryFlipped = []; memoryLocked = false
    } else {
      setTimeout(() => { memoryCards.value[a].flipped = false; memoryCards.value[b].flipped = false; memoryFlipped = []; memoryLocked = false }, 800)
    }
  }
}

// 猜词
function initWordle() {
  wordleAnswer.value = wordleWords[Math.floor(Math.random() * wordleWords.length)]
  wordleGuesses.value = []; wordleInput.value = ''; wordleOver.value = false; wordleWon.value = false
}
function submitWordle() {
  const w = wordleInput.value.trim()
  if (w.length !== 4 || wordleOver.value) return
  wordleGuesses.value.push([...w])
  wordleInput.value = ''
  if (w === wordleAnswer.value) { wordleOver.value = true; wordleWon.value = true }
  else if (wordleGuesses.value.length >= 6) { wordleOver.value = true; wordleWon.value = false }
}
function getWordleClass(row: number, col: number): string {
  if (row >= wordleGuesses.value.length) return ''
  const ch = wordleGuesses.value[row][col]
  const ans = [...wordleAnswer.value]
  if (ch === ans[col]) return 'correct'
  if (ans.includes(ch)) return 'present'
  return 'absent'
}
</script>

<style scoped>
.games-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.games-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.games-content::-webkit-scrollbar {
  display: none;
}

/* 横幅 */
.banner {
  margin-bottom: 16px;
}

.banner-card {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  height: 140px;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6C5CE7, #A855F7, #EC4899);
}

.banner-info {
  position: relative;
  z-index: 1;
  padding: 20px;
  color: #fff;
}

.banner-tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 11px;
  margin-bottom: 8px;
}

.banner-info h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
}

.banner-info p {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

/* Section */
.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-count {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* 快捷游戏 */
.quick-games {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.quick-game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.quick-game-card:active {
  opacity: 0.6;
}

.game-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.game-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.game-players {
  font-size: 10px;
  color: var(--text-tertiary);
}

/* 游戏列表 */
.game-list {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.game-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.game-item:active {
  background: var(--bg-tertiary);
}

.game-item:not(:last-child) {
  border-bottom: 0.5px solid var(--separator);
}

.game-item-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.game-item-info {
  flex: 1;
  min-width: 0;
}

.game-item-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.game-item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.game-item-meta {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.meta-tag {
  padding: 1px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-tertiary);
}

.play-btn {
  padding: 6px 16px;
  border: none;
  background: var(--brand-primary);
  color: #fff;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.play-btn:active {
  opacity: 0.8;
}

/* 排行榜 */
.leaderboard {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.rank-item:not(:last-child) {
  border-bottom: 0.5px solid var(--separator);
}

.rank-num {
  width: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.rank-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6C5CE7, #A29BFE);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.rank-name {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
}

.rank-score {
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-primary);
}

.bottom-spacer {
  height: 20px;
}

/* 游戏弹窗 */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.game-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  width: calc(100% - 48px);
  max-height: 80%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 0.5px solid var(--separator);
}

.close-btn {
  background: var(--bg-tertiary);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.game-area {
  padding: 24px 20px;
}

.mini-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 猜数字 */
.game-prompt {
  font-size: 15px;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}

.guess-result {
  font-size: 16px;
  font-weight: 600;
  color: var(--brand-primary);
  text-align: center;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.guess-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.guess-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--separator);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 18px;
  text-align: center;
  outline: none;
}

.guess-input:focus {
  border-color: var(--brand-primary);
}

.guess-btn {
  padding: 10px 20px;
  border: none;
  background: var(--brand-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.guess-count {
  font-size: 13px;
  color: var(--text-tertiary);
}

.new-game-btn {
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 8px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
}

/* 骰子 */
.dice-display {
  display: flex;
  gap: 20px;
}

.dice-face {
  font-size: 64px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 16px;
}

.dice-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.roll-btn {
  padding: 12px 32px;
  border: none;
  background: var(--brand-primary);
  color: #fff;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}

.roll-btn.rolling {
  opacity: 0.7;
}

.roll-btn:active {
  transform: scale(0.95);
}

/* Coming soon */
.coming-soon-icon {
  font-size: 64px;
}

.coming-soon {
  font-size: 15px;
  color: var(--text-tertiary);
}

/* 猜拳 */
.rps-choices { display: flex; gap: 12px; }
.rps-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 16px 20px; border: 2px solid var(--separator); border-radius: 16px;
  background: var(--bg-secondary); font-size: 32px; cursor: pointer; transition: all 0.15s;
}
.rps-btn:active { transform: scale(0.92); border-color: var(--brand-primary); }
.rps-label { font-size: 12px; color: var(--text-secondary); }
.rps-result { text-align: center; padding: 12px; background: var(--bg-tertiary); border-radius: 12px; }
.rps-verdict { font-size: 20px; font-weight: 700; margin: 4px 0; }
.rps-verdict.win { color: #27ae60; }
.rps-verdict.lose { color: #e74c3c; }
.rps-verdict.draw { color: var(--text-secondary); }

/* 抛硬币 */
.coin-face {
  width: 100px; height: 100px; border-radius: 50%;
  background: linear-gradient(135deg, #FDCB6E, #F39C12);
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 700; color: #fff;
  transition: transform 0.3s;
}
.coin-face.flipping { animation: coinSpin 0.8s ease-in-out; }
@keyframes coinSpin { 0%,100%{transform:rotateY(0)} 50%{transform:rotateY(720deg)} }
.coin-stats { font-size: 12px; color: var(--text-secondary); text-align: center; }

/* 21点 */
.bj-section { margin-bottom: 12px; text-align: center; }
.bj-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.bj-cards { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.bj-card {
  width: 48px; height: 64px; border-radius: 8px;
  background: var(--bg-primary); border: 1px solid var(--separator);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: var(--text-primary);
}
.bj-score { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-top: 4px; }
.bj-verdict { font-size: 18px; font-weight: 700; color: var(--brand-primary); text-align: center; margin-bottom: 8px; }
.bj-actions { display: flex; gap: 10px; justify-content: center; }

/* 记忆翻牌 */
.memory-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; width: 100%;
}
.memory-card {
  aspect-ratio: 1; border-radius: 10px;
  background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;
  font-size: 24px; cursor: pointer; transition: all 0.2s; user-select: none;
}
.memory-card.flipped { background: var(--brand-primary); color: #fff; }
.memory-card.matched { background: #27ae60; color: #fff; opacity: 0.7; }
.memory-stats { font-size: 13px; color: var(--text-secondary); }

/* 猜词 */
.wordle-board { display: flex; flex-direction: column; gap: 6px; align-items: center; width: 100%; }
.wordle-row { display: flex; gap: 6px; }
.wordle-cell {
  width: 44px; height: 44px; border-radius: 8px;
  background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: var(--text-primary);
}
.wordle-cell.correct { background: #27ae60; color: #fff; }
.wordle-cell.present { background: #f39c12; color: #fff; }
.wordle-cell.absent { background: var(--fill-tertiary); color: var(--text-tertiary); }
.wordle-verdict { font-size: 16px; font-weight: 600; color: var(--brand-primary); }
</style>
