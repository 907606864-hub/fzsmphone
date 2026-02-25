<template>
  <div class="friends-page">
    <NavBar title="消息" back-to="/">
      <template #right>
        <button class="icon-btn" @click="showMenu = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </template>
    </NavBar>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索"
        />
      </div>
    </div>

    <!-- Conversation List -->
    <div class="conversation-list" v-if="!showCharacterPicker">
      <div v-if="filteredConversations.length === 0" class="empty-state">
        <div class="empty-emoji">💬</div>
        <div class="empty-title">还没有聊天</div>
        <div class="empty-subtitle">点击右上角 + 开始新对话</div>
      </div>

      <TransitionGroup name="list" tag="div">
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          class="conv-item"
          @click="openConversation(conv)"
        >
          <div class="conv-avatar">
            <img
              v-if="getConvAvatar(conv)"
              :src="getConvAvatar(conv)"
              :alt="conv.title"
            />
            <span v-else class="avatar-placeholder">
              {{ conv.title?.charAt(0) || '🤖' }}
            </span>
            <div v-if="conv.is_group" class="group-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div v-else class="online-dot"></div>
          </div>

          <div class="conv-info">
            <div class="conv-top">
              <span class="conv-name">{{ conv.title || '未命名' }}</span>
              <span class="conv-time">{{ formatTime(conv.last_at) }}</span>
            </div>
            <div class="conv-bottom">
              <span class="conv-preview">{{ conv.last_message || '开始聊天吧~' }}</span>
              <span v-if="conv.unread" class="unread-badge">{{ conv.unread > 99 ? '99+' : conv.unread }}</span>
            </div>
          </div>

          <!-- Delete button -->
          <button class="conv-delete" @click.stop="handleDelete(conv.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Character Picker -->
    <div v-if="showCharacterPicker" class="character-picker">
      <NavBar title="选择角色" @back="showCharacterPicker = false" />
      <div class="picker-list">
        <div v-if="charList.length === 0" class="empty-state">
          <div class="empty-emoji">🎭</div>
          <div class="empty-title">还没有角色</div>
          <div class="empty-subtitle">先去角色管理创建角色吧</div>
          <button class="create-char-btn" @click="$router.push('/characters')">
            创建角色
          </button>
        </div>
        <div
          v-for="char in charList"
          :key="char.id"
          class="char-item"
          @click="startChat(char)"
        >
          <div class="char-avatar">
            <img v-if="char.avatar" :src="char.avatar" :alt="char.name" />
            <span v-else>🤖</span>
          </div>
          <div class="char-info">
            <div class="char-name">{{ char.name }}</div>
            <div class="char-desc">{{ char.description || '暂无描述' }}</div>
          </div>
          <svg class="char-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Create Menu Overlay -->
    <Teleport to="#phone-overlay">
      <Transition name="fade">
        <div v-if="showMenu" class="menu-overlay" @click="showMenu = false">
          <div class="menu-popup" @click.stop>
            <div class="menu-item" @click="handleAddFriend">
              <span class="menu-icon">💬</span>
              <div class="menu-content">
                <div class="menu-title">添加好友</div>
                <div class="menu-desc">与一个AI角色对话</div>
              </div>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item" @click="handleCreateGroup">
              <span class="menu-icon">👥</span>
              <div class="menu-content">
                <div class="menu-title">创建群聊</div>
                <div class="menu-desc">与多个AI角色对话</div>
              </div>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item" @click="$router.push('/characters'); showMenu = false">
              <span class="menu-icon">🎭</span>
              <div class="menu-content">
                <div class="menu-title">角色管理</div>
                <div class="menu-desc">创建和编辑AI角色</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import { useChatStore } from '@/stores/chat'
import type { Conversation } from '@/stores/chat'

interface LocalCharacter {
  id: string
  type: string
  name: string
  avatar?: string
  description?: string
  persona?: string
  scenario?: string
  firstMessage?: string
}

const router = useRouter()
const chatStore = useChatStore()

const searchQuery = ref('')
const showMenu = ref(false)
const showCharacterPicker = ref(false)
const charList = ref<LocalCharacter[]>([])

const filteredConversations = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return chatStore.sortedConversations
  return chatStore.sortedConversations.filter(c => {
    const name = (c.title || '').toLowerCase()
    return name.includes(q)
  })
})

function getConvAvatar(conv: Conversation): string {
  return conv.character?.avatar || (conv.character as any)?.avatar_url || ''
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

function openConversation(conv: Conversation) {
  if (conv.is_group) {
    router.push(`/group/${conv.id}`)
  } else {
    router.push(`/chat/${conv.id}`)
  }
}

function loadCharacters() {
  try {
    const saved = localStorage.getItem('characters')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        charList.value = parsed.filter((c: any) => c.type === 'char')
      }
    }
  } catch {
    // ignore
  }
}

function handleAddFriend() {
  showMenu.value = false
  loadCharacters()
  showCharacterPicker.value = true
}

function handleCreateGroup() {
  showMenu.value = false
  router.push('/characters')
}

function startChat(char: LocalCharacter) {
  showCharacterPicker.value = false
  const conv = chatStore.createConversation(char.id)
  if (conv) {
    router.push(`/chat/${conv.id}`)
  }
}

function handleDelete(id: string) {
  if (confirm('确定要删除这个会话吗？聊天记录也会被删除')) {
    chatStore.deleteConversation(id)
  }
}

onMounted(() => {
  chatStore.fetchConversations()
})
</script>

<style scoped>
.friends-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

/* Search */
.search-bar {
  padding: 6px 16px 10px;
  background: var(--bg-primary);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--fill-tertiary);
  border-radius: 10px;
  padding: 0 10px;
  height: 36px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-quaternary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-quaternary);
}

/* Conversation List */
.conversation-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.conv-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  position: relative;
  border-bottom: 0.5px solid var(--separator);
}

.conv-item:active {
  background: var(--fill-tertiary);
}

.conv-avatar {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: visible;
  flex-shrink: 0;
  position: relative;
}

.conv-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  border-radius: 12px;
  font-size: 22px;
  color: white;
  font-weight: 600;
}

.online-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 14px;
  height: 14px;
  background: var(--ios-green);
  border: 2.5px solid var(--bg-primary);
  border-radius: 50%;
}

.group-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  background: var(--ios-green);
  border: 2px solid var(--bg-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.group-badge svg {
  width: 10px;
  height: 10px;
}

.conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.conv-time {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-left: 8px;
}

.conv-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-preview {
  font-size: 14px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-badge {
  background: var(--ios-red);
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  flex-shrink: 0;
  margin-left: 8px;
}

.conv-delete {
  position: absolute;
  right: -50px;
  top: 0;
  bottom: 0;
  width: 50px;
  background: var(--ios-red);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: right 0.2s var(--ease-ios);
}

.conv-item:hover .conv-delete {
  right: 0;
}

.conv-delete svg {
  width: 18px;
  height: 18px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-emoji {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.empty-subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* Icon Button */
.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--brand-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.icon-btn:active {
  opacity: 0.5;
  transform: scale(0.9);
}

.icon-btn svg {
  width: 22px;
  height: 22px;
}

/* Menu */
.menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.menu-popup {
  position: absolute;
  top: 100px;
  right: 20px;
  background: var(--bg-primary);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  animation: menuDrop 0.2s var(--ease-ios);
}

@keyframes menuDrop {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.menu-item:active {
  background: var(--fill-tertiary);
}

.menu-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.menu-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.menu-divider {
  height: 0.5px;
  background: var(--separator);
  margin: 0 16px;
}

/* Character Picker */
.character-picker {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-secondary);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.char-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 0.5px solid var(--separator);
}

.char-item:first-child {
  border-radius: 12px 12px 0 0;
}

.char-item:last-child {
  border-radius: 0 0 12px 12px;
  border-bottom: none;
}

.char-item:only-child {
  border-radius: 12px;
}

.char-item:active {
  background: var(--fill-tertiary);
}

.char-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.char-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.char-info {
  flex: 1;
  min-width: 0;
}

.char-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.char-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.char-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-quaternary);
  flex-shrink: 0;
}

.create-char-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.create-char-btn:active {
  opacity: 0.8;
}

/* List transition */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s var(--ease-ios);
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
