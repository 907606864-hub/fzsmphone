<template>
  <div class="theater-page">
    <!-- 播放器模式 -->
    <template v-if="currentDrama">
      <div class="player-section">
        <div class="player-screen" :style="{ background: currentDrama.bgGradient }">
          <div class="player-content">
            <div class="player-emoji">{{ currentDrama.emoji }}</div>
            <div v-if="!isPlaying" class="play-overlay" @click="isPlaying = true">
              <div class="play-circle">▶</div>
            </div>
            <div v-if="isPlaying" class="playing-indicator">
              <div class="bar" v-for="i in 4" :key="i"></div>
            </div>
          </div>
          <div class="player-top-bar">
            <span class="back-arrow" @click="currentDrama = null; isPlaying = false">←</span>
            <span class="player-title">{{ currentDrama.title }} 第{{ currentEpisode }}集</span>
            <span class="more-icon">⋯</span>
          </div>
          <div class="player-bottom">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="player-controls">
              <span class="time-text">{{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}</span>
              <div class="control-btns">
                <span @click="isPlaying = !isPlaying">{{ isPlaying ? '⏸' : '▶️' }}</span>
                <span @click="nextEpisode">⏭</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 剧集信息 -->
      <div class="drama-info-section">
        <div class="drama-meta">
          <h3>{{ currentDrama.title }}</h3>
          <div class="meta-row">
            <span class="meta-tag">{{ currentDrama.category }}</span>
            <span class="meta-tag">{{ currentDrama.year }}</span>
            <span class="meta-rating">★ {{ currentDrama.rating }}</span>
            <span class="meta-views">{{ formatViews(currentDrama.views) }}播放</span>
          </div>
          <p class="drama-desc">{{ currentDrama.desc }}</p>
        </div>

        <!-- 选集 -->
        <div class="episodes-section">
          <div class="section-title">选集</div>
          <div class="episodes-grid">
            <div
              v-for="ep in currentDrama.episodes"
              :key="ep"
              class="episode-btn"
              :class="{ active: currentEpisode === ep }"
              @click="selectEpisode(ep)"
            >
              {{ ep }}
            </div>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="comments-section">
          <div class="section-title">评论 ({{ comments.length }})</div>
          <div class="comment-input-row">
            <input v-model="commentInput" placeholder="发表评论..." @keyup.enter="postComment" />
            <button @click="postComment">发送</button>
          </div>
          <div class="comments-list">
            <div v-for="(c, i) in comments" :key="i" class="comment-item">
              <div class="comment-avatar">{{ c.avatar }}</div>
              <div class="comment-body">
                <div class="comment-header">
                  <span class="comment-name">{{ c.name }}</span>
                  <span class="comment-time">{{ c.time }}</span>
                </div>
                <div class="comment-text">{{ c.text }}</div>
                <div class="comment-actions">
                  <span @click="c.liked = !c.liked; c.likes += c.liked ? 1 : -1">
                    {{ c.liked ? '♥' : '♡' }} {{ c.likes }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 列表模式 -->
    <template v-else>
      <NavBar title="小剧场" back>
        <template #right>
          <button class="gen-btn" @click="handleGenerate" :disabled="aiStore.generating">
            {{ aiStore.theaterLoading ? 'AI生成中...' : 'AI生成' }}
          </button>
        </template>
      </NavBar>

      <!-- 分类标签 -->
      <div class="category-tabs">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="cat-tab"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          {{ cat.name }}
        </div>
      </div>

      <!-- 热门推荐 -->
      <div v-if="activeCategory === 'all'" class="hot-section">
        <div class="section-title">▲ 热门推荐</div>
        <div class="hot-scroll">
          <div
            v-for="d in hotDramas"
            :key="d.id"
            class="hot-card"
            @click="openDrama(d)"
          >
            <div class="hot-cover" :style="{ background: d.bgGradient }">
              <div class="hot-emoji">{{ d.emoji }}</div>
              <div class="hot-badge">{{ d.category }}</div>
            </div>
            <div class="hot-title">{{ d.title }}</div>
            <div class="hot-info">★{{ d.rating }} · {{ d.episodes.length }}集</div>
          </div>
        </div>
      </div>

      <!-- 剧目列表 -->
      <div class="drama-list">
        <div class="section-title">{{ activeCategory === 'all' ? '全部剧目' : categories.find(c => c.id === activeCategory)?.name }}</div>
        <div
          v-for="d in filteredDramas"
          :key="d.id"
          class="drama-card"
          @click="openDrama(d)"
        >
          <div class="drama-cover" :style="{ background: d.bgGradient }">
            <div class="cover-emoji">{{ d.emoji }}</div>
          </div>
          <div class="drama-detail">
            <div class="drama-title">{{ d.title }}</div>
            <div class="drama-tags">
              <span class="d-tag">{{ d.category }}</span>
              <span class="d-tag">{{ d.year }}</span>
            </div>
            <div class="drama-rating">★ {{ d.rating }} · {{ formatViews(d.views) }}播放</div>
            <div class="drama-brief">{{ d.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-if="watchHistory.length > 0" class="history-section">
        <div class="section-title">▤ 观看历史</div>
        <div class="history-list">
          <div v-for="h in watchHistory" :key="h.id" class="history-item" @click="openDrama(h.drama, h.episode)">
            <span class="h-emoji">{{ h.drama.emoji }}</span>
            <span class="h-name">{{ h.drama.title }} 第{{ h.episode }}集</span>
            <span class="h-time">{{ h.time }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useSocialAIStore } from '@/stores/socialAI'

const aiStore = useSocialAIStore()

interface Drama {
  id: number
  title: string
  emoji: string
  category: string
  year: number
  rating: number
  views: number
  desc: string
  bgGradient: string
  episodes: number[]
}

interface CommentItem {
  avatar: string
  name: string
  text: string
  time: string
  likes: number
  liked: boolean
}

interface HistoryEntry {
  id: number
  drama: Drama
  episode: number
  time: string
}

const categories = [
  { id: 'all', name: '全部' },
  { id: '甜宠', name: '甜宠' },
  { id: '古装', name: '古装' },
  { id: '悬疑', name: '悬疑' },
  { id: '搞笑', name: '搞笑' },
  { id: '都市', name: '都市' },
]

const activeCategory = ref('all')

const allDramas = ref<Drama[]>([
  { id: 1, title: '甜蜜追击', emoji: '♥', category: '甜宠', year: 2024, rating: 9.2, views: 2840000, desc: '霸道总裁爱上我，一场甜蜜的追逐战，每一集都让人心跳加速。', bgGradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)', episodes: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 2, title: '长安幻梦', emoji: '◈', category: '古装', year: 2024, rating: 9.0, views: 1920000, desc: '大唐盛世下的一段奇幻旅程，穿越千年的爱恨情仇。', bgGradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', episodes: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
  { id: 3, title: '迷雾真相', emoji: '◎', category: '悬疑', year: 2024, rating: 9.5, views: 3210000, desc: '一桩离奇失踪案牵出惊天阴谋，层层推理揭开真相。', bgGradient: 'linear-gradient(135deg, #667eea, #764ba2)', episodes: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 4, title: '奶爸日记', emoji: '◎', category: '搞笑', year: 2024, rating: 8.8, views: 1580000, desc: '新手奶爸的爆笑育儿之路，笑中带泪的温馨故事。', bgGradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', episodes: [1,2,3,4,5,6,7,8] },
  { id: 5, title: '星辰恋语', emoji: '★', category: '甜宠', year: 2024, rating: 9.1, views: 2150000, desc: '天文系学霸和音乐才女的浪漫邂逅，在星空下许下永恒。', bgGradient: 'linear-gradient(135deg, #fa709a, #fee140)', episodes: [1,2,3,4,5,6,7,8,9,10] },
  { id: 6, title: '都市暗影', emoji: '★', category: '都市', year: 2024, rating: 8.9, views: 1750000, desc: '金融精英的双面人生，白天是职场强者，夜晚追寻真相。', bgGradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', episodes: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 7, title: '花间词', emoji: '✿', category: '古装', year: 2024, rating: 8.7, views: 1320000, desc: '江南才女的诗词人生，一曲花间词道尽悲欢离合。', bgGradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)', episodes: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
  { id: 8, title: '职场反击战', emoji: '▢', category: '都市', year: 2024, rating: 9.3, views: 2680000, desc: '被陷害离职的女主角绝地反击，一路逆袭登上巅峰。', bgGradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)', episodes: [1,2,3,4,5,6,7,8,9,10] },
])

const hotDramas = computed(() => {
  return [...allDramas.value].sort((a, b) => b.views - a.views).slice(0, 4)
})

const filteredDramas = computed(() => {
  if (activeCategory.value === 'all') return allDramas.value
  return allDramas.value.filter(d => d.category === activeCategory.value)
})

// 播放器状态
const currentDrama = ref<Drama | null>(null)
const currentEpisode = ref(1)
const isPlaying = ref(false)
const currentTime = ref(0)
const totalTime = ref(1800) // 30min per episode
const progressPercent = computed(() => (currentTime.value / totalTime.value) * 100)
const commentInput = ref('')
const comments = ref<CommentItem[]>([])
const watchHistory = ref<HistoryEntry[]>([])

let playTimer: ReturnType<typeof setInterval> | null = null

const mockComments: CommentItem[] = [
  { avatar: '◠', name: '追剧少女', text: '太好看了！停不下来', time: '2分钟前', likes: 128, liked: false },
  { avatar: '◎', name: '影评人老王', text: '剧情紧凑，演技在线，推荐！', time: '15分钟前', likes: 86, liked: false },
  { avatar: '◡', name: '哭包小鱼', text: '看哭了...这段也太虐了吧', time: '32分钟前', likes: 54, liked: false },
  { avatar: '◠', name: '快乐水', text: '哈哈哈这段笑死我了', time: '1小时前', likes: 201, liked: false },
  { avatar: '◉', name: '剧透警察', text: '第8集有大反转，记得追！', time: '2小时前', likes: 45, liked: false },
]

function openDrama(d: Drama, ep?: number) {
  currentDrama.value = d
  currentEpisode.value = ep || 1
  currentTime.value = 0
  isPlaying.value = false
  comments.value = mockComments.map(c => ({ ...c, liked: false }))

  // 记录历史
  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  const existing = watchHistory.value.findIndex(h => h.drama.id === d.id)
  if (existing >= 0) watchHistory.value.splice(existing, 1)
  watchHistory.value.unshift({ id: Date.now(), drama: d, episode: currentEpisode.value, time: timeStr })
  if (watchHistory.value.length > 10) watchHistory.value = watchHistory.value.slice(0, 10)

  startPlayTimer()
}

function selectEpisode(ep: number) {
  currentEpisode.value = ep
  currentTime.value = 0
  isPlaying.value = true
}

function nextEpisode() {
  if (!currentDrama.value) return
  const maxEp = currentDrama.value.episodes.length
  if (currentEpisode.value < maxEp) {
    selectEpisode(currentEpisode.value + 1)
  }
}

function startPlayTimer() {
  if (playTimer) clearInterval(playTimer)
  playTimer = setInterval(() => {
    if (isPlaying.value && currentTime.value < totalTime.value) {
      currentTime.value += 1
    }
  }, 1000)
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function formatViews(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return String(n)
}

function postComment() {
  const text = commentInput.value.trim()
  if (!text) return
  comments.value.unshift({
    avatar: '◠',
    name: '我',
    text,
    time: '刚刚',
    likes: 0,
    liked: false,
  })
  commentInput.value = ''
}

async function handleGenerate() {
  await aiStore.generateTheaterContent()
  if (aiStore.theaterDramas.length > 0) {
    allDramas.value = aiStore.theaterDramas.map((d, i) => ({
      id: i + 100,
      title: d.title,
      emoji: d.emoji,
      category: d.category,
      year: 2024,
      rating: d.rating,
      views: d.views,
      desc: d.desc,
      bgGradient: d.bgGradient,
      episodes: d.episodes,
    }))
  }
}

onMounted(() => {
  aiStore.loadData('theater')
  if (aiStore.theaterDramas.length > 0) {
    allDramas.value = aiStore.theaterDramas.map((d, i) => ({
      id: i + 100,
      title: d.title,
      emoji: d.emoji,
      category: d.category,
      year: 2024,
      rating: d.rating,
      views: d.views,
      desc: d.desc,
      bgGradient: d.bgGradient,
      episodes: d.episodes,
    }))
  }
})

onUnmounted(() => {
  if (playTimer) clearInterval(playTimer)
})
</script>

<style scoped>
.theater-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow-y: auto;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
}

.category-tabs::-webkit-scrollbar { display: none; }

.cat-tab {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  transition: all 0.2s;
  flex-shrink: 0;
}

.cat-tab.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  padding: 12px 16px 8px;
}

/* 热门推荐 */
.hot-scroll {
  display: flex;
  gap: 10px;
  padding: 0 16px 8px;
  overflow-x: auto;
}

.hot-scroll::-webkit-scrollbar { display: none; }

.hot-card {
  flex-shrink: 0;
  width: 130px;
  cursor: pointer;
}

.hot-cover {
  height: 170px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 6px;
}

.hot-emoji { font-size: 48px; }

.hot-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
}

.hot-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-info {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 剧目列表 */
.drama-list {
  padding-bottom: 12px;
}

.drama-card {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.drama-card:active { background: var(--bg-secondary); }

.drama-cover {
  width: 90px;
  height: 120px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-emoji { font-size: 36px; }

.drama-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.drama-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.drama-tags {
  display: flex;
  gap: 4px;
}

.d-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.drama-rating {
  font-size: 12px;
  color: var(--text-secondary);
}

.drama-brief {
  font-size: 12px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 播放器 ===== */
.player-section {
  position: relative;
}

.player-screen {
  height: 220px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-content {
  position: relative;
}

.player-emoji { font-size: 64px; }

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.play-circle {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.playing-indicator {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 20px;
}

.playing-indicator .bar {
  width: 4px;
  background: #fff;
  border-radius: 2px;
  animation: bar-dance 0.8s ease-in-out infinite;
}

.playing-indicator .bar:nth-child(1) { height: 8px; animation-delay: 0s; }
.playing-indicator .bar:nth-child(2) { height: 14px; animation-delay: 0.2s; }
.playing-indicator .bar:nth-child(3) { height: 10px; animation-delay: 0.4s; }
.playing-indicator .bar:nth-child(4) { height: 16px; animation-delay: 0.6s; }

@keyframes bar-dance {
  0%, 100% { height: 6px; }
  50% { height: 20px; }
}

.player-top-bar {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(0,0,0,0.4), transparent);
  color: #fff;
}

.back-arrow {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.player-title {
  font-size: 14px;
  font-weight: 600;
}

.more-icon {
  font-size: 18px;
  cursor: pointer;
}

.player-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 14px;
  background: linear-gradient(0deg, rgba(0,0,0,0.5), transparent);
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: #ff3b30;
  border-radius: 2px;
  transition: width 1s linear;
}

.player-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.control-btns {
  display: flex;
  gap: 16px;
  font-size: 18px;
  color: #fff;
  cursor: pointer;
}

/* 剧集信息区 */
.drama-info-section {
  flex: 1;
}

.drama-meta {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-primary);
}

.drama-meta h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: var(--text-primary);
}

.meta-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.meta-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.meta-rating {
  font-size: 12px;
  color: #ff9500;
  font-weight: 600;
}

.meta-views {
  font-size: 11px;
  color: var(--text-quaternary);
}

.drama-meta .drama-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* 选集 */
.episodes-section {
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: 12px;
}

.episodes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px;
}

.episode-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.episode-btn.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
}

/* 评论区 */
.comments-section {
  padding-bottom: 20px;
}

.comment-input-row {
  display: flex;
  gap: 8px;
  padding: 0 16px 8px;
}

.comment-input-row input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 18px;
  border: 1px solid var(--border-primary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.comment-input-row button {
  padding: 8px 14px;
  border-radius: 18px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.comments-list {
  padding: 0 16px;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-secondary);
}

.comment-avatar {
  font-size: 28px;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.comment-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.comment-time {
  font-size: 11px;
  color: var(--text-quaternary);
}

.comment-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.comment-actions {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
}

/* 历史记录 */
.history-section {
  padding: 0 0 20px;
}

.history-list {
  padding: 0 16px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;
  font-size: 13px;
}

.h-emoji { font-size: 20px; }
.h-name { flex: 1; color: var(--text-primary); }
.h-time { color: var(--text-quaternary); font-size: 12px; }

.gen-btn {
  padding: 4px 12px;
  border-radius: 14px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.gen-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
