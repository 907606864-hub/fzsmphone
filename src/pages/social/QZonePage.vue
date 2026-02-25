<template>
  <div class="qzone-page">
    <!-- 封面区域 -->
    <div class="cover-section">
      <div class="cover-gradient"></div>
      <div class="cover-top-bar">
        <button class="cover-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div class="cover-actions">
          <button class="cover-btn" @click="showPromptEditor = true">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button class="cover-btn" @click="handleGenerate" :disabled="store.generating">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: store.generating }">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>
      <div class="cover-user">
        <span class="cover-name">{{ userName }}</span>
        <div class="cover-avatar" :style="{ background: getAvatarColor(userName) }">
          {{ userName.charAt(0) }}
        </div>
      </div>
    </div>

    <!-- 动态列表 -->
    <div class="moments-list">
      <!-- 全局错误提示（内联显示） -->
      <div v-if="store.lastError" class="error-banner" @click="store.lastError = ''">
        ⚠️ {{ store.lastError }}
        <span class="error-dismiss">点击关闭</span>
      </div>

      <!-- 加载中 -->
      <div v-if="store.generating && store.moments.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <span>AI正在生成朋友圈动态...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="store.moments.length === 0" class="empty-state">
        <div class="empty-icon">📷</div>
        <div class="empty-title">朋友圈空空如也</div>
        <div class="empty-sub">点击右上角刷新让AI生成朋友圈动态</div>
        <button class="generate-btn" @click="handleGenerate" :disabled="store.generating">
          ✨ 生成朋友圈
        </button>
      </div>

      <!-- 动态列表 -->
      <template v-else>
        <div
          v-for="moment in store.moments"
          :key="moment.id"
          class="moment-card"
        >
          <!-- 头像 -->
          <div class="moment-avatar" :style="{ background: getAvatarColor(moment.author) }">
            {{ moment.author.charAt(0) }}
          </div>

          <!-- 内容区 -->
          <div class="moment-body">
            <div class="moment-author">{{ moment.author }}</div>
            <div class="moment-text" v-html="formatContent(moment.content)"></div>

            <!-- 时间和操作 -->
            <div class="moment-meta">
              <span class="moment-time">{{ formatRelativeTime(moment.timestamp) }}</span>
              <div class="moment-btns">
                <button class="moment-action-btn" @click="toggleInteraction(moment)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="5" cy="12" r="1" fill="currentColor" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                    <circle cx="19" cy="12" r="1" fill="currentColor" />
                  </svg>
                </button>
                <button class="moment-delete-btn" @click="store.deleteMoment(moment.id)">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 快捷操作浮层 -->
            <Transition name="pop">
              <div v-if="moment.showInteraction" class="interaction-popup">
                <button class="popup-btn" @click="handleLike(moment)">
                  <svg viewBox="0 0 24 24" width="16" height="16" :fill="moment.isLiked ? '#fff' : 'none'" stroke="#fff" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {{ moment.isLiked ? '取消' : '赞' }}
                </button>
                <div class="popup-divider"></div>
                <button class="popup-btn" @click="openCommentInput(moment)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  评论
                </button>
              </div>
            </Transition>

            <!-- 互动区域（点赞+评论） -->
            <div v-if="moment.likedBy.length > 0 || moment.comments.length > 0 || showCommentInput === moment.id" class="interaction-box">
              <!-- 点赞列表 -->
              <div v-if="moment.likedBy.length > 0" class="likes-section">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#e8a0bf" stroke="none" class="likes-icon">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span class="likes-names">{{ moment.likedBy.join('，') }}</span>
              </div>

              <!-- 分隔线 -->
              <div v-if="moment.likedBy.length > 0 && moment.comments.length > 0" class="interaction-divider"></div>

              <!-- 评论列表 -->
              <div v-if="moment.comments.length > 0" class="comments-section">
                <div
                  v-for="c in moment.comments"
                  :key="c.id"
                  class="comment-row"
                  @click="startReplyTo(moment, c)"
                >
                  <template v-if="c.replyTo">
                    <span class="comment-author-name">{{ c.author }}</span>
                    <span class="comment-reply-arrow">回复</span>
                    <span class="comment-reply-target">{{ c.replyTo }}</span>
                    <span class="comment-colon">：</span>
                    <span class="comment-content-text">{{ c.content }}</span>
                  </template>
                  <template v-else>
                    <span class="comment-author-name">{{ c.author }}</span>
                    <span class="comment-colon">：</span>
                    <span class="comment-content-text">{{ c.content }}</span>
                  </template>
                </div>
              </div>

              <!-- 评论输入 -->
              <div v-if="showCommentInput === moment.id" class="comment-input-row">
                <input
                  ref="commentInputRef"
                  v-model="moment.commentDraft"
                  type="text"
                  :placeholder="replyToUser ? `回复 ${replyToUser}...` : '评论...'"
                  class="comment-input"
                  @keyup.enter="submitComment(moment)"
                />
                <button class="comment-send" :disabled="!moment.commentDraft?.trim()" @click="submitComment(moment)">
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 发布按钮 (FAB) -->
    <button class="fab-publish" @click="showCompose = true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    </button>

    <!-- 发布弹窗 -->
    <Teleport to="#phone-overlay">
      <Transition name="slide-up">
        <div v-if="showCompose" class="compose-overlay" @click.self="showCompose = false">
          <div class="compose-sheet">
            <div class="sheet-bar">
              <button class="sheet-cancel" @click="showCompose = false">取消</button>
              <span class="sheet-title">发朋友圈</span>
              <button class="sheet-post" :disabled="!composeText.trim() || store.generating" @click="publishMoment">
                {{ store.generating ? '发布中...' : '发表' }}
              </button>
            </div>
            <textarea
              v-model="composeText"
              class="sheet-textarea"
              placeholder="这一刻的想法..."
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
              <span class="sheet-title">朋友圈提示词</span>
              <button class="sheet-post" @click="savePrompt">保存</button>
            </div>
            <textarea
              v-model="promptText"
              class="sheet-textarea prompt-textarea"
              placeholder="输入朋友圈生成提示词..."
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSocialAIStore } from '@/stores/socialAI'
import {
  getAvatarColor,
  formatContent,
  formatRelativeTime,
} from '@/utils/socialParsers'
import type { MomentItem, MomentComment } from '@/utils/socialParsers'
import { getPromptTemplate, setPromptTemplate, resetPromptTemplate } from '@/utils/socialPrompts'

const store = useSocialAIStore()

const showCompose = ref(false)
const composeText = ref('')
const showPromptEditor = ref(false)
const promptText = ref('')
const showCommentInput = ref<string | null>(null)
const replyToUser = ref<string | null>(null)
const commentInputRef = ref<HTMLInputElement[] | null>(null)

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

onMounted(() => {
  store.loadData('moments')
  promptText.value = getPromptTemplate('moments')
})

async function handleGenerate() {
  await store.generateMomentsContent()
}

function toggleInteraction(moment: MomentItem) {
  moment.showInteraction = !moment.showInteraction
  // 自动关闭其他
  store.moments.forEach(m => {
    if (m.id !== moment.id) m.showInteraction = false
  })
}

function handleLike(moment: MomentItem) {
  store.toggleMomentLike(moment.id)
  moment.showInteraction = false
}

function openCommentInput(moment: MomentItem) {
  moment.showInteraction = false
  replyToUser.value = null
  showCommentInput.value = moment.id
  nextTick(() => {
    if (commentInputRef.value && commentInputRef.value.length > 0) {
      commentInputRef.value[0]?.focus()
    }
  })
}

function startReplyTo(moment: MomentItem, comment: MomentComment) {
  replyToUser.value = comment.author
  showCommentInput.value = moment.id
  nextTick(() => {
    if (commentInputRef.value && commentInputRef.value.length > 0) {
      commentInputRef.value[0]?.focus()
    }
  })
}

function submitComment(moment: MomentItem) {
  const text = moment.commentDraft?.trim()
  if (!text) return

  // 使用store的momentComment方法，它会自动添加评论
  // 但我们需要处理回复对象
  if (replyToUser.value) {
    moment.comments.push({
      id: `mcr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      momentId: moment.id,
      author: userName.value,
      content: text,
      replyTo: replyToUser.value,
      timestamp: new Date().toISOString(),
    })
    store.saveData('moments')
  } else {
    store.momentComment(moment.id, text)
  }

  moment.commentDraft = ''
  replyToUser.value = null
  showCommentInput.value = null
}

async function publishMoment() {
  const text = composeText.value.trim()
  if (!text) return
  composeText.value = ''
  showCompose.value = false
  await store.momentPublish(text)
}

function savePrompt() {
  setPromptTemplate('moments', promptText.value)
  showPromptEditor.value = false
}

function resetPrompt() {
  resetPromptTemplate('moments')
  promptText.value = getPromptTemplate('moments')
}

function clearAllData() {
  if (confirm('确定要清空所有朋友圈数据吗？')) {
    store.clearData('moments')
    showPromptEditor.value = false
  }
}
</script>

<style scoped>
.qzone-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f3f0;
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.qzone-page::-webkit-scrollbar {
  display: none;
}

/* ===== 封面区域 ===== */
.cover-section {
  position: relative;
  height: 220px;
  flex-shrink: 0;
}

.cover-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.cover-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  z-index: 5;
}

.cover-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.cover-btn:active {
  background: rgba(0, 0, 0, 0.3);
}

.cover-btn:disabled {
  opacity: 0.5;
}

.cover-actions {
  display: flex;
  gap: 6px;
}

.cover-user {
  position: absolute;
  bottom: -28px;
  right: 16px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  z-index: 5;
}

.cover-name {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  margin-bottom: 10px;
}

.cover-avatar {
  width: 68px;
  height: 68px;
  border-radius: 12px;
  border: 3px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 动态列表 ===== */
.moments-list {
  flex: 1;
  padding-top: 40px;
  padding-bottom: 80px;
}

/* ===== 加载/空状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  gap: 12px;
  color: #a09890;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e8e2dc;
  border-top-color: #764ba2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 20px;
  gap: 8px;
}

.empty-icon {
  font-size: 44px;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #8b7e74;
}

.empty-sub {
  font-size: 13px;
  color: #b0a49a;
}

.generate-btn {
  margin-top: 16px;
  padding: 10px 28px;
  background: linear-gradient(135deg, #764ba2, #f093fb);
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

/* ===== 动态卡片 ===== */
.moment-card {
  display: flex;
  gap: 10px;
  padding: 16px 16px 0;
  border-bottom: 0.5px solid #e8e2dc;
}

.moment-avatar {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.moment-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 14px;
}

.moment-author {
  font-size: 15px;
  font-weight: 600;
  color: #576b95;
  margin-bottom: 4px;
}

.moment-text {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: 8px;
}

.moment-text :deep(.mention) {
  color: #576b95;
  font-weight: 500;
}

.moment-text :deep(.topic-tag) {
  color: #576b95;
  font-weight: 500;
}

/* ===== 时间和操作 ===== */
.moment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.moment-time {
  font-size: 12px;
  color: #b0a49a;
}

.moment-btns {
  display: flex;
  gap: 6px;
}

.moment-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f0ece6;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b7e74;
}

.moment-action-btn:active {
  background: #e0dbd4;
}

.moment-delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0b6aa;
}

.moment-delete-btn:active {
  color: #999;
}

/* ===== 快捷操作浮层 ===== */
.interaction-popup {
  display: flex;
  align-items: center;
  background: #4a4a4a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}

.popup-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #fff;
  font-size: 13px;
  padding: 8px 16px;
  cursor: pointer;
}

.popup-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.popup-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scaleX(0.8);
  transform-origin: right center;
}

/* ===== 互动区域 ===== */
.interaction-box {
  background: #f0ece6;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 4px;
  position: relative;
}

.interaction-box::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #f0ece6;
}

.likes-section {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding-bottom: 6px;
}

.likes-icon {
  flex-shrink: 0;
  margin-top: 3px;
}

.likes-names {
  font-size: 13px;
  color: #576b95;
  font-weight: 500;
  line-height: 1.5;
}

.interaction-divider {
  height: 1px;
  background: #e0dbd4;
  margin-bottom: 6px;
}

.comments-section {
  padding: 0;
}

.comment-row {
  font-size: 13px;
  line-height: 1.7;
  color: #333;
  padding: 2px 0;
  cursor: pointer;
}

.comment-author-name {
  color: #576b95;
  font-weight: 600;
}

.comment-reply-arrow {
  color: #999;
  margin: 0 2px;
  font-size: 12px;
}

.comment-reply-target {
  color: #576b95;
  font-weight: 600;
}

.comment-colon {
  color: #999;
}

.comment-content-text {
  color: #333;
}

/* ===== 评论输入 ===== */
.comment-input-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e0dbd4;
}

.comment-input {
  flex: 1;
  border: none;
  background: #fff;
  border-radius: 14px;
  padding: 6px 12px;
  font-size: 13px;
  color: #333;
  outline: none;
}

.comment-input::placeholder {
  color: #c0b6aa;
}

.comment-send {
  border: none;
  background: none;
  color: #576b95;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 6px;
  white-space: nowrap;
}

.comment-send:disabled {
  opacity: 0.3;
}

/* ===== FAB ===== */
.fab-publish {
  position: absolute;
  bottom: 24px;
  right: 16px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #764ba2, #f093fb);
  border: none;
  box-shadow: 0 4px 16px rgba(118, 75, 162, 0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: transform 0.2s;
}

.fab-publish:active {
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
  color: #764ba2;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.sheet-post:disabled {
  color: #ccc;
}

.sheet-textarea {
  width: 100%;
  min-height: 140px;
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
  margin: 0 12px 8px;
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
