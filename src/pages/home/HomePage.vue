<template>
  <div class="home-page">
    <!-- 壁纸背景 -->
    <div class="wallpaper"></div>

    <!-- 内容区域 -->
    <div class="home-content">
      <!-- 顶部间距（状态栏+灵动岛） -->
      <div class="top-spacer"></div>

      <!-- 日期时间 -->
      <div class="datetime-widget">
        <div class="widget-date">{{ dateStr }}</div>
        <div class="widget-time">{{ timeStr }}</div>
      </div>

      <!-- 滑动区域 -->
      <div
        class="swipe-container"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
      >
        <div
          class="swipe-track"
          :style="swipeTrackStyle"
        >
          <div
            v-for="(pageApps, pageIndex) in pages"
            :key="pageIndex"
            class="swipe-page"
          >
            <div class="app-grid">
              <div
                v-for="app in pageApps"
                :key="app.name"
                class="app-item pressable"
                @click="openApp(app)"
              >
                <div class="app-icon" :style="{ background: app.color }">
                  <svg class="app-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="getIcon(app.iconKey)"></svg>
                  <div v-if="app.badge" class="app-badge">{{ app.badge }}</div>
                </div>
                <span class="app-name">{{ app.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 页面指示器 -->
      <div class="page-dots">
        <div
          v-for="(_, i) in pages"
          :key="i"
          class="dot"
          :class="{ active: currentPage === i }"
          @click="goToPage(i)"
        ></div>
      </div>
    </div>

    <!-- Dock 栏 -->
    <div class="dock">
      <div class="dock-bg"></div>
      <div class="dock-apps">
        <div
          v-for="app in dockApps"
          :key="app.name"
          class="dock-item pressable"
          @click="openApp(app)"
        >
          <div class="app-icon" :style="{ background: app.color }">
            <svg class="app-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="getIcon(app.iconKey)"></svg>
            <div v-if="app.badge" class="app-badge">{{ app.badge }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFeaturesStore } from '@/stores/features'
import { useAuthStore } from '@/stores/auth'
import { appIcons } from '@/utils/appIcons'

const router = useRouter()
const featuresStore = useFeaturesStore()
const authStore = useAuthStore()

interface AppItem {
  name: string
  iconKey: string
  color: string
  route: string
  featureId?: string
  badge?: number
  adminOnly?: boolean
}

function getIcon(key: string): string {
  return appIcons[key] || ''
}

const dateStr = ref('')
const timeStr = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateDateTime() {
  const now = new Date()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  dateStr.value = `${weekDays[now.getDay()]}  ${now.getMonth() + 1}月${now.getDate()}日`
  timeStr.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const allApps: AppItem[] = [
  { name: '聊天', iconKey: 'chat', color: 'linear-gradient(135deg, #5B6EF5, #8B5CF6)', route: '/friends', featureId: 'chat' },
  { name: '微博', iconKey: 'weibo', color: 'linear-gradient(135deg, #E6162D, #FF4757)', route: '/weibo', featureId: 'weibo' },
  { name: '朋友圈', iconKey: 'qzone', color: 'linear-gradient(135deg, #2ED573, #7BED9F)', route: '/qzone', featureId: 'qzone' },
  { name: '外卖', iconKey: 'takeaway', color: 'linear-gradient(135deg, #0AB4FF, #26D0CE)', route: '/takeaway', featureId: 'takeaway' },
  { name: '购物', iconKey: 'shopping', color: 'linear-gradient(135deg, #FF6348, #FF4757)', route: '/shopping', featureId: 'shopping' },
  { name: '音乐', iconKey: 'music', color: 'linear-gradient(135deg, #FC5C7D, #6A82FB)', route: '/listen-together', featureId: 'music' },
  { name: '直播', iconKey: 'live', color: 'linear-gradient(135deg, #A855F7, #EC4899)', route: '/live', featureId: 'live' },
  { name: '日记', iconKey: 'diary', color: 'linear-gradient(135deg, #FECA57, #FF9FF3)', route: '/diary', featureId: 'diary' },
  { name: '游戏', iconKey: 'games', color: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', route: '/games', featureId: 'games' },
  { name: '钱包', iconKey: 'wallet', color: 'linear-gradient(135deg, #00B894, #55EFC4)', route: '/wallet', featureId: 'wallet' },
  { name: '影院', iconKey: 'theater', color: 'linear-gradient(135deg, #2D3436, #636E72)', route: '/mini-theater', featureId: 'mini_theater' },
  { name: '股票', iconKey: 'stock', color: 'linear-gradient(135deg, #00B16A, #1ABC9C)', route: '/stock', featureId: 'stock' },
  { name: '汇率', iconKey: 'currency', color: 'linear-gradient(135deg, #3498DB, #2980B9)', route: '/currency', featureId: 'currency' },
  { name: '情侣', iconKey: 'couple', color: 'linear-gradient(135deg, #FD79A8, #E84393)', route: '/couple-space', featureId: 'couple_space' },
  { name: '知乎', iconKey: 'zhihu', color: 'linear-gradient(135deg, #0066FF, #3399FF)', route: '/zhihu', featureId: 'zhihu' },
  { name: '小红书', iconKey: 'xiaohongshu', color: 'linear-gradient(135deg, #FF2442, #FF6B81)', route: '/xiaohongshu', featureId: 'xiaohongshu' },
  { name: '抖音', iconKey: 'douyin', color: 'linear-gradient(135deg, #25F4EE, #FE2C55)', route: '/douyin', featureId: 'douyin' },
  { name: 'Discord', iconKey: 'discord', color: 'linear-gradient(135deg, #5865F2, #7289DA)', route: '/discord', featureId: 'discord' },
  { name: '邮箱', iconKey: 'email', color: 'linear-gradient(135deg, #4A90D9, #357ABD)', route: '/email', featureId: 'email' },
  { name: '浏览器', iconKey: 'browser', color: 'linear-gradient(135deg, #4285F4, #34A853)', route: '/browser', featureId: 'browser' },
  { name: '地图', iconKey: 'map', color: 'linear-gradient(135deg, #34A853, #FBBC05)', route: '/map', featureId: 'map' },
  { name: '日历', iconKey: 'calendar', color: 'linear-gradient(135deg, #FF6B6B, #EE5A24)', route: '/calendar', featureId: 'calendar' },
  { name: '设置', iconKey: 'settings', color: 'linear-gradient(135deg, #636E72, #B2BEC3)', route: '/customize' },
  { name: '角色', iconKey: 'characters', color: 'linear-gradient(135deg, #00CEC9, #81ECEC)', route: '/characters', featureId: 'characters' },
  { name: '人设', iconKey: 'personas', color: 'linear-gradient(135deg, #E17055, #FAB1A0)', route: '/personas', featureId: 'personas' },
  { name: '世界书', iconKey: 'worldbook', color: 'linear-gradient(135deg, #6C5CE7, #DDA0DD)', route: '/worldbook', featureId: 'worldbook' },
  { name: '预设', iconKey: 'preset', color: 'linear-gradient(135deg, #FDCB6E, #F39C12)', route: '/preset', featureId: 'preset' },
  { name: '管理', iconKey: 'admin', color: 'linear-gradient(135deg, #E74C3C, #C0392B)', route: '/admin/features', adminOnly: true },
]

// Filter apps: hide disabled features + admin-only for non-admins
const apps = computed(() =>
  allApps.filter((app) => {
    if (app.adminOnly && !authStore.isAdmin) return false
    if (app.featureId && !featuresStore.isEnabled(app.featureId)) return false
    return true
  }),
)

// 每页最多显示的 App 数量
const APPS_PER_PAGE = 12

// 将 apps 分页
const pages = computed(() => {
  const result: AppItem[][] = []
  const list = apps.value
  for (let i = 0; i < list.length; i += APPS_PER_PAGE) {
    result.push(list.slice(i, i + APPS_PER_PAGE))
  }
  // 至少保证有一页
  if (result.length === 0) result.push([])
  return result
})

const allDockApps: AppItem[] = [
  { name: '电话', iconKey: 'phone', color: 'linear-gradient(135deg, #2ED573, #7BED9F)', route: '/phone', featureId: 'phone' },
  { name: '短信', iconKey: 'sms', color: 'linear-gradient(135deg, #2ED573, #7BED9F)', route: '/sms', featureId: 'sms' },
  { name: '聊天', iconKey: 'chat', color: 'linear-gradient(135deg, #5B6EF5, #8B5CF6)', route: '/friends', featureId: 'chat' },
  { name: '个人', iconKey: 'profile', color: 'linear-gradient(135deg, #636E72, #B2BEC3)', route: '/profile' },
]

const dockApps = computed(() =>
  allDockApps.filter((app) => {
    if (app.featureId && !featuresStore.isEnabled(app.featureId)) return false
    return true
  }),
)

function openApp(app: AppItem) {
  // 如果正在滑动，不触发点击
  if (hasSwiped.value) return
  router.push(app.route)
}

// ===== 滑动相关 =====
const currentPage = ref(0)
const offsetX = ref(0)
const isSwiping = ref(false)
const isAnimating = ref(false)
const hasSwiped = ref(false)

let startX = 0
let startY = 0
let startTime = 0
let directionLocked: 'horizontal' | 'vertical' | null = null

const swipeTrackStyle = computed(() => {
  const baseOffset = -currentPage.value * 100
  const dragPercent = offsetX.value
  return {
    transform: `translateX(calc(${baseOffset}% + ${dragPercent}px))`,
    transition: isSwiping.value ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  }
})

function goToPage(index: number) {
  if (index >= 0 && index < pages.value.length) {
    currentPage.value = index
    offsetX.value = 0
  }
}

function onTouchStart(e: TouchEvent) {
  if (isAnimating.value) return
  const touch = e.touches[0]
  startX = touch.clientX
  startY = touch.clientY
  startTime = Date.now()
  isSwiping.value = true
  hasSwiped.value = false
  directionLocked = null
  offsetX.value = 0
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value) return
  const touch = e.touches[0]
  const dx = touch.clientX - startX
  const dy = touch.clientY - startY

  // 方向锁定
  if (!directionLocked) {
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      directionLocked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
    }
  }

  if (directionLocked === 'vertical') return

  // 水平滑动
  e.preventDefault()
  hasSwiped.value = Math.abs(dx) > 10

  // 边界阻尼效果
  const isAtStart = currentPage.value === 0 && dx > 0
  const isAtEnd = currentPage.value === pages.value.length - 1 && dx < 0
  if (isAtStart || isAtEnd) {
    offsetX.value = dx * 0.3
  } else {
    offsetX.value = dx
  }
}

function onTouchEnd() {
  if (!isSwiping.value) return
  isSwiping.value = false

  const dx = offsetX.value
  const elapsed = Date.now() - startTime
  const velocity = Math.abs(dx) / elapsed

  // 快速滑动或距离超过阈值
  const threshold = 50
  const shouldSwipe = Math.abs(dx) > threshold || velocity > 0.3

  if (shouldSwipe) {
    if (dx < 0 && currentPage.value < pages.value.length - 1) {
      currentPage.value++
    } else if (dx > 0 && currentPage.value > 0) {
      currentPage.value--
    }
  }

  offsetX.value = 0

  // 短暂标记动画中，防止点击误触
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
    hasSwiped.value = false
  }, 350)
}

// 桌面端鼠标支持
let mouseMoveBound = false

function onMouseDown(e: MouseEvent) {
  if (isAnimating.value) return
  startX = e.clientX
  startY = e.clientY
  startTime = Date.now()
  isSwiping.value = true
  hasSwiped.value = false
  directionLocked = null
  offsetX.value = 0

  if (!mouseMoveBound) {
    mouseMoveBound = true
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
}

function onMouseMove(e: MouseEvent) {
  if (!isSwiping.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (!directionLocked) {
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      directionLocked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
    }
  }

  if (directionLocked === 'vertical') return

  e.preventDefault()
  hasSwiped.value = Math.abs(dx) > 10

  const isAtStart = currentPage.value === 0 && dx > 0
  const isAtEnd = currentPage.value === pages.value.length - 1 && dx < 0
  if (isAtStart || isAtEnd) {
    offsetX.value = dx * 0.3
  } else {
    offsetX.value = dx
  }
}

function onMouseUp() {
  mouseMoveBound = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  onTouchEnd()
}

onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
  featuresStore.fetchFeatures()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (mouseMoveBound) {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
})
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 壁纸 */
.wallpaper {
  position: absolute;
  inset: 0;
  background: var(--wallpaper-gradient, linear-gradient(160deg, #0f0c29 0%, #1a1a3e 25%, #24243e 50%, #302b63 75%, #0f0c29 100%));
  z-index: 0;
}

.wallpaper::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.05) 0%, transparent 70%);
}

.home-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部间距 */
.top-spacer {
  height: 60px;
  flex-shrink: 0;
}

/* 日期时间小组件 */
.datetime-widget {
  text-align: center;
  padding: 8px 20px 20px;
  flex-shrink: 0;
}

.widget-date {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
}

.widget-time {
  font-size: 64px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -2px;
  line-height: 1;
  margin-top: 2px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

/* 滑动容器 */
.swipe-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  touch-action: pan-y;
}

.swipe-track {
  display: flex;
  height: 100%;
  will-change: transform;
}

.swipe-page {
  min-width: 100%;
  flex-shrink: 0;
  padding: 0 20px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
}

/* 页面指示器 */
.page-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 0 8px;
  flex-shrink: 0;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.dot.active {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.2);
}

/* App 网格 */
.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px 12px;
  padding: 8px 0 20px;
  width: 100%;
  align-content: start;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}

.app-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}

.app-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    transparent 50%
  );
  pointer-events: none;
}

.app-svg {
  width: 28px;
  height: 28px;
  color: #fff;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.app-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  background: var(--color-red);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  z-index: 2;
}

.app-name {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  max-width: 68px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dock */
.dock {
  position: relative;
  z-index: 1;
  padding: 12px 24px 28px;
  flex-shrink: 0;
}

.dock-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 32px;
  margin: 0 12px;
}

.dock-apps {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px;
}

.dock-item {
  cursor: pointer;
}

.dock-item .app-icon {
  width: 56px;
  height: 56px;
}
</style>
