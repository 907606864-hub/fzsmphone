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

    <!-- Messages -->
    <div ref="messagesRef" class="messages-area" @scroll="handleScroll">
      <div class="messages-inner">
        <!-- Date divider -->
        <div class="date-divider" v-if="messages.length > 0">
          <span>{{ formatDate(messages[0]?.created_at || messages[0]?.timestamp) }}</span>
        </div>

        <TransitionGroup name="msg">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-row"
            :class="{
              'is-user': msg.role === 'user',
              'is-assistant': msg.role === 'assistant',
            }"
          >
            <!-- AI Avatar -->
            <div class="msg-avatar" v-if="msg.role === 'assistant'">
              <span class="avatar-emoji">🤖</span>
            </div>

            <!-- Bubble -->
            <div class="msg-bubble" :class="msg.role">
              <p class="msg-text">{{ msg.content }}</p>
              <span class="msg-time">{{ formatMsgTime(msg.created_at || msg.timestamp) }}</span>
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
            <span class="avatar-emoji">🤖</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { sendAIRequest, buildSystemPrompt, splitIntoSegments } from '@/utils/aiService'
import type { AIMessage } from '@/utils/aiService'

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
let abortController: AbortController | null = null

// 本地消息存储（用于前端直接AI调用场景）
const localMessages = ref<any[]>([])

const conversationId = computed(() => {
  const id = route.params.friendId || route.params.id
  return id ? String(id) : null
})

const chatTitle = computed(() => {
  return chatStore.currentConversation?.title
    || chatStore.currentConversation?.character?.name
    || '聊天'
})

// 使用本地消息或store消息
const messages = computed(() => {
  if (localMessages.value.length > 0) {
    return localMessages.value
  }
  return chatStore.currentMessages
})

// 获取当前角色信息
const currentCharacter = computed(() => {
  return chatStore.currentConversation?.character || null
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
    // 如果是 'newline' 模式，Enter 正常换行
  }
}

function goToSettings() {
  router.push('/customize')
}

// 加载本地消息
function loadLocalMessages() {
  if (!conversationId.value) return
  const key = `chat-messages-${conversationId.value}`
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      localMessages.value = JSON.parse(saved)
    }
  } catch {
    // ignore
  }
}

// 保存本地消息
function saveLocalMessages() {
  if (!conversationId.value) return
  const key = `chat-messages-${conversationId.value}`
  try {
    // 只保留最近200条
    const toSave = localMessages.value.slice(-200)
    localStorage.setItem(key, JSON.stringify(toSave))
  } catch {
    // ignore
  }
}

// 添加本地消息
function addMessage(role: 'user' | 'assistant', content: string) {
  const msg = {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversation_id: conversationId.value,
    role,
    content,
    msg_type: 'text',
    extra: {},
    created_at: new Date().toISOString(),
    timestamp: Date.now(),
  }
  localMessages.value.push(msg)
  saveLocalMessages()
  return msg
}

// 构建消息历史给 AI
function buildMessageHistory(): AIMessage[] {
  const msgs: AIMessage[] = []

  // 系统提示词
  const character = currentCharacter.value
  const systemPrompt = buildSystemPrompt(
    character || { name: chatTitle.value },
    settingsStore.settings.userName ? { name: settingsStore.settings.userName } : undefined,
    settingsStore.settings.maxLength,
  )
  msgs.push({ role: 'system', content: systemPrompt })

  // 最近消息上下文
  const recent = localMessages.value
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-10)

  for (const m of recent) {
    msgs.push({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })
  }

  return msgs
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  inputText.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  // 添加用户消息
  addMessage('user', text)
  scrollToBottom()

  // 也发到后端（如果有的话）
  if (conversationId.value) {
    chatStore.sendMessage(Number(conversationId.value), text).catch(() => {})
  }

  // 检查 API Key
  const s = settingsStore.settings
  if (!s.apiKey) {
    // 无 API Key 时不调用 AI
    addMessage('assistant', '⚠️ 请先在设置中配置 API Key 才能和我聊天哦~')
    scrollToBottom()
    return
  }

  // 调用 AI
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
        // 流式模式：实时更新显示
        streamingText.value += chunk
        scrollToBottom()
      },
    })

    isTyping.value = false
    const content = isStream ? streamingText.value.trim() : response.content
    streamingText.value = ''

    if (!content) {
      addMessage('assistant', '(AI 返回了空回复)')
      scrollToBottom()
      return
    }

    // 分段发送
    if (s.enableSplit) {
      const segments = splitIntoSegments(content)
      for (let i = 0; i < segments.length; i++) {
        if (i > 0) {
          // 模拟打字延迟
          isTyping.value = true
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500))
          isTyping.value = false
        }
        addMessage('assistant', segments[i])
        scrollToBottom()
      }
    } else {
      addMessage('assistant', content)
      scrollToBottom()
    }
  } catch (err: any) {
    isTyping.value = false
    streamingText.value = ''

    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      return // 用户主动取消
    }

    addMessage('assistant', `❌ AI 回复失败：${err.message}`)
    scrollToBottom()
  } finally {
    abortController = null
  }
}

watch(
  () => messages.value.length,
  () => scrollToBottom(),
)

onMounted(() => {
  // 加载本地消息
  loadLocalMessages()

  // 也尝试从后端加载
  if (conversationId.value) {
    chatStore.fetchMessages(Number(conversationId.value)).catch(() => {})
  }

  scrollToBottom(false)
})

onUnmounted(() => {
  // 取消进行中的请求
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

.api-warning:active {
  opacity: 0.8;
}

/* Messages */
.messages-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0;
}

.messages-area::-webkit-scrollbar {
  display: none;
}

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
.typing-bubble {
  padding: 14px 18px;
}

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

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
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

.input-action:active {
  background: var(--fill-tertiary);
}

.input-action svg {
  width: 24px;
  height: 24px;
}

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

.text-input::placeholder {
  color: var(--text-quaternary);
}

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
  transform: scale(1);
}

.send-btn:disabled {
  opacity: 0.5;
}

.send-btn:active.active:not(:disabled) {
  transform: scale(0.9);
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

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

.icon-btn:active {
  opacity: 0.5;
}

.icon-btn svg {
  width: 22px;
  height: 22px;
}

/* Message transition */
.msg-enter-active {
  transition: all 0.3s var(--ease-ios);
}

.msg-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
