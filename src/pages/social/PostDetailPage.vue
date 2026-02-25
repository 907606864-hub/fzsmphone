<template>
  <div class="post-detail-page">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <button class="header-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="header-title">帖子详情</span>
      <button class="header-btn" @click="handleRefresh" :disabled="store.generating">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: store.generating }">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 帖子不存在 -->
    <div v-else-if="!thread" class="empty-state">
      <div class="empty-icon">😕</div>
      <div class="empty-text">帖子不存在或已被删除</div>
      <button class="back-button" @click="$router.back()">返回论坛</button>
    </div>

    <!-- 帖子内容 -->
    <div v-else class="detail-content">
      <!-- 主楼 (1楼) -->
      <div class="main-post-card">
        <div class="floor-header">
          <div class="floor-badge main-floor">1楼</div>
          <span class="floor-label">楼主</span>
        </div>
        <div class="post-user-row">
          <div class="user-avatar" :style="{ background: getAvatarColor(thread.author) }">
            {{ thread.author.charAt(0) }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ thread.author }}</span>
            <span class="post-time">{{ formatRelativeTime(thread.timestamp) }}</span>
          </div>
          <button class="like-btn" :class="{ liked: thread.isLiked }" @click="toggleMainLike">
            <svg viewBox="0 0 24 24" width="18" height="18" :fill="thread.isLiked ? '#e8a0bf' : 'none'" :stroke="thread.isLiked ? '#e8a0bf' : 'currentColor'" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{{ thread.likes }}</span>
          </button>
        </div>
        <h2 class="post-title">{{ thread.title }}</h2>
        <div class="post-body" v-html="formatContent(thread.content)"></div>
      </div>

      <!-- 回复区标题 -->
      <div class="replies-header">
        <span class="replies-title">全部回复 ({{ thread.replies.length }})</span>
      </div>

      <!-- 无回复 -->
      <div v-if="thread.replies.length === 0" class="no-replies">
        <div class="no-replies-icon">💬</div>
        <div class="no-replies-text">暂无回复，来抢沙发吧~</div>
      </div>

      <!-- 回复列表 -->
      <div v-else class="replies-list">
        <div
          v-for="reply in thread.replies"
          :key="reply.id"
          class="reply-card"
        >
          <!-- 楼层头部 -->
          <div class="floor-header">
            <div class="floor-badge">{{ reply.floor }}楼</div>
          </div>
          <!-- 用户信息 -->
          <div class="reply-user-row">
            <div class="user-avatar small" :style="{ background: getAvatarColor(reply.author) }">
              {{ reply.author.charAt(0) }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ reply.author }}</span>
              <span class="reply-time">{{ formatRelativeTime(reply.timestamp) }}</span>
            </div>
            <button class="like-btn small" :class="{ liked: reply.isLiked }" @click="toggleReplyLike(reply.id)">
              <svg viewBox="0 0 24 24" width="15" height="15" :fill="reply.isLiked ? '#e8a0bf' : 'none'" :stroke="reply.isLiked ? '#e8a0bf' : 'currentColor'" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{{ reply.likes }}</span>
            </button>
          </div>
          <!-- 回复内容 -->
          <div class="reply-content" v-html="formatContent(reply.content)"></div>

          <!-- 楼中楼 (子回复) -->
          <div v-if="reply.subReplies && reply.subReplies.length > 0" class="sub-replies-container">
            <div
              v-for="sub in reply.subReplies"
              :key="sub.id"
              class="sub-reply-item"
            >
              <div class="sub-reply-header">
                <span class="sub-reply-author" :style="{ color: getAvatarColor(sub.author) }">{{ sub.author }}</span>
                <span class="sub-reply-arrow">»</span>
                <span class="sub-reply-parent">{{ reply.author }}</span>
                <span class="sub-reply-time">{{ formatRelativeTime(sub.timestamp) }}</span>
              </div>
              <div class="sub-reply-text" v-html="formatContent(sub.content)"></div>
            </div>
          </div>

          <!-- 回复按钮 -->
          <div class="reply-actions">
            <button class="reply-action-btn" @click="openReplyInput(reply)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              回复
            </button>
          </div>
        </div>
      </div>

      <!-- 底部占位，避免被输入栏遮挡 -->
      <div class="bottom-spacer"></div>
    </div>

    <!-- 底部回复输入栏 -->
    <div v-if="thread" class="bottom-reply-bar">
      <div v-if="replyTarget" class="reply-target-hint">
        <span>回复 {{ replyTarget.author }} ({{ replyTarget.floor }}楼)</span>
        <button class="cancel-target" @click="replyTarget = null">✕</button>
      </div>
      <div class="reply-input-row">
        <input
          ref="replyInputRef"
          v-model="replyText"
          type="text"
          :placeholder="replyTarget ? `回复 ${replyTarget.author}...` : '写回复...'"
          class="reply-input"
          @keyup.enter="submitReply"
        />
        <button
          class="reply-send-btn"
          :disabled="!replyText.trim() || store.generating"
          @click="submitReply"
        >
          {{ store.generating ? '...' : '发送' }}
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <Transition name="toast">
      <div v-if="errorMsg" class="error-toast">
        {{ errorMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSocialAIStore } from '@/stores/socialAI'
import {
  getAvatarColor,
  formatContent,
  formatRelativeTime,
} from '@/utils/socialParsers'
import type { ForumReply } from '@/utils/socialParsers'

const route = useRoute()
const store = useSocialAIStore()

const threadId = computed(() => String(route.params.postId || ''))
const thread = computed(() => store.getForumThread(threadId.value))
const loading = ref(true)
const replyText = ref('')
const replyTarget = ref<ForumReply | null>(null)
const replyInputRef = ref<HTMLInputElement | null>(null)
const errorMsg = ref('')

onMounted(() => {
  store.loadData('forum')
  loading.value = false
})

function toggleMainLike() {
  store.toggleForumLike(threadId.value)
}

function toggleReplyLike(replyId: string) {
  store.toggleReplyLike(threadId.value, replyId)
}

function openReplyInput(reply: ForumReply) {
  replyTarget.value = reply
  nextTick(() => {
    replyInputRef.value?.focus()
  })
}

async function submitReply() {
  const text = replyText.value.trim()
  if (!text) return

  replyText.value = ''
  const target = replyTarget.value
  replyTarget.value = null

  try {
    if (target) {
      // 楼中楼回复
      await store.forumReply(threadId.value, `回复${target.author}(${target.floor}楼)：${text}`)
    } else {
      await store.forumReply(threadId.value, text)
    }
  } catch (e: any) {
    errorMsg.value = e.message || '发送失败'
    setTimeout(() => { errorMsg.value = '' }, 3000)
  }
}

async function handleRefresh() {
  if (!thread.value) return
  try {
    const action = `请为帖子"${thread.value.title}"（作者：${thread.value.author}）生成更多回复和互动。当前已有${thread.value.replies.length}条回复。请生成新的回复内容，包括楼中楼讨论。`
    await store.generateForumContent(action)
  } catch (e: any) {
    errorMsg.value = e.message || '刷新失败'
    setTimeout(() => { errorMsg.value = '' }, 3000)
  }
}
</script>

<style scoped>
.post-detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #faf8f5;
  position: relative;
}

/* ===== 顶部导航 ===== */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fcfaf7;
  border-bottom: 1px solid #f0ece6;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: #8b7e74;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.header-btn:active {
  background: #f0ece6;
}

.header-btn:disabled {
  opacity: 0.4;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #5a4a3f;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 加载/空状态 ===== */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #b0a49a;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0ece6;
  border-top-color: #e8a0bf;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 15px;
  color: #b0a49a;
}

.back-button {
  margin-top: 8px;
  padding: 8px 24px;
  background: #e8a0bf;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

/* ===== 内容区 ===== */
.detail-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.detail-content::-webkit-scrollbar {
  display: none;
}

/* ===== 主楼 ===== */
.main-post-card {
  background: #fcfaf7;
  margin: 12px;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(139, 126, 116, 0.08);
}

.floor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.floor-badge {
  padding: 2px 10px;
  background: #f5f0ea;
  color: #8b7e74;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.floor-badge.main-floor {
  background: linear-gradient(135deg, #e8a0bf, #e1c195);
  color: #fff;
}

.floor-label {
  font-size: 11px;
  color: #e8a0bf;
  background: rgba(232, 160, 191, 0.12);
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.post-user-row,
.reply-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.user-avatar {
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

.user-avatar.small {
  width: 34px;
  height: 34px;
  font-size: 14px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #5a4a3f;
}

.post-time,
.reply-time {
  font-size: 11px;
  color: #b0a49a;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #b0a49a;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 16px;
  transition: all 0.2s;
}

.like-btn:active {
  transform: scale(0.9);
}

.like-btn.liked {
  color: #e8a0bf;
}

.like-btn.small {
  font-size: 12px;
  padding: 4px 8px;
}

.post-title {
  font-size: 18px;
  font-weight: 700;
  color: #4a3a2f;
  margin: 0 0 10px;
  line-height: 1.4;
}

.post-body {
  font-size: 15px;
  color: #5a4a3f;
  line-height: 1.8;
  word-break: break-word;
}

.post-body :deep(.mention) {
  color: #6ba1e1;
  font-weight: 500;
}

.post-body :deep(.topic-tag) {
  color: #e8a0bf;
  font-weight: 500;
}

/* ===== 回复区 ===== */
.replies-header {
  padding: 14px 16px 8px;
}

.replies-title {
  font-size: 15px;
  font-weight: 700;
  color: #5a4a3f;
}

.no-replies {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  color: #b0a49a;
}

.no-replies-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.no-replies-text {
  font-size: 14px;
}

.replies-list {
  padding: 0 12px;
}

.reply-card {
  background: #fcfaf7;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 8px rgba(139, 126, 116, 0.06);
}

.reply-content {
  font-size: 14px;
  color: #5a4a3f;
  line-height: 1.7;
  word-break: break-word;
  margin-bottom: 8px;
}

.reply-content :deep(.mention) {
  color: #6ba1e1;
  font-weight: 500;
}

.reply-content :deep(.topic-tag) {
  color: #e8a0bf;
  font-weight: 500;
}

/* ===== 楼中楼 ===== */
.sub-replies-container {
  background: #f7f3ee;
  border-left: 3px solid #d4c8b8;
  border-radius: 0 10px 10px 0;
  padding: 10px 12px;
  margin: 6px 0 8px;
}

.sub-reply-item {
  padding: 6px 0;
}

.sub-reply-item + .sub-reply-item {
  border-top: 1px solid #ede8e0;
}

.sub-reply-header {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.sub-reply-author {
  font-size: 13px;
  font-weight: 600;
}

.sub-reply-arrow {
  font-size: 12px;
  color: #b0a49a;
}

.sub-reply-parent {
  font-size: 13px;
  color: #8b7e74;
  font-weight: 500;
}

.sub-reply-time {
  font-size: 11px;
  color: #c0b6aa;
  margin-left: auto;
}

.sub-reply-text {
  font-size: 13px;
  color: #5a4a3f;
  line-height: 1.6;
  word-break: break-word;
}

.sub-reply-text :deep(.mention) {
  color: #6ba1e1;
}

/* ===== 回复操作 ===== */
.reply-actions {
  display: flex;
  justify-content: flex-end;
}

.reply-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #b0a49a;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 12px;
  transition: background 0.2s;
}

.reply-action-btn:active {
  background: #f0ece6;
  color: #8b7e74;
}

/* ===== 底部占位 ===== */
.bottom-spacer {
  height: 80px;
}

/* ===== 底部回复栏 ===== */
.bottom-reply-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fcfaf7;
  border-top: 1px solid #f0ece6;
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 20;
}

.reply-target-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #e8a0bf;
  margin-bottom: 6px;
  padding: 0 4px;
}

.cancel-target {
  background: none;
  border: none;
  color: #b0a49a;
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
}

.reply-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reply-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #ede8e0;
  border-radius: 22px;
  background: #f7f3ee;
  color: #5a4a3f;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.reply-input:focus {
  border-color: #e8a0bf;
  background: #fff;
}

.reply-input::placeholder {
  color: #c0b6aa;
}

.reply-send-btn {
  padding: 8px 18px;
  background: linear-gradient(135deg, #e8a0bf, #e1c195);
  color: #fff;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.reply-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.reply-send-btn:active:not(:disabled) {
  opacity: 0.8;
}

/* ===== 错误提示 ===== */
.error-toast {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(90, 74, 63, 0.9);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 30;
  white-space: nowrap;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
