<template>
  <div class="couple-space-page">
    <NavBar title="情侣空间" />

    <!-- 头部横幅 -->
    <div class="couple-banner">
      <div class="banner-bg"></div>
      <div class="banner-particles">
        <span v-for="n in 12" :key="n" class="particle" :style="particleStyle(n)"></span>
      </div>
      <div class="couple-avatars">
        <div class="avatar-wrapper">
          <div class="avatar avatar-a">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span class="avatar-name">{{ partnerA }}</span>
        </div>
        <div class="heart-connector">
          <div class="heart-ring">
            <svg class="heart-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span class="days-badge">{{ daysTogether }} 天</span>
        </div>
        <div class="avatar-wrapper">
          <div class="avatar avatar-b">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span class="avatar-name">{{ partnerB }}</span>
        </div>
      </div>
      <div class="together-text">在一起的第 <em>{{ daysTogether }}</em> 天</div>
    </div>

    <!-- 功能网格 -->
    <div class="features-grid">
      <div
        v-for="feat in features"
        :key="feat.label"
        class="feature-card"
        :style="{ '--feat-color': feat.color }"
        @click="handleFeature(feat.action)"
      >
        <div class="feature-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="feat.svg"></svg>
        </div>
        <span class="feature-label">{{ feat.label }}</span>
      </div>
    </div>

    <!-- 纪念日列表 -->
    <div class="section">
      <div class="section-header">
        <h3>纪念日</h3>
        <button class="add-btn" @click="showAddAnniversary = true">+ 添加</button>
      </div>
      <div v-if="anniversaries.length === 0" class="empty-hint">
        还没有纪念日，快来添加吧~
      </div>
      <div v-else class="anniversary-list">
        <div v-for="ann in anniversaries" :key="ann.id" class="anniversary-item">
          <div class="ann-icon-wrap" :style="{ background: getAnnColor(ann.icon) }">
            <svg class="ann-svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="annIconSvgs[ann.icon] || annIconSvgs['heart']"></svg>
          </div>
          <div class="ann-info">
            <span class="ann-title">{{ ann.title }}</span>
            <span class="ann-date">{{ ann.date }}</span>
          </div>
          <div class="ann-countdown">
            <span class="countdown-num">{{ Math.abs(ann.daysLeft) }}</span>
            <span class="countdown-label">{{ ann.daysLeft >= 0 ? '天后' : '天前' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 情侣相册 -->
    <div class="section">
      <div class="section-header">
        <h3>我们的相册</h3>
        <button class="add-btn" @click="addPhoto">+ 上传</button>
      </div>
      <div v-if="photos.length === 0" class="empty-hint">
        还没有照片，快来记录甜蜜瞬间~
      </div>
      <div v-else class="photo-grid">
        <div v-for="(photo, idx) in photos" :key="idx" class="photo-item">
          <div class="photo-card" :style="{ '--delay': idx * 0.1 + 's' }">
            <svg class="photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <span class="photo-date">{{ photo.date }}</span>
        </div>
      </div>
    </div>

    <!-- 情侣任务 -->
    <div class="section">
      <div class="section-header">
        <h3>情侣任务</h3>
      </div>
      <div class="task-list">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ completed: task.done }"
          @click="toggleTask(task)"
        >
          <div class="task-check">
            <svg v-if="task.done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span class="task-text">{{ task.text }}</span>
        </div>
      </div>
      <div class="task-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: taskProgress + '%' }"></div>
        </div>
        <span class="progress-text">{{ completedTasks }}/{{ tasks.length }} 已完成</span>
      </div>
    </div>

    <!-- 添加纪念日弹窗 -->
    <div v-if="showAddAnniversary" class="modal-overlay" @click.self="showAddAnniversary = false">
      <div class="modal-panel">
        <h3>添加纪念日</h3>
        <div class="form-group">
          <label>名称</label>
          <input v-model="newAnn.title" placeholder="例如：在一起纪念日" />
        </div>
        <div class="form-group">
          <label>日期</label>
          <input v-model="newAnn.date" type="date" />
        </div>
        <div class="form-group">
          <label>图标</label>
          <div class="icon-picker">
            <div
              v-for="iconKey in annIcons"
              :key="iconKey"
              class="icon-option"
              :class="{ selected: newAnn.icon === iconKey }"
              :style="{ background: newAnn.icon === iconKey ? getAnnColor(iconKey) : '' }"
              @click="newAnn.icon = iconKey"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="annIconSvgs[iconKey]"></svg>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showAddAnniversary = false">取消</button>
          <button class="confirm-btn" @click="addAnniversary">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import NavBar from '@/components/common/NavBar.vue'

const partnerA = ref('我')
const partnerB = ref('TA')
const daysTogether = ref(365)

const features = [
  {
    svg: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    label: '纪念日', action: 'anniversary', color: '#FF6B9D',
  },
  {
    svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    label: '相册', action: 'album', color: '#6C5CE7',
  },
  {
    svg: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>',
    label: '情书', action: 'letter', color: '#E84393',
  },
  {
    svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    label: '心愿单', action: 'wish', color: '#FDCB6E',
  },
  {
    svg: '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="13" r=".5" fill="currentColor"/><circle cx="18" cy="11" r=".5" fill="currentColor"/><path d="M17.3 5H6.7a4 4 0 0 0-3.9 3.1L2 12.5a2.5 2.5 0 0 0 4 2.3l1-1.3h10l1 1.3a2.5 2.5 0 0 0 4-2.3l-.8-4.4A4 4 0 0 0 17.3 5z"/>',
    label: '小游戏', action: 'game', color: '#00B894',
  },
  {
    svg: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    label: '足迹', action: 'footprint', color: '#0984E3',
  },
]

function particleStyle(n: number) {
  const angle = (n / 12) * 360
  const r = 30 + Math.random() * 40
  return {
    left: `${50 + r * Math.cos(angle * Math.PI / 180)}%`,
    top: `${50 + r * Math.sin(angle * Math.PI / 180)}%`,
    animationDelay: `${n * 0.3}s`,
    animationDuration: `${2 + Math.random() * 2}s`,
  }
}

interface Anniversary {
  id: number
  title: string
  date: string
  icon: string
  daysLeft: number
}

const anniversaries = ref<Anniversary[]>([
  { id: 1, title: '在一起纪念日', date: '2024-02-14', icon: 'heart', daysLeft: 354 },
  { id: 2, title: '第一次旅行', date: '2024-05-01', icon: 'plane', daysLeft: 65 },
])

const annIcons = ['heart', 'ring', 'plane', 'home', 'flower', 'cake', 'gift', 'star']

const annIconSvgs: Record<string, string> = {
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  ring: '<circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M9 5l-2-3M15 5l2-3"/>',
  plane: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  flower: '<circle cx="12" cy="12" r="3"/><path d="M12 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM12 14a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM6 8a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1 0-8zM14 8a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1 0-8z"/>',
  cake: '<path d="M2 21h20M5 21V10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11"/><path d="M9 8V5M12 8V3M15 8V5"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
}

function getAnnColor(icon: string): string {
  const map: Record<string, string> = {
    'heart': 'linear-gradient(135deg, #FF6B9D, #C44DFF)',
    'ring': 'linear-gradient(135deg, #FDCB6E, #E17055)',
    'plane': 'linear-gradient(135deg, #74B9FF, #0984E3)',
    'home': 'linear-gradient(135deg, #55EFC4, #00B894)',
    'flower': 'linear-gradient(135deg, #FD79A8, #E84393)',
    'cake': 'linear-gradient(135deg, #A29BFE, #6C5CE7)',
    'gift': 'linear-gradient(135deg, #00B894, #2ED573)',
    'star': 'linear-gradient(135deg, #FDCB6E, #F39C12)',
  }
  return map[icon] || 'linear-gradient(135deg, #FF6B9D, #C44DFF)'
}

const showAddAnniversary = ref(false)
const newAnn = reactive({
  title: '',
  date: '',
  icon: 'heart',
})

function addAnniversary() {
  if (!newAnn.title || !newAnn.date) return
  const target = new Date(newAnn.date)
  const now = new Date()
  const daysLeft = Math.ceil((target.getTime() - now.getTime()) / 86400000)
  anniversaries.value.push({
    id: Date.now(),
    title: newAnn.title,
    date: newAnn.date,
    icon: newAnn.icon,
    daysLeft,
  })
  newAnn.title = ''
  newAnn.date = ''
  newAnn.icon = '❤️'
  showAddAnniversary.value = false
}

interface Photo {
  date: string
  url?: string
}

const photos = ref<Photo[]>([
  { date: '2024-12-25' },
  { date: '2024-10-01' },
  { date: '2024-08-15' },
])

function addPhoto() {
  photos.value.unshift({ date: new Date().toISOString().slice(0, 10) })
}

interface CoupleTask {
  id: number
  text: string
  done: boolean
}

const tasks = ref<CoupleTask[]>([
  { id: 1, text: '一起看日出', done: false },
  { id: 2, text: '一起做一顿饭', done: true },
  { id: 3, text: '一起去游乐园', done: false },
  { id: 4, text: '一起拍一组情侣照', done: false },
  { id: 5, text: '一起写一封信给未来的自己', done: true },
  { id: 6, text: '一起看一场星空', done: false },
])

const completedTasks = computed(() => tasks.value.filter(t => t.done).length)
const taskProgress = computed(() => (completedTasks.value / tasks.value.length) * 100)

function toggleTask(task: CoupleTask) {
  task.done = !task.done
  saveData()
}

function handleFeature(action: string) {
  console.log('Feature:', action)
}

const COUPLE_KEY = 'couple-space-data'

function saveData() {
  try {
    const data = {
      anniversaries: anniversaries.value,
      photos: photos.value,
      tasks: tasks.value,
      partnerA: partnerA.value,
      partnerB: partnerB.value,
    }
    localStorage.setItem(COUPLE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function recalcDaysLeft() {
  const now = new Date()
  anniversaries.value.forEach(ann => {
    const target = new Date(ann.date)
    // Set target to this year
    target.setFullYear(now.getFullYear())
    if (target < now) target.setFullYear(now.getFullYear() + 1)
    ann.daysLeft = Math.ceil((target.getTime() - now.getTime()) / 86400000)
  })
}

watch(anniversaries, () => { recalcDaysLeft(); saveData() }, { deep: true })
watch(photos, saveData, { deep: true })

onMounted(() => {
  try {
    const saved = localStorage.getItem(COUPLE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (data.anniversaries) anniversaries.value = data.anniversaries
      if (data.photos) photos.value = data.photos
      if (data.tasks) tasks.value = data.tasks
      if (data.partnerA) partnerA.value = data.partnerA
      if (data.partnerB) partnerB.value = data.partnerB
    }
  } catch { /* ignore */ }
  recalcDaysLeft()
})
</script>

<style scoped>
.couple-space-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow-y: auto;
}

/* ===== 头部横幅 ===== */
.couple-banner {
  position: relative;
  padding: 28px 16px 22px;
  text-align: center;
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44dff 40%, #6e8efb 100%);
  opacity: 0.12;
}

.banner-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 40%, rgba(255, 107, 157, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(196, 77, 255, 0.15) 0%, transparent 50%);
}

.banner-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 107, 157, 0.4);
  animation: particleFloat 3s ease-in-out infinite;
}

@keyframes particleFloat {
  0%, 100% { opacity: 0.2; transform: translateY(0) scale(1); }
  50% { opacity: 0.6; transform: translateY(-8px) scale(1.5); }
}

.couple-avatars {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 14px;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
}

.avatar svg {
  width: 32px;
  height: 32px;
}

.avatar-a {
  background: linear-gradient(135deg, #74B9FF, #0984E3);
  border: 3px solid rgba(116, 185, 255, 0.4);
  box-shadow: 0 4px 20px rgba(9, 132, 227, 0.3);
}

.avatar-b {
  background: linear-gradient(135deg, #FD79A8, #E84393);
  border: 3px solid rgba(253, 121, 168, 0.4);
  box-shadow: 0 4px 20px rgba(232, 67, 147, 0.3);
}

.avatar-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.heart-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.heart-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(196, 77, 255, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  animation: heartPulse 1.5s ease-in-out infinite;
}

.heart-svg {
  width: 24px;
  height: 24px;
  color: #FF6B9D;
  filter: drop-shadow(0 2px 6px rgba(255, 107, 157, 0.5));
}

@keyframes heartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.days-badge {
  font-size: 11px;
  color: #FF6B9D;
  font-weight: 700;
  background: rgba(255, 107, 157, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.together-text {
  position: relative;
  font-size: 14px;
  color: var(--text-secondary);
}

.together-text em {
  font-style: normal;
  font-weight: 700;
  color: #FF6B9D;
}

/* ===== 功能网格 ===== */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px 16px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 8px 14px;
  background: var(--bg-secondary);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--feat-color);
  opacity: 0.6;
  border-radius: 16px 16px 0 0;
}

.feature-card:active {
  transform: scale(0.95);
}

.feature-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 107, 157, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon-wrap svg {
  width: 22px;
  height: 22px;
  color: var(--feat-color);
}

.feature-label {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
}

/* ===== 区块 ===== */
.section {
  padding: 0 16px 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
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
  font-size: 13px;
  color: #FF6B9D;
  cursor: pointer;
  font-weight: 600;
}

.empty-hint {
  text-align: center;
  padding: 28px;
  color: var(--text-tertiary);
  font-size: 13px;
  background: var(--bg-secondary);
  border-radius: 14px;
}

/* ===== 纪念日 ===== */
.anniversary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.anniversary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-secondary);
  border-radius: 16px;
  transition: transform 0.2s;
}

.anniversary-item:active {
  transform: scale(0.98);
}

.ann-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ann-svg {
  width: 22px;
  height: 22px;
}

.ann-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ann-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.ann-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.ann-countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.countdown-num {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.countdown-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* ===== 相册 ===== */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.photo-card {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.08), rgba(108, 92, 231, 0.08));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(255, 107, 157, 0.2);
  transition: transform 0.2s;
  animation: photoFadeIn 0.5s ease calc(var(--delay)) both;
}

@keyframes photoFadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.photo-card:active {
  transform: scale(0.95);
}

.photo-icon {
  width: 28px;
  height: 28px;
  color: rgba(255, 107, 157, 0.4);
}

.photo-date {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* ===== 情侣任务 ===== */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.task-item:active {
  transform: scale(0.98);
}

.task-item.completed {
  opacity: 0.55;
}

.task-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 107, 157, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.task-item.completed .task-check {
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
  border-color: transparent;
}

.task-check svg {
  width: 14px;
  height: 14px;
  color: #fff;
}

.task-text {
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.25s;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.task-progress {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B9D, #C44DFF);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

/* ===== 弹窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
  animation: overlayIn 0.2s ease;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-panel {
  width: 100%;
  max-width: 340px;
  background: var(--bg-secondary);
  border-radius: 24px;
  padding: 24px;
  animation: panelSlideIn 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes panelSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-panel h3 {
  margin: 0 0 18px;
  font-size: 18px;
  color: var(--text-primary);
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #FF6B9D;
}

.icon-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.icon-option {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--bg-primary);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.icon-option svg {
  width: 20px;
  height: 20px;
}

.icon-option:active {
  transform: scale(0.9);
}

.icon-option.selected {
  border-color: #FF6B9D;
  color: #fff;
  transform: scale(1.05);
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.cancel-btn:active,
.confirm-btn:active {
  transform: scale(0.96);
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.confirm-btn {
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
  color: #fff;
  box-shadow: 0 4px 14px rgba(255, 107, 157, 0.3);
}
</style>
