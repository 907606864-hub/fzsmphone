<template>
  <div class="discord-page">
    <!-- 左侧频道栏 -->
    <div class="channel-bar">
      <div class="server-icon" @click="$router.back()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </div>
      <div class="channel-divider"></div>
      <div
        v-for="ch in channels"
        :key="ch.id"
        class="channel-item"
        :class="{ active: activeChannel === ch.id }"
        @click="activeChannel = ch.id"
      >
        <span class="ch-hash">#</span>
        <span class="ch-name">{{ ch.name }}</span>
      </div>
    </div>

    <!-- 右侧主内容 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <div class="top-bar">
        <span class="top-hash">#</span>
        <span class="top-channel">{{ activeChannelName }}</span>
        <div class="top-actions">
          <button class="top-btn" @click="showPromptEditor = true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button class="top-btn" @click="handleGenerate" :disabled="store.generating">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: store.generating }">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="messages-area">
        <div v-if="store.lastError" class="error-banner" @click="store.lastError = ''">
          ⚠ {{ store.lastError }}
        </div>

        <div v-if="store.generating && filteredThreads.length === 0" class="loading-state">
          <div class="loading-spinner"></div>
          <span>AI正在生成Discord内容...</span>
        </div>

        <div v-else-if="filteredThreads.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-title">频道空空如也</div>
          <div class="empty-sub">点击右上角刷新按钮让AI生成内容</div>
          <button class="generate-btn" @click="handleGenerate" :disabled="store.generating">
            ✦ 生成频道内容
          </button>
        </div>

        <div v-else class="thread-list">
          <div v-for="thread in filteredThreads" :key="thread.id" class="thread-block">
            <!-- 帖子主楼 -->
            <div class="msg-row">
              <div class="msg-avatar" :style="{ background: getAvatarColor(thread.author) }">
                {{ thread.author.charAt(0) }}
              </div>
              <div class="msg-body">
                <div class="msg-header">
                  <span class="msg-name" :style="{ color: getNameColor(thread.author) }">{{ thread.author }}</span>
                  <span class="msg-time">{{ formatRelativeTime(thread.timestamp) }}</span>
                  <button class="msg-delete" @click="store.deleteForumThread(thread.id)">✕</button>
                </div>
                <div class="msg-title">{{ thread.title }}</div>
                <div class="msg-content">{{ thread.content }}</div>
                <div v-if="getItemImages(thread).length" class="msg-images">
                  <img v-for="(img, idx) in getItemImages(thread)" :key="idx" :src="img" class="msg-gen-img" alt="" />
                </div>
                <div class="msg-actions">
                  <button class="react-btn" :class="{ active: thread.isLiked }" @click="store.toggleForumLike(thread.id)">
                    <svg viewBox="0 0 24 24" width="16" height="16" :fill="thread.isLiked ? '#5865F2' : 'none'" :stroke="thread.isLiked ? '#5865F2' : 'currentColor'" stroke-width="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    {{ thread.likes || '' }}
                  </button>
                  <button class="react-btn" @click="toggleReplies(thread.id)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {{ thread.replies.length || '' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 回复列表 -->
            <div v-if="expandedThreads[thread.id]" class="replies-section">
              <div v-for="reply in thread.replies" :key="reply.id" class="msg-row reply-row">
                <div class="msg-avatar small" :style="{ background: getAvatarColor(reply.author) }">
                  {{ reply.author.charAt(0) }}
                </div>
                <div class="msg-body">
                  <div class="msg-header">
                    <span class="msg-name" :style="{ color: getNameColor(reply.author) }">{{ reply.author }}</span>
                    <span class="msg-time">{{ formatRelativeTime(reply.timestamp) }}</span>
                  </div>
                  <div class="msg-content">{{ reply.content }}</div>
                  <div v-if="getItemImages(reply).length" class="msg-images">
                    <img v-for="(img, idx) in getItemImages(reply)" :key="idx" :src="img" class="msg-gen-img" alt="" />
                  </div>
                </div>
              </div>

              <!-- 回复输入 -->
              <div class="reply-input-row">
                <input
                  v-model="replyDrafts[thread.id]"
                  type="text"
                  :placeholder="`回复 ${thread.title}...`"
                  class="reply-input"
                  @keyup.enter="submitReply(thread)"
                />
                <button class="reply-send" :disabled="!replyDrafts[thread.id]?.trim()" @click="submitReply(thread)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入（发帖） -->
      <div class="compose-bar">
        <input
          v-model="composeText"
          type="text"
          :placeholder="`在 #${activeChannelName} 发消息`"
          class="compose-input"
          @keyup.enter="submitPost"
        />
      </div>
    </div>

    <!-- 提示词编辑器 -->
    <Teleport to="#phone-overlay">
      <Transition name="slide-up">
        <div v-if="showPromptEditor" class="prompt-overlay" @click.self="showPromptEditor = false">
          <div class="prompt-sheet">
            <div class="sheet-bar">
              <button class="sheet-cancel" @click="showPromptEditor = false">关闭</button>
              <span class="sheet-title">Discord 提示词</span>
              <button class="sheet-save" @click="savePrompt">保存</button>
            </div>
            <textarea v-model="promptText" class="sheet-textarea" placeholder="输入生成提示词..."></textarea>
            <div class="prompt-actions">
              <button class="prompt-btn" @click="resetPrompt">重置默认</button>
              <button class="prompt-btn danger" @click="clearAllData">清空数据</button>
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
import { getAvatarColor, formatRelativeTime } from '@/utils/socialParsers'
import type { ForumThread } from '@/utils/socialParsers'
import { getPromptTemplate, setPromptTemplate, resetPromptTemplate } from '@/utils/socialPrompts'

const store = useSocialAIStore()

const activeChannel = ref('general')
const showPromptEditor = ref(false)
const promptText = ref('')
const composeText = ref('')
const replyDrafts = reactive<Record<string, string>>({})
const expandedThreads = reactive<Record<string, boolean>>({})

const channels = [
  { id: 'general', name: '综合' },
  { id: 'chat', name: '闲聊' },
  { id: 'share', name: '分享' },
  { id: 'help', name: '求助' },
]

const activeChannelName = computed(() => channels.find(c => c.id === activeChannel.value)?.name || '综合')

// 将 threads 按频道分流（基于内容关键词简单分类或全显示在综合）
const filteredThreads = computed(() => {
  // 综合频道显示所有帖子
  return store.forumThreads
})

const NAME_COLORS = ['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245', '#9B59B6', '#E67E22', '#1ABC9C']
function getNameColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i)
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length]
}

function getItemImages(item: any): string[] {
  return Array.isArray(item?.images) ? item.images.filter((s: string) => !!s) : []
}

function toggleReplies(threadId: string) {
  expandedThreads[threadId] = !expandedThreads[threadId]
}

onMounted(() => {
  store.loadData('forum')
  promptText.value = getPromptTemplate('forum')
})

async function handleGenerate() {
  await store.generateForumContent()
}

async function submitPost() {
  const text = composeText.value.trim()
  if (!text) return
  composeText.value = ''
  await store.forumPost(text, text)
}

async function submitReply(thread: ForumThread) {
  const text = replyDrafts[thread.id]?.trim()
  if (!text) return
  replyDrafts[thread.id] = ''
  await store.forumReply(thread.id, text)
}

function savePrompt() {
  setPromptTemplate('forum', promptText.value)
  showPromptEditor.value = false
}

function resetPrompt() {
  resetPromptTemplate('forum')
  promptText.value = getPromptTemplate('forum')
}

function clearAllData() {
  if (confirm('确定要清空所有Discord数据吗？')) {
    store.clearData('forum')
    showPromptEditor.value = false
  }
}
</script>

<style scoped>
.discord-page {
  height: 100%;
  display: flex;
  background: #313338;
  position: relative;
  overflow: hidden;
}

/* ===== 频道栏 ===== */
.channel-bar {
  width: 72px;
  background: #2B2D31;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 4px;
  flex-shrink: 0;
  overflow-y: auto;
  padding-top: 60px;
}

.channel-bar::-webkit-scrollbar { display: none; }

.server-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #5865F2;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-radius 0.2s;
  flex-shrink: 0;
}

.server-icon:hover { border-radius: 30%; }

.channel-divider {
  width: 32px;
  height: 2px;
  background: #3F4147;
  border-radius: 1px;
  margin: 6px 0;
  flex-shrink: 0;
}

.channel-item {
  width: 56px;
  padding: 6px 4px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  color: #8E9297;
  font-size: 9px;
  text-align: center;
  transition: all 0.15s;
}

.channel-item:hover { background: #3F4147; color: #DBDEE1; }
.channel-item.active { background: #404249; color: #fff; }

.ch-hash {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.ch-name {
  font-size: 9px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ===== 主区域 ===== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-bar {
  --status-bar-height: 54px;
  height: calc(var(--status-bar-height) + 44px);
  display: flex;
  align-items: center;
  padding: var(--status-bar-height) 12px 0;
  background: #313338;
  border-bottom: 1px solid #232428;
  flex-shrink: 0;
  gap: 6px;
}

.top-hash { color: #8E9297; font-size: 20px; font-weight: 700; }
.top-channel { color: #fff; font-size: 16px; font-weight: 600; flex: 1; }
.top-actions { display: flex; gap: 4px; }

.top-btn {
  width: 32px; height: 32px;
  border: none; background: none;
  color: #B5BAC1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px;
}
.top-btn:hover { color: #DBDEE1; }
.top-btn:disabled { opacity: 0.4; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 消息区 ===== */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}
.messages-area::-webkit-scrollbar { display: none; }

.error-banner { background: #F0B232; color: #313338; padding: 8px 12px; font-size: 13px; cursor: pointer; border-radius: 6px; margin-bottom: 8px; }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; color: #8E9297; }
.loading-spinner { width: 32px; height: 32px; border: 3px solid #3F4147; border-top-color: #5865F2; border-radius: 50%; animation: spin 0.8s linear infinite; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 50px 20px; gap: 8px; color: #8E9297; }
.empty-icon { font-size: 44px; margin-bottom: 4px; }
.empty-title { font-size: 16px; font-weight: 600; color: #DBDEE1; }
.empty-sub { font-size: 13px; }
.generate-btn { margin-top: 16px; padding: 10px 28px; background: #5865F2; color: #fff; border: none; border-radius: 4px; font-size: 15px; font-weight: 600; cursor: pointer; }
.generate-btn:hover { background: #4752C4; }
.generate-btn:disabled { opacity: 0.5; }

/* ===== 帖子列表 ===== */
.thread-list { display: flex; flex-direction: column; gap: 2px; }

.thread-block {
  border-bottom: 1px solid #3F4147;
  padding-bottom: 4px;
  margin-bottom: 4px;
}

.msg-row {
  display: flex;
  gap: 12px;
  padding: 8px 4px;
  border-radius: 4px;
  transition: background 0.1s;
}
.msg-row:hover { background: #2E3035; }

.msg-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: 700;
  flex-shrink: 0;
}
.msg-avatar.small { width: 28px; height: 28px; font-size: 12px; }

.msg-body { flex: 1; min-width: 0; }

.msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
.msg-name { font-size: 14px; font-weight: 600; }
.msg-time { font-size: 11px; color: #6D6F78; }
.msg-delete { border: none; background: none; color: #6D6F78; cursor: pointer; font-size: 12px; margin-left: auto; opacity: 0; transition: opacity 0.15s; }
.msg-row:hover .msg-delete { opacity: 1; }
.msg-delete:hover { color: #ED4245; }

.msg-title { font-size: 15px; font-weight: 600; color: #F2F3F5; margin-bottom: 4px; }
.msg-content { font-size: 14px; color: #DBDEE1; line-height: 1.5; word-break: break-word; }

.msg-images { margin-top: 8px; }
.msg-gen-img { max-width: 100%; border-radius: 8px; margin-bottom: 4px; }

.msg-actions { display: flex; gap: 8px; margin-top: 6px; }

.react-btn {
  display: flex; align-items: center; gap: 4px;
  border: 1px solid #3F4147; background: #2B2D31;
  color: #B5BAC1; font-size: 12px; cursor: pointer;
  padding: 4px 10px; border-radius: 4px;
  transition: all 0.15s;
}
.react-btn:hover { border-color: #5865F2; background: #383A40; }
.react-btn.active { border-color: #5865F2; background: rgba(88,101,242,0.15); color: #5865F2; }

/* ===== 回复区 ===== */
.replies-section {
  margin-left: 52px;
  border-left: 2px solid #3F4147;
  padding-left: 12px;
}

.reply-row { padding: 4px 0; }

.reply-input-row { display: flex; gap: 6px; margin: 6px 0 4px; }

.reply-input {
  flex: 1;
  background: #383A40;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #DBDEE1;
  font-size: 13px;
  outline: none;
}
.reply-input::placeholder { color: #6D6F78; }
.reply-input:focus { box-shadow: 0 0 0 1px #5865F2; }

.reply-send {
  width: 34px; height: 34px;
  border: none; background: #5865F2;
  border-radius: 8px; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.reply-send:disabled { opacity: 0.3; }

/* ===== 底部输入 ===== */
.compose-bar {
  padding: 8px 12px 16px;
  flex-shrink: 0;
}

.compose-input {
  width: 100%;
  background: #383A40;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  color: #DBDEE1;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.compose-input::placeholder { color: #6D6F78; }
.compose-input:focus { box-shadow: 0 0 0 1px #5865F2; }

/* ===== 提示词弹窗 ===== */
.prompt-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; }
.prompt-sheet { width: 100%; background: #2B2D31; border-radius: 12px 12px 0 0; max-height: 90%; display: flex; flex-direction: column; }
.sheet-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #3F4147; flex-shrink: 0; }
.sheet-cancel { border: none; background: none; color: #B5BAC1; font-size: 15px; cursor: pointer; }
.sheet-title { font-size: 16px; font-weight: 600; color: #fff; }
.sheet-save { border: none; background: none; color: #5865F2; font-size: 15px; font-weight: 600; cursor: pointer; }
.sheet-textarea { flex: 1; padding: 14px 16px; border: none; resize: none; font-size: 13px; color: #DBDEE1; background: #2B2D31; line-height: 1.6; outline: none; min-height: 200px; font-family: monospace; }
.sheet-textarea::placeholder { color: #6D6F78; }
.prompt-actions { display: flex; gap: 8px; padding: 10px 16px; border-top: 1px solid #3F4147; }
.prompt-btn { flex: 1; padding: 10px; border: 1px solid #3F4147; background: #383A40; border-radius: 4px; font-size: 13px; color: #B5BAC1; cursor: pointer; }
.prompt-btn.danger { color: #ED4245; border-color: #ED4245; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; }
.slide-up-enter-from .prompt-sheet, .slide-up-leave-to .prompt-sheet { transform: translateY(100%); }
</style>
