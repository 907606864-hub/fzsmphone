<template>
  <div class="profile-page">
    <NavBar title="个人中心" :show-back="true" back-to="/">
      <template #right>
        <button class="nav-btn" @click="router.push('/customize')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </template>
    </NavBar>

    <div class="profile-content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="avatar-section">
          <div class="avatar">
            <img v-if="user?.avatar" :src="user.avatar" alt="avatar" />
            <span v-else class="avatar-placeholder">{{ user?.username?.[0] || '?' }}</span>
          </div>
          <div class="online-dot"></div>
        </div>
        <div class="user-info">
          <h2 class="display-name">{{ user?.username || '未登录' }}</h2>
          <p class="user-id">ID: {{ user?.id || '—' }}</p>
          <p class="user-bio">{{ bio || '这个人很懒，什么都没写~' }}</p>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="stats-row">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <!-- 功能菜单 -->
      <div class="menu-section">
        <div class="menu-group">
          <div class="menu-item" v-for="item in menuItems" :key="item.label" @click="handleMenuItem(item)">
            <div class="menu-icon" :style="{ background: item.color }">
              <span>{{ item.icon }}</span>
            </div>
            <span class="menu-label">{{ item.label }}</span>
            <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 管理员面板入口 -->
      <div class="menu-section" v-if="authStore.isAdmin">
        <div class="section-title">管理</div>
        <div class="menu-group">
          <div class="menu-item" v-for="item in adminItems" :key="item.label" @click="handleMenuItem(item)">
            <div class="menu-icon" :style="{ background: item.color }">
              <span>{{ item.icon }}</span>
            </div>
            <span class="menu-label">{{ item.label }}</span>
            <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 快捷设置 -->
      <div class="menu-section">
        <div class="section-title">快捷设置</div>
        <div class="menu-group">
          <div class="setting-item">
            <div class="setting-left">
              <span class="setting-icon">🌙</span>
              <span>深色模式</span>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settingsStore.settings.darkMode" @change="toggleDarkMode" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-left">
              <span class="setting-icon">🔔</span>
              <span>通知提醒</span>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settingsStore.settings.notifyEnabled" @change="settingsStore.settings.notifyEnabled = !settingsStore.settings.notifyEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-left">
              <span class="setting-icon">🔊</span>
              <span>消息音效</span>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settingsStore.settings.notificationSoundEnabled" @change="settingsStore.settings.notificationSoundEnabled = !settingsStore.settings.notificationSoundEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item" @click="router.push('/customize')">
            <div class="setting-left">
              <span class="setting-icon">⚙️</span>
              <span>全部设置</span>
            </div>
            <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <button class="logout-btn" @click="handleLogout">退出登录</button>

      <div class="version-info">贩子死妈小手机 v1.0.0</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePhoneStore } from '@/stores/phone'
import { useSettingsStore } from '@/stores/settings'
import NavBar from '@/components/common/NavBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const phoneStore = usePhoneStore()
const settingsStore = useSettingsStore()

const bio = ref('')

const user = computed(() => authStore.user)

interface StatItem {
  label: string
  value: string | number
}

const stats = ref<StatItem[]>([
  { label: '对话', value: 0 },
  { label: '帖子', value: 0 },
  { label: '日记', value: 0 },
  { label: '天数', value: 0 },
])

interface MenuItem {
  icon: string
  label: string
  color: string
  route?: string
  action?: string
}

const menuItems: MenuItem[] = [
  { icon: '👤', label: '编辑资料', color: 'linear-gradient(135deg, #5B6EF5, #8B5CF6)', action: 'editProfile' },
  { icon: '🎭', label: '我的人设', color: 'linear-gradient(135deg, #E17055, #FAB1A0)', route: '/personas' },
  { icon: '👥', label: '角色管理', color: 'linear-gradient(135deg, #00CEC9, #81ECEC)', route: '/characters' },
  { icon: '📚', label: '世界书', color: 'linear-gradient(135deg, #6C5CE7, #DDA0DD)', route: '/worldbook' },
  { icon: '⚡', label: '预设管理', color: 'linear-gradient(135deg, #FDCB6E, #F39C12)', route: '/preset' },
  { icon: '🎨', label: '主题定制', color: 'linear-gradient(135deg, #636E72, #B2BEC3)', route: '/customize' },
  { icon: '💰', label: '我的钱包', color: 'linear-gradient(135deg, #00B894, #55EFC4)', route: '/wallet' },
]

const adminItems: MenuItem[] = [
  { icon: '🛡️', label: '用户管理', color: 'linear-gradient(135deg, #E6162D, #FF4757)', action: 'manageUsers' },
  { icon: '📊', label: '数据统计', color: 'linear-gradient(135deg, #3498DB, #2980B9)', action: 'viewStats' },
  { icon: '🔧', label: '系统设置', color: 'linear-gradient(135deg, #636E72, #95A5A6)', action: 'systemSettings' },
]

function handleMenuItem(item: MenuItem) {
  if (item.route) {
    router.push(item.route)
  } else if (item.action) {
    // Handle actions
    console.log('Action:', item.action)
  }
}

function toggleDarkMode() {
  settingsStore.settings.darkMode = !settingsStore.settings.darkMode
  phoneStore.toggleTheme()
}

async function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // Sync dark mode state
  if (settingsStore.settings.darkMode !== (phoneStore.theme === 'dark')) {
    document.documentElement.setAttribute('data-theme', settingsStore.settings.darkMode ? 'dark' : 'light')
  }

  // Calculate days since first use
  const firstUse = localStorage.getItem('first_use')
  if (!firstUse) {
    localStorage.setItem('first_use', new Date().toISOString())
    stats.value[3].value = 1
  } else {
    const days = Math.ceil((Date.now() - new Date(firstUse).getTime()) / 86400000)
    stats.value[3].value = days
  }
})
</script>

<style scoped>
.profile-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.profile-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.profile-content::-webkit-scrollbar {
  display: none;
}

/* 用户卡片 */
.user-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #5B6EF5, #8B5CF6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: var(--color-green);
  border-radius: 50%;
  border: 3px solid var(--bg-primary);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.display-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.user-id {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 2px 0 6px;
}

.user-bio {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 统计行 */
.stats-row {
  display: flex;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 菜单 */
.menu-section {
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

.menu-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
  font-size: 16px;
  color: var(--text-primary);
}

.menu-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-quaternary);
  flex-shrink: 0;
}

/* 退出按钮 */
.logout-btn {
  width: 100%;
  padding: 14px;
  background: var(--bg-primary);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--color-red);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 16px;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.logout-btn:active {
  background: var(--bg-tertiary);
}

.version-info {
  text-align: center;
  font-size: 12px;
  color: var(--text-quaternary);
  padding-bottom: 20px;
}

/* 快捷设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.setting-item:not(:last-child) {
  border-bottom: 0.5px solid var(--separator);
}

.setting-item:active {
  background: var(--bg-tertiary);
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-icon {
  font-size: 18px;
}

.setting-item span {
  font-size: 16px;
  color: var(--text-primary);
}

/* Toggle switch */
.toggle {
  position: relative;
  width: 51px;
  height: 31px;
  cursor: pointer;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--bg-quaternary);
  border-radius: 31px;
  transition: background 0.3s;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 27px;
  height: 27px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  background: var(--color-green);
}

.toggle input:checked + .toggle-slider::after {
  transform: translateX(20px);
}
</style>
