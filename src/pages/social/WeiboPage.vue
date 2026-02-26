<template>
  <div class="weibo-page">
    <!-- 顶部导航 -->
    <div class="weibo-header">
      <button class="header-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="header-title">微博</span>
      <div class="header-right">
        <button class="header-btn" @click="showPromptEditor = true">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <button class="header-btn" @click="handleGenerate" :disabled="store.generating">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: store.generating }">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 底部Tab栏 -->
    <div class="bottom-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="bottom-tab"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        <span class="tab-icon">{{ t.icon }}</span>
        <span class="tab-label">{{ t.label }}</span>
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="weibo-body">

      <!-- ===== 首页/信息流 ===== -->
      <div v-if="activeTab === 'home'" class="tab-content">
        <!-- 全局错误提示（内联显示） -->
        <div v-if="store.lastError" class="error-banner" @click="store.lastError = ''">
          ⚠️ {{ store.lastError }}
          <span class="error-dismiss">点击关闭</span>
        </div>

        <!-- 加载中 -->
        <div v-if="store.generating && store.weiboPosts.length === 0" class="loading-state">
          <div class="loading-spinner"></div>
          <span>AI正在生成微博内容...</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="store.weiboPosts.length === 0" class="empty-state">
          <div class="empty-icon">📱</div>
          <div class="empty-title">暂无微博</div>
          <div class="empty-sub">点击右上角刷新按钮生成AI内容</div>
          <button class="generate-btn" @click="handleGenerate" :disabled="store.generating">
            ✨ 生成微博内容
          </button>
        </div>

        <!-- 微博列表 -->
        <div v-else class="feed-list">
          <div v-for="post in store.weiboPosts" :key="post.id" class="weibo-card">
            <!-- 用户头部 -->
            <div class="wb-user-row">
              <div class="wb-avatar" :style="{ background: getAvatarColor(post.author) }">
                {{ post.author.charAt(0) }}
              </div>
              <div class="wb-user-info">
                <span class="wb-username">{{ post.author }}</span>
                <span class="wb-time">{{ formatRelativeTime(post.timestamp) }}</span>
              </div>
              <button class="wb-delete" @click="store.deleteWeiboPost(post.id)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- 内容 -->
            <div class="wb-text" v-html="formatContent(post.content)"></div>

            <!-- 操作栏 -->
            <div class="wb-action-bar">
              <button class="wb-act-btn" @click="toggleRepost(post)">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                <span>{{ post.reposts || '' }}</span>
              </button>
              <button class="wb-act-btn" @click="toggleComments(post)">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{{ post.comments.length || '' }}</span>
              </button>
              <button class="wb-act-btn" :class="{ liked: post.isLiked }" @click="store.toggleWeiboLike(post.id)">
                <svg viewBox="0 0 24 24" width="17" height="17" :fill="post.isLiked ? '#ff6b81' : 'none'" :stroke="post.isLiked ? '#ff6b81' : 'currentColor'" stroke-width="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{{ post.likes || '' }}</span>
              </button>
            </div>

            <!-- 评论区（展开） -->
            <div v-if="post.showComments" class="wb-comments-section">
              <div v-if="post.comments.length === 0" class="no-comments">暂无评论</div>
              <div v-for="c in post.comments" :key="c.id" class="wb-comment-item">
                <span class="comment-author" :style="{ color: getAvatarColor(c.author) }">{{ c.author }}</span>
                <span class="comment-sep">：</span>
                <span class="comment-text">{{ c.content }}</span>
                <div class="comment-bottom">
                  <span class="comment-time">{{ formatRelativeTime(c.timestamp) }}</span>
                  <button class="comment-like-btn" :class="{ liked: c.isLiked }" @click="store.toggleWeiboCommentLike(post.id, c.id)">
                    ♥ {{ c.likes || '' }}
                  </button>
                </div>
              </div>
              <!-- 评论输入 -->
              <div class="wb-comment-input-row">
                <input
                  v-model="commentDrafts[post.id]"
                  type="text"
                  placeholder="写评论..."
                  class="wb-comment-input"
                  @keyup.enter="submitComment(post)"
                />
                <button class="wb-comment-send" :disabled="!commentDrafts[post.id]?.trim()" @click="submitComment(post)">
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 热搜 ===== -->
      <div v-if="activeTab === 'hot'" class="tab-content">
        <div v-if="store.weiboHotSearches.length === 0" class="empty-state">
          <div class="empty-icon">🔥</div>
          <div class="empty-title">暂无热搜</div>
          <div class="empty-sub">生成微博内容后会自动包含热搜</div>
        </div>
        <div v-else class="hot-search-list">
          <div class="hot-search-header">
            <span class="hot-title">微博热搜</span>
            <span class="hot-update">刚刚更新</span>
          </div>
          <div
            v-for="item in store.weiboHotSearches"
            :key="item.rank"
            class="hot-item"
          >
            <div class="hot-rank" :class="{ top3: item.rank <= 3 }">{{ item.rank }}</div>
            <div class="hot-info">
              <span class="hot-name">{{ item.title }}</span>
              <span class="hot-heat">{{ item.heat }}</span>
            </div>
            <div v-if="item.rank <= 3" class="hot-fire">🔥</div>
          </div>
        </div>
      </div>

      <!-- ===== 榜单 ===== -->
      <div v-if="activeTab === 'rank'" class="tab-content">
        <div v-if="store.weiboRankings.length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-title">暂无榜单</div>
          <div class="empty-sub">生成微博内容后会自动包含榜单</div>
        </div>
        <div v-else class="ranking-list">
          <div class="ranking-header">实时榜单</div>
          <div
            v-for="(item, idx) in store.weiboRankings"
            :key="idx"
            class="ranking-item"
          >
            <div class="ranking-idx" :class="{ top3: idx < 3 }">{{ idx + 1 }}</div>
            <div class="ranking-info">
              <span class="ranking-name">{{ item.name }}</span>
              <span class="ranking-type">{{ item.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 我的 ===== -->
      <div v-if="activeTab === 'me'" class="tab-content">
        <div class="profile-card">
          <div class="profile-avatar" :style="{ background: getAvatarColor(userName) }">
            {{ userName.charAt(0) }}
          </div>
          <div class="profile-name">{{ userName }}</div>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-num">{{ myPostsCount }}</span>
              <span class="stat-label">微博</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ totalLikes }}</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
        </div>
        <div v-if="myPosts.length === 0" class="empty-state small">
          <div class="empty-sub">还没有发过微博</div>
        </div>
        <div v-else class="feed-list">
          <div v-for="post in myPosts" :key="post.id" class="weibo-card compact">
            <div class="wb-text" v-html="formatContent(post.content)"></div>
            <div class="wb-time-small">{{ formatRelativeTime(post.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发微博按钮 (FAB) -->
    <button class="fab-compose" @click="showCompose = true">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>

    <!-- 发微博弹窗 -->
    <Teleport to="#phone-overlay">
      <Transition name="slide-up">
        <div v-if="showCompose" class="compose-overlay" @click.self="showCompose = false">
          <div class="compose-sheet">
            <div class="sheet-bar">
              <button class="sheet-cancel" @click="showCompose = false">取消</button>
              <span class="sheet-title">发微博</span>
              <button class="sheet-post" :disabled="!composeText.trim() || store.generating" @click="submitWeibo">
                {{ store.generating ? '发布中...' : '发布' }}
              </button>
            </div>
            <textarea
              v-model="composeText"
              class="sheet-textarea"
              placeholder="分享新鲜事..."
              autofocus
            ></textarea>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 提示词编辑器 -->
    <Teleport to="#phone-overlay">
      <Transition name="slide-up">
        <div v-if="showPromptEditor" class="compose-overlay" @click.self="showPromptEditor = false">
          <div class="compose-sheet prompt-sheet">
            <div class="sheet-bar">
              <button class="sheet-cancel" @click="showPromptEditor = false">关闭</button>
              <span class="sheet-title">微博提示词</span>
              <button class="sheet-post" @click="savePrompt">保存</button>
            </div>
            <textarea
              v-model="promptText"
              class="sheet-textarea prompt-textarea"
              placeholder="输入微博生成提示词..."
            ></textarea>
            <div class="prompt-actions">
              <button class="prompt-action-btn" @click="resetPrompt">重置默认</button>
              <button class="prompt-action-btn danger" @click="clearAllData">清空数据</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useSocialAIStore } from '@/stores/socialAI'
import {
  getAvatarColor,
  formatContent,
  formatRelativeTime,
} from '@/utils/socialParsers'
import type { WeiboItem } from '@/utils/socialParsers'
import { getPromptTemplate, setPromptTemplate, resetPromptTemplate } from '@/utils/socialPrompts'

const store = useSocialAIStore()

const activeTab = ref<'home' | 'hot' | 'rank' | 'me'>('home')
const tabs = [
  { key: 'home' as const, icon: '🏠', label: '首页' },
  { key: 'hot' as const, icon: '🔥', label: '热搜' },
  { key: 'rank' as const, icon: '📊', label: '榜单' },
  { key: 'me' as const, icon: '👤', label: '我的' },
]

const showCompose = ref(false)
const composeText = ref('')
const showPromptEditor = ref(false)
const promptText = ref('')
const commentDrafts = reactive<Record<string, string>>({})

const userName = computed(() => {
  try {
    const currentId = localStorage.getItem('currentPersonaId')
    if (currentId) {
      const charsStr = localStorage.getItem('characters')
      if (charsStr) {
        const chars = JSON.parse(charsStr)
        const user = chars.find((c: any) => c.id === currentId && c.type === 'user')
        if (user?.name) return user.name
      }
    }
  } catch { /* ignore */ }
  return '我'
})

const myPosts = computed(() => store.weiboPosts.filter(p => p.author === userName.value))
const myPostsCount = computed(() => myPosts.value.length)
const totalLikes = computed(() => store.weiboPosts.reduce((sum, p) => sum + p.likes, 0))

onMounted(() => {
  store.loadData('weibo')
  promptText.value = getPromptTemplate('weibo')
})

async function handleGenerate() {
  await store.generateWeiboContent()
}

function toggleComments(post: WeiboItem) {
  post.showComments = !post.showComments
}

function toggleRepost(post: WeiboItem) {
  post.reposts = (post.reposts || 0) + 1
  store.saveData('weibo')
}

async function submitComment(post: WeiboItem) {
  const text = commentDrafts[post.id]?.trim()
  if (!text) return
  commentDrafts[post.id] = ''
  await store.weiboReply(post.id, text)
}

async function submitWeibo() {
  const text = composeText.value.trim()
  if (!text) return
  composeText.value = ''
  showCompose.value = false
  await store.weiboPost(text)
}

function savePrompt() {
  setPromptTemplate('weibo', promptText.value)
  showPromptEditor.value = false
}

function resetPrompt() {
  resetPromptTemplate('weibo')
  promptText.value = getPromptTemplate('weibo')
}

function clearAllData() {
  if (confirm('确定要清空所有微博数据吗？')) {
    store.clearData('weibo')
    showPromptEditor.value = false
  }
}
</script>

<style scoped>
.weibo-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f7f7;
  position: relative;
}

/* ===== 顶部导航 ===== */
.weibo-header {
  --status-bar-height: 54px;
  height: calc(var(--status-bar-height) + 44px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--status-bar-height) 14px 0;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.header-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.header-btn:active {
  background: #f5f5f5;
}

.header-btn:disabled {
  opacity: 0.4;
}

.header-right {
  display: flex;
  gap: 4px;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 底部Tab栏 ===== */
.bottom-tabs {
  display: flex;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  order: 2;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.bottom-tab.active {
  color: #ff6b00;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
}

/* ===== 主内容区 ===== */
.weibo-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
  -webkit-overflow-scrolling: touch;
}

.weibo-body::-webkit-scrollbar {
  display: none;
}

.tab-content {
  min-height: 100%;
}

/* ===== 加载/空状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
  color: #999;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #ff6b00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  gap: 8px;
}

.empty-state.small {
  padding: 30px 20px;
}

.empty-icon {
  font-size: 44px;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #666;
}

.empty-sub {
  font-size: 13px;
  color: #aaa;
}

.generate-btn {
  margin-top: 16px;
  padding: 10px 28px;
  background: linear-gradient(135deg, #ff6b00, #ff9a44);
  color: #fff;
  border: none;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.generate-btn:disabled {
  opacity: 0.5;
}

/* ===== 微博卡片 ===== */
.feed-list {
  padding: 0;
}

.weibo-card {
  background: #fff;
  padding: 14px 16px;
  border-bottom: 8px solid #f7f7f7;
}

.weibo-card.compact {
  border-bottom: 1px solid #f0f0f0;
}

.wb-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.wb-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.wb-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.wb-username {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.wb-time {
  font-size: 12px;
  color: #bbb;
}

.wb-delete {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: #ccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.wb-delete:active {
  background: #f5f5f5;
  color: #999;
}

.wb-text {
  font-size: 15px;
  color: #333;
  line-height: 1.7;
  word-break: break-word;
  margin-bottom: 10px;
}

.wb-text :deep(.mention) {
  color: #ff6b00;
  font-weight: 500;
}

.wb-text :deep(.topic-tag) {
  color: #ff6b00;
  font-weight: 500;
}

.wb-time-small {
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
}

/* ===== 操作栏 ===== */
.wb-action-bar {
  display: flex;
  justify-content: space-around;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.wb-act-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 16px;
  transition: all 0.15s;
}

.wb-act-btn:active {
  background: #f5f5f5;
}

.wb-act-btn.liked {
  color: #ff6b81;
}

/* ===== 评论区 ===== */
.wb-comments-section {
  background: #fafafa;
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 10px;
}

.no-comments {
  text-align: center;
  font-size: 13px;
  color: #ccc;
  padding: 8px 0;
}

.wb-comment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  line-height: 1.6;
}

.wb-comment-item:last-of-type {
  border-bottom: none;
}

.comment-author {
  font-weight: 600;
  font-size: 13px;
}

.comment-sep {
  color: #999;
}

.comment-text {
  color: #333;
}

.comment-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.comment-time {
  font-size: 11px;
  color: #ccc;
}

.comment-like-btn {
  border: none;
  background: none;
  font-size: 12px;
  color: #ccc;
  cursor: pointer;
}

.comment-like-btn.liked {
  color: #ff6b81;
}

.wb-comment-input-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.wb-comment-input {
  flex: 1;
  padding: 8px 14px;
  border: 1px solid #eee;
  border-radius: 20px;
  background: #fff;
  color: #333;
  font-size: 13px;
  outline: none;
}

.wb-comment-input:focus {
  border-color: #ff6b00;
}

.wb-comment-input::placeholder {
  color: #ccc;
}

.wb-comment-send {
  padding: 6px 14px;
  background: #ff6b00;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.wb-comment-send:disabled {
  opacity: 0.4;
}

/* ===== 热搜 ===== */
.hot-search-list {
  background: #fff;
  border-radius: 12px;
  margin: 12px;
  overflow: hidden;
}

.hot-search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.hot-title {
  font-size: 17px;
  font-weight: 700;
  color: #333;
}

.hot-update {
  font-size: 12px;
  color: #bbb;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #fafafa;
  cursor: pointer;
  transition: background 0.15s;
}

.hot-item:active {
  background: #fafafa;
}

.hot-item:last-child {
  border-bottom: none;
}

.hot-rank {
  width: 24px;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #bbb;
}

.hot-rank.top3 {
  color: #ff6b00;
}

.hot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hot-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-heat {
  font-size: 12px;
  color: #bbb;
}

.hot-fire {
  font-size: 16px;
}

/* ===== 榜单 ===== */
.ranking-list {
  background: #fff;
  border-radius: 12px;
  margin: 12px;
  overflow: hidden;
}

.ranking-header {
  padding: 14px 16px;
  font-size: 17px;
  font-weight: 700;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #fafafa;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-idx {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #999;
}

.ranking-idx.top3 {
  background: linear-gradient(135deg, #ff6b00, #ff9a44);
  color: #fff;
}

.ranking-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ranking-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.ranking-type {
  font-size: 12px;
  color: #bbb;
}

/* ===== 我的 ===== */
.profile-card {
  background: linear-gradient(135deg, #ff6b00, #ff9a44);
  margin: 12px;
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  border: 3px solid rgba(255, 255, 255, 0.4);
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.profile-stats {
  display: flex;
  gap: 40px;
  margin-top: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* ===== FAB ===== */
.fab-compose {
  position: absolute;
  bottom: 70px;
  right: 16px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b00, #ff9a44);
  border: none;
  box-shadow: 0 4px 16px rgba(255, 107, 0, 0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: transform 0.2s;
}

.fab-compose:active {
  transform: scale(0.9);
}

/* ===== 弹窗 ===== */
.compose-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.compose-sheet {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
}

.prompt-sheet {
  max-height: 80%;
  display: flex;
  flex-direction: column;
}

.sheet-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.sheet-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.sheet-cancel {
  border: none;
  background: none;
  color: #999;
  font-size: 15px;
  cursor: pointer;
}

.sheet-post {
  border: none;
  background: none;
  color: #ff6b00;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.sheet-post:disabled {
  color: #ccc;
}

.sheet-textarea {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: none;
  background: none;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  outline: none;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
}

.sheet-textarea::placeholder {
  color: #ccc;
}

.prompt-textarea {
  min-height: 200px;
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
}

.prompt-actions {
  display: flex;
  gap: 10px;
  padding: 10px 16px 16px;
}

.prompt-action-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #eee;
  background: #fafafa;
  border-radius: 10px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  text-align: center;
}

.prompt-action-btn.danger {
  color: #ff4444;
  border-color: #ffe0e0;
  background: #fff5f5;
}

/* ===== 动画 ===== */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0.8;
}

/* ===== 错误提示 ===== */
.error-banner {
  background: #fff3cd;
  color: #856404;
  padding: 12px 16px;
  margin: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-dismiss {
  font-size: 11px;
  color: #a07a1a;
  opacity: 0.7;
}
</style>
