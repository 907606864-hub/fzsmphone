<template>
  <div class="chat-page">
    <!-- Nav -->
    <NavBar :title="chatTitle" back-to="/friends">
      <template #right>
        <button class="icon-btn" @click="showInfo = !showInfo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
      </template>
    </NavBar>

    <!-- No API Key warning -->
    <div v-if="!settingsStore.settings.apiKey" class="api-warning" @click="goToSettings">
      <span>⚠️ 未配置 API Key，点击前往设置</span>
    </div>

    <!-- Active Preset indicator -->
    <div v-if="activePresetName" class="preset-indicator">
      <span>🎭 预设：{{ activePresetName }}</span>
      <span v-if="userPersonaName" class="persona-tag">👤 {{ userPersonaName }}</span>
    </div>

    <!-- Messages -->
    <div ref="messagesRef" class="messages-area" @scroll="handleScroll">
      <div class="messages-inner">
        <!-- Date divider -->
        <div class="date-divider" v-if="chatStore.currentMessages.length > 0">
          <span>{{ formatDate(chatStore.currentMessages[0]?.created_at) }}</span>
        </div>

        <TransitionGroup name="msg">
          <div
            v-for="msg in chatStore.currentMessages"
            :key="msg.id"
            class="message-row"
            :class="{
              'is-user': msg.role === 'user',
              'is-assistant': msg.role === 'assistant',
            }"
          >
            <!-- AI Avatar -->
            <div class="msg-avatar" v-if="msg.role === 'assistant'">
              <img v-if="characterAvatar" :src="characterAvatar" class="avatar-img" />
              <span v-else class="avatar-emoji">🤖</span>
            </div>

            <!-- Bubble -->
            <div class="msg-bubble" :class="msg.role">
              <p class="msg-text">{{ msg.content }}</p>
              <span class="msg-time">{{ formatMsgTime(msg.created_at) }}</span>
            </div>

            <!-- User avatar -->
            <div class="msg-avatar" v-if="msg.role === 'user'">
              <span class="avatar-emoji user-avatar">😊</span>
            </div>
          </div>
        </TransitionGroup>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="message-row is-assistant">
          <div class="msg-avatar">
            <img v-if="characterAvatar" :src="characterAvatar" class="avatar-img" />
            <span v-else class="avatar-emoji">🤖</span>
          </div>
          <div class="msg-bubble assistant typing-bubble">
            <div v-if="streamingText" class="msg-text">{{ streamingText }}</div>
            <div v-else class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="input-row">
        <button class="input-action" @click="showEmojiPanel = !showEmojiPanel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        <div class="text-input-wrap">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="text-input"
            placeholder="输入消息..."
            rows="1"
            @keydown="handleKeydown"
            @input="autoResize"
          ></textarea>
        </div>

        <button
          class="send-btn"
          :class="{ active: inputText.trim() }"
          :disabled="!inputText.trim() || isTyping"
          @click="handleSend"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Info Panel -->
    <div v-if="showInfo" class="info-overlay" @click.self="showInfo = false">
      <div class="info-panel">
        <div class="info-header">
          <h3>聊天信息</h3>
          <span class="close-btn" @click="showInfo = false">✕</span>
        </div>
        <div class="info-body">
          <div class="info-section" v-if="currentCharacter">
            <div class="info-label">角色</div>
            <div class="info-value">{{ currentCharacter.name }}</div>
            <div v-if="currentCharacter.description" class="info-desc">{{ currentCharacter.description }}</div>
          </div>
          <div class="info-section" v-if="activePresetName">
            <div class="info-label">当前预设</div>
            <div class="info-value">{{ activePresetName }}</div>
          </div>
          <div class="info-section" v-if="userPersonaName">
            <div class="info-label">用户人设</div>
            <div class="info-value">{{ userPersonaName }}</div>
          </div>
          <div class="info-section" v-if="matchedWorldBookCount > 0">
            <div class="info-label">世界书匹配</div>
            <div class="info-value">{{ matchedWorldBookCount }} 个条目已注入</div>
          </div>
          <div class="info-actions">
            <button class="info-action-btn" @click="clearChat">🗑️ 清空聊天记录</button>
            <button class="info-action-btn" @click="regenerateLast">🔄 重新生成最后回复</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import {
  sendAIRequest,
  buildFullMessages,
  splitIntoSegments,
  getActivePreset,
  getCurrentUserPersona,
  getCharacterById,
  getCharacterWorldBookEntries,
  matchWorldBookEntries,
} from '@/utils/aiService'
import type { AIMessage, CharacterData } from '@/utils/aiService'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()

const messagesRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const inputText = ref('')
const isTyping = ref(false)
const streamingText = ref('')
const showInfo = ref(false)
const showEmojiPanel = ref(false)
const matchedWorldBookCount = ref(0)
let abortController: AbortController | null = null

const conversationId = computed(() => {
  const id = route.params.friendId || route.params.id
  return id ? String(id) : null
})

// 获取当前角色
const currentCharacter = computed((): CharacterData | null => {
  const conv = chatStore.currentConversation
  if (!conv) return null

  // 从 localStorage 获取完整角色数据
  if (conv.characterId) {
    return getCharacterById(conv.characterId)
  }

  return conv.character as CharacterData | null
})

const characterAvatar = computed(() => {
  const char = currentCharacter.value
  return char?.avatar || (char as any)?.avatar_url || ''
})

const chatTitle = computed(() => {
  return chatStore.currentConversation?.title
    || currentCharacter.value?.name
    || '聊天'
})

// 预设名称
const activePresetName = computed(() => {
  const preset = getActivePreset()
  return preset?.name || ''
})

// 用户人设名称
const userPersonaName = computed(() => {
  const persona = getCurrentUserPersona()
  return persona?.name || ''
})

function formatDate(dateStr: string | number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return '今天'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatMsgTime(dateStr: string | number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom(smooth = true) {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTo({
        top: messagesRef.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  })
}

function handleScroll() {
  // 可实现上拉加载更多
}

function autoResize() {
  const el = inputRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
}

function handleKeydown(e: KeyboardEvent) {
  const behavior = settingsStore.settings.sendKeyBehavior
  if (e.key === 'Enter') {
    if (behavior === 'send' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
}

function goToSettings() {
  router.push('/customize')
}

// 构建消息历史给 AI
function buildMessageHistory(): AIMessage[] {
  const character = currentCharacter.value

  // 获取最近消息上下文
  const recent: AIMessage[] = chatStore.currentMessages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // 使用 buildFullMessages 构建完整消息列表
  return buildFullMessages(
    character,
    recent,
    settingsStore.settings.maxLength,
  )
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return
  if (!conversationId.value) return

  inputText.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  // 添加用户消息
  chatStore.addMessage(conversationId.value, 'user', text)
  scrollToBottom()

  // 检查 API Key
  const s = settingsStore.settings
  if (!s.apiKey) {
    chatStore.addMessage(conversationId.value, 'assistant', '⚠️ 请先在设置中配置 API Key 才能和我聊天哦~')
    scrollToBottom()
    return
  }

  // 调用 AI
  isTyping.value = true
  streamingText.value = ''
  abortController = new AbortController()

  try {
    const aiMessages = buildMessageHistory()

    // 更新世界书匹配计数
    const character = currentCharacter.value
    const allEntries = getCharacterWorldBookEntries(character?.id)
    const recentText = chatStore.currentMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => m.content)
      .join(' ')
    const matched = matchWorldBookEntries(recentText, allEntries)
    matchedWorldBookCount.value = matched.length

    const apiUrl = settingsStore.getApiUrl()
    const isStream = s.streamEnabled

    const response = await sendAIRequest({
      apiKey: s.apiKey,
      apiUrl: apiUrl,
      model: s.model,
      messages: aiMessages,
      temperature: s.temperature,
      maxTokens: s.maxLength,
      stream: isStream,
      timeout: s.timeout,
      signal: abortController.signal,
      onChunk: (chunk: string) => {
        streamingText.value += chunk
        scrollToBottom()
      },
    })

    isTyping.value = false
    const content = isStream ? streamingText.value.trim() : response.content
    streamingText.value = ''

    if (!content) {
      chatStore.addMessage(conversationId.value!, 'assistant', '(AI 返回了空回复)')
      scrollToBottom()
      return
    }

    // 分段发送
    if (s.enableSplit) {
      const segments = splitIntoSegments(content)
      for (let i = 0; i < segments.length; i++) {
        if (i > 0) {
          isTyping.value = true
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500))
          isTyping.value = false
        }
        chatStore.addMessage(conversationId.value!, 'assistant', segments[i])
        scrollToBottom()
      }
    } else {
      chatStore.addMessage(conversationId.value!, 'assistant', content)
      scrollToBottom()
    }
  } catch (err: any) {
    isTyping.value = false
    streamingText.value = ''

    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      return
    }

    chatStore.addMessage(conversationId.value!, 'assistant', `❌ AI 回复失败：${err.message}`)
    scrollToBottom()
  } finally {
    abortController = null
  }
}

function clearChat() {
  if (!conversationId.value) return
  if (!confirm('确定要清空所有聊天记录吗？')) return

  chatStore.currentMessages.splice(0)
  chatStore.saveMessages(conversationId.value)

  // 如果角色有开场白，重新添加
  const char = currentCharacter.value
  if (char?.firstMessage) {
    chatStore.addMessage(conversationId.value, 'assistant', char.firstMessage)
  }

  showInfo.value = false
  scrollToBottom(false)
}

async function regenerateLast() {
  if (!conversationId.value) return
  
  // 删除最后一条 assistant 消息
  const msgs = chatStore.currentMessages
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'assistant') {
      msgs.splice(i, 1)
      break
    }
  }
  chatStore.saveMessages(conversationId.value)
  showInfo.value = false

  // 找到最后一条用户消息来重新生成
  const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')
  if (!lastUserMsg) return

  // 检查 API Key
  const s = settingsStore.settings
  if (!s.apiKey) return

  isTyping.value = true
  streamingText.value = ''
  abortController = new AbortController()

  try {
    const aiMessages = buildMessageHistory()
    const apiUrl = settingsStore.getApiUrl()
    const isStream = s.streamEnabled

    const response = await sendAIRequest({
      apiKey: s.apiKey,
      apiUrl: apiUrl,
      model: s.model,
      messages: aiMessages,
      temperature: s.temperature,
      maxTokens: s.maxLength,
      stream: isStream,
      timeout: s.timeout,
      signal: abortController.signal,
      onChunk: (chunk: string) => {
        streamingText.value += chunk
        scrollToBottom()
      },
    })

    isTyping.value = false
    const content = isStream ? streamingText.value.trim() : response.content
    streamingText.value = ''

    if (content) {
      chatStore.addMessage(conversationId.value!, 'assistant', content)
      scrollToBottom()
    }
  } catch (err: any) {
    isTyping.value = false
    streamingText.value = ''
    if (err.name !== 'AbortError') {
      chatStore.addMessage(conversationId.value!, 'assistant', `❌ 重新生成失败：${err.message}`)
      scrollToBottom()
    }
  } finally {
    abortController = null
  }
}

watch(
  () => chatStore.currentMessages.length,
  () => scrollToBottom(),
)

onMounted(() => {
  if (conversationId.value) {
    chatStore.fetchMessages(conversationId.value)
  }
  scrollToBottom(false)
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

/* API Warning */
.api-warning {
  background: linear-gradient(135deg, #ff9500, #ff6348);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.api-warning:active { opacity: 0.8; }

/* Preset indicator */
.preset-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--separator);
  font-size: 11px;
  color: var(--text-tertiary);
}

.persona-tag {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--fill-tertiary);
}

/* Messages */
.messages-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0;
}

.messages-area::-webkit-scrollbar { display: none; }

.messages-inner {
  padding: 12px 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
}

.date-divider {
  text-align: center;
  padding: 8px 0;
}

.date-divider span {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--fill-tertiary);
  padding: 3px 10px;
  border-radius: 10px;
}

/* Message Row */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}

.message-row.is-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.is-assistant {
  align-self: flex-start;
}

/* Avatar */
.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-emoji {
  font-size: 28px;
  line-height: 1;
}

.user-avatar {
  font-size: 26px;
}

/* Bubble */
.msg-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  position: relative;
  max-width: 100%;
  word-break: break-word;
}

.msg-bubble.user {
  background: var(--brand-primary, #007aff);
  color: white;
  border-bottom-right-radius: 6px;
}

.msg-bubble.assistant {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-bottom-left-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.msg-text {
  font-size: 15px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

.msg-time {
  display: block;
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.6;
  text-align: right;
}

.msg-bubble.user .msg-time {
  color: rgba(255, 255, 255, 0.7);
}

/* Typing */
.typing-bubble { padding: 14px 18px; }

.typing-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: typingBounce 1.2s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* Input Area */
.input-area {
  background: var(--bg-primary);
  border-top: 0.5px solid var(--separator);
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-action {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.input-action:active { background: var(--fill-tertiary); }
.input-action svg { width: 24px; height: 24px; }

.text-input-wrap {
  flex: 1;
  background: var(--fill-tertiary);
  border-radius: 20px;
  padding: 0 14px;
  display: flex;
  align-items: center;
}

.text-input {
  width: 100%;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--text-primary);
  outline: none;
  resize: none;
  padding: 8px 0;
  line-height: 1.4;
  max-height: 120px;
  font-family: inherit;
}

.text-input::placeholder { color: var(--text-quaternary); }

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--fill-tertiary);
  color: var(--text-quaternary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  transition: all 0.2s var(--ease-ios);
  -webkit-tap-highlight-color: transparent;
}

.send-btn.active {
  background: var(--brand-primary, #007aff);
  color: white;
}

.send-btn:disabled { opacity: 0.5; }
.send-btn:active.active:not(:disabled) { transform: scale(0.9); }
.send-btn svg { width: 20px; height: 20px; }

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
  -webkit-tap-highlight-color: transparent;
}

.icon-btn:active { opacity: 0.5; }
.icon-btn svg { width: 22px; height: 22px; }

/* Info Panel */
.info-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.info-panel {
  width: 100%;
  max-width: 393px;
  max-height: 70%;
  background: var(--bg-primary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--separator);
}

.info-header h3 {
  margin: 0;
  font-size: 17px;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: var(--bg-tertiary, var(--fill-tertiary));
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  border: none;
}

.info-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.info-section {
  margin-bottom: 16px;
}

.info-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.info-value {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.info-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

.info-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.info-action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: var(--fill-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  text-align: center;
}

.info-action-btn:active { opacity: 0.7; }

/* Message transition */
.msg-enter-active { transition: all 0.3s var(--ease-ios); }
.msg-enter-from { opacity: 0; transform: translateY(10px); }
</style>
