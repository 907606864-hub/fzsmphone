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
      <span>未配置 API Key，点击前往设置</span>
    </div>

    <!-- Active Preset indicator -->
    <div v-if="activePresetName" class="preset-indicator">
      <span>预设：{{ activePresetName }}</span>
      <span v-if="userPersonaName" class="persona-tag">{{ userPersonaName }}</span>
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
              <span v-else class="avatar-fallback">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
              </span>
            </div>

            <!-- Transfer Card -->
            <div v-if="msg.msg_type === 'transfer'" class="transfer-card" :class="msg.role" @click="handleTransferClick(msg)">
              <div class="transfer-card-body">
                <div class="transfer-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <path d="M2 10h20"/>
                    <path d="M6 16h4"/>
                  </svg>
                </div>
                <div class="transfer-info">
                  <div class="transfer-amount">¥{{ getTransferExtra(msg).amount?.toFixed(2) }}</div>
                  <div class="transfer-note">{{ getTransferExtra(msg).note || '转账' }}</div>
                </div>
              </div>
              <div class="transfer-footer">
                <span v-if="msg.role === 'user'">
                  {{ getTransferExtra(msg).accepted ? '已被领取' : '待领取' }}
                </span>
                <span v-else>
                  {{ getTransferExtra(msg).accepted ? '已收款' : '点击收款' }}
                </span>
              </div>
              <span class="msg-time">{{ formatMsgTime(msg.created_at) }}</span>
            </div>

            <!-- Red Packet Card -->
            <div v-else-if="msg.msg_type === 'redpacket'" class="redpacket-card" :class="[msg.role, { opened: getRedPacketExtra(msg).opened }]" @click="handleRedPacketClick(msg)">
              <div class="rp-card-body">
                <div class="rp-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                    <rect x="3" y="1" width="18" height="22" rx="3"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/>
                    <path d="M12 7v6" stroke="#E6162D" stroke-width="1.5"/>
                    <path d="M9 10h6" stroke="#E6162D" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="rp-info">
                  <div class="rp-note">{{ getRedPacketExtra(msg).note || '恭喜发财，大吉大利' }}</div>
                  <div class="rp-status" v-if="getRedPacketExtra(msg).opened">
                    已领取 ¥{{ getRedPacketExtra(msg).amount?.toFixed(2) }}
                  </div>
                </div>
              </div>
              <div class="rp-footer">
                <span v-if="msg.role === 'user'">
                  {{ getRedPacketExtra(msg).opened ? '红包已被领取' : '红包' }}
                </span>
                <span v-else>
                  {{ getRedPacketExtra(msg).opened ? '已拆开' : '点击拆开红包' }}
                </span>
              </div>
              <span class="msg-time rp-time">{{ formatMsgTime(msg.created_at) }}</span>
            </div>

            <!-- Normal Bubble -->
            <div v-else class="msg-bubble" :class="msg.role" @click="startReply(msg)">
              <div v-if="(msg.extra as any)?.replyTo" class="reply-quote-inline">
                <span class="rqi-name">{{ (msg.extra as any).replyTo.role === 'user' ? '我' : chatTitle }}</span>
                <span class="rqi-text">{{ truncateText((msg.extra as any).replyTo.content, 40) }}</span>
              </div>
              <div class="msg-text">
                <template v-for="(seg, idx) in parseMessageContent(msg.content)" :key="idx">
                  <span v-if="seg.type === 'text'" style="white-space: pre-wrap;">{{ seg.content }}</span>
                  <div v-else-if="seg.type === 'image-prompt'" class="chat-image-block">
                    <img v-if="msg.extra?.images?.[idx]?.url" :src="msg.extra.images[idx].url" class="chat-generated-image" @click.stop="previewImage(msg.extra.images[idx].url)" />
                    
                    <div v-else-if="msg.extra?.images?.[idx]?.error" class="chat-image-error" @click.stop="handleGenerateImage(msg, seg.prompt!, idx)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>生图失败重试</span>
                    </div>

                    <div v-else-if="msg.extra?.images?.[idx]?.loading" class="chat-image-loading">
                      <div class="spinner"></div>
                      <span>正在生成...</span>
                    </div>

                    <div v-else class="chat-image-trigger" @click.stop="handleGenerateImage(msg, seg.prompt!, idx)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>点击生成图片</span>
                    </div>
                  </div>
                </template>
              </div>
              <span class="msg-time">{{ formatMsgTime(msg.created_at) }}</span>
            </div>

            <!-- User avatar -->
            <div class="msg-avatar" v-if="msg.role === 'user'">
              <span class="avatar-fallback user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
              </span>
            </div>
          </div>
        </TransitionGroup>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="message-row is-assistant">
          <div class="msg-avatar">
            <img v-if="characterAvatar" :src="characterAvatar" class="avatar-img" />
            <span v-else class="avatar-fallback">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
            </span>
          </div>
          <div class="msg-bubble assistant typing-bubble">
            <div v-if="streamingText" class="msg-text">
              <template v-for="(seg, idx) in parseMessageContent(streamingText)" :key="idx">
                <span v-if="seg.type === 'text'" style="white-space: pre-wrap;">{{ seg.content }}</span>
                <span v-else class="chat-image-streaming-hint">[收到生图指令...]</span>
              </template>
            </div>
            <div v-else class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reply Bar -->
    <div v-if="replyingTo" class="reply-bar">
      <div class="reply-bar-content">
        <span class="reply-bar-label">回复 {{ replyingTo.role === 'user' ? '我' : chatTitle }}</span>
        <span class="reply-bar-text">{{ truncateText(replyingTo.content, 50) }}</span>
      </div>
      <button class="reply-bar-close" @click="replyingTo = null">✕</button>
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
          class="action-menu-btn"
          :disabled="isTyping"
          @click="showActionMenu = !showActionMenu"
          title="更多操作"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

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

      <!-- Action Menu -->
      <Transition name="action-menu">
        <div v-if="showActionMenu" class="action-menu-popup">
          <button class="action-menu-item" @click="handleWaitReply">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>等待回复</span>
          </button>
          <button class="action-menu-item" @click="handleRoll">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Roll (重新生成)</span>
          </button>
          <button class="action-menu-item" @click="openTransferModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="3"/>
              <path d="M2 10h20"/>
              <path d="M6 16h4"/>
            </svg>
            <span>转账</span>
          </button>
          <button class="action-menu-item" @click="openRedPacketModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="1" width="18" height="22" rx="3"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>红包</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Transfer Modal -->
    <Transition name="modal-fade">
      <div v-if="showTransferModal" class="modal-overlay" @click.self="showTransferModal = false">
        <div class="payment-modal">
          <div class="payment-modal-header">
            <span class="payment-modal-title">转账</span>
            <button class="payment-close-btn" @click="showTransferModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="payment-modal-body">
            <div class="payment-target">
              转账给 <strong>{{ chatTitle }}</strong>
            </div>
            <div class="payment-amount-input">
              <span class="payment-currency">¥</span>
              <input
                ref="transferAmountRef"
                v-model="transferAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                class="amount-input"
              />
            </div>
            <div class="payment-balance">余额：¥{{ walletStore.balance.toFixed(2) }}</div>
            <div class="payment-note-row">
              <input
                v-model="transferNote"
                type="text"
                placeholder="添加转账说明"
                class="note-input"
                maxlength="30"
              />
            </div>
            <button
              class="payment-confirm-btn transfer-confirm"
              :disabled="!isTransferValid"
              @click="confirmTransfer"
            >
              确认转账
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Red Packet Modal -->
    <Transition name="modal-fade">
      <div v-if="showRedPacketModal" class="modal-overlay" @click.self="showRedPacketModal = false">
        <div class="payment-modal rp-modal">
          <div class="payment-modal-header rp-header">
            <span class="payment-modal-title">发红包</span>
            <button class="payment-close-btn" @click="showRedPacketModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="payment-modal-body">
            <div class="payment-amount-input">
              <span class="payment-currency rp-currency">¥</span>
              <input
                ref="rpAmountRef"
                v-model="rpAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                class="amount-input"
              />
            </div>
            <div class="payment-balance">余额：¥{{ walletStore.balance.toFixed(2) }}</div>
            <div class="payment-note-row">
              <input
                v-model="rpNote"
                type="text"
                placeholder="恭喜发财，大吉大利"
                class="note-input"
                maxlength="30"
              />
            </div>
            <button
              class="payment-confirm-btn rp-confirm"
              :disabled="!isRpValid"
              @click="confirmRedPacket"
            >
              塞钱进红包
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Red Packet Open Animation -->
    <Transition name="modal-fade">
      <div v-if="showRpOpenResult" class="modal-overlay" @click.self="showRpOpenResult = false">
        <div class="rp-open-result">
          <div class="rp-open-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <rect x="8" y="2" width="48" height="60" rx="8" fill="#E6162D"/>
              <rect x="8" y="2" width="48" height="26" rx="8" fill="#CC1228"/>
              <circle cx="32" cy="28" r="10" fill="#FFD700"/>
              <path d="M32 22v12M26 28h12" stroke="#E6162D" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="rp-open-sender">{{ rpOpenSender }} 的红包</div>
          <div class="rp-open-amount">¥{{ rpOpenAmount.toFixed(2) }}</div>
          <button class="rp-open-close" @click="showRpOpenResult = false">知道了</button>
        </div>
      </div>
    </Transition>

    <!-- Info Panel -->
    <div v-if="showInfo" class="info-overlay" @click.self="showInfo = false">
      <div class="info-panel">
        <div class="info-header">
          <h3>聊天信息</h3>
          <span class="close-btn" @click="showInfo = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </span>
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
            <button class="info-action-btn" @click="clearChat">清空聊天记录</button>
            <button class="info-action-btn" @click="regenerateLast">重新生成最后回复</button>
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
import { useWalletStore } from '@/stores/wallet'
import type { ChatMessage } from '@/stores/chat'
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
import { generateImageFromPrompt, isChatAutoImageGenEnabled } from '@/utils/imageGenService'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const walletStore = useWalletStore()

const messagesRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const transferAmountRef = ref<HTMLInputElement | null>(null)
const rpAmountRef = ref<HTMLInputElement | null>(null)
const inputText = ref('')
const isTyping = ref(false)
const streamingText = ref('')
const showInfo = ref(false)
const showEmojiPanel = ref(false)
const showActionMenu = ref(false)
const matchedWorldBookCount = ref(0)
const replyingTo = ref<{ role: string; content: string } | null>(null)
let abortController: AbortController | null = null

function startReply(msg: any) {
  replyingTo.value = { role: msg.role, content: msg.content }
  inputRef.value?.focus()
}

interface MsgSegment {
  type: 'text' | 'image-prompt'
  content: string
  prompt?: string
}

function parseMessageContent(content: string): MsgSegment[] {
  if (!content) return []
  const regex = /<img\s+prompt="([^"]+)">/g
  let lastIndex = 0
  const segments: MsgSegment[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'image-prompt', content: match[0], prompt: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) })
  }
  return segments
}

async function handleGenerateImage(msg: ChatMessage, prompt: string, index: number) {
  if (!msg.extra) {
    msg.extra = {}
  }
  if (!(msg.extra as any).images) {
    (msg.extra as any).images = {}
  }
  
  if ((msg.extra as any).images[index]?.loading || (msg.extra as any).images[index]?.url) {
    return
  }

  (msg.extra as any).images[index] = { loading: true, url: '', prompt }
  chatStore.saveMessages(conversationId.value!)
  scrollToBottom()

  try {
    const resUrl = await generateImageFromPrompt(prompt)
    ;(msg.extra as any).images[index] = { loading: false, url: resUrl, prompt }
  } catch (err: any) {
    ;(msg.extra as any).images[index] = { loading: false, url: '', error: err.message || '生图失败', prompt }
  }
  chatStore.saveMessages(conversationId.value!)
  scrollToBottom()
}

function previewImage(url: string) {
  if (url) {
    if (url.startsWith('data:image')) {
      const win = window.open()
      if (win) {
        win.document.write(`<body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;"></body>`)
      }
    } else {
      window.open(url, '_blank')
    }
  }
}

function truncateText(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

// Transfer/Red Packet modals
const showTransferModal = ref(false)
const transferAmount = ref<number | string>('')
const transferNote = ref('')

const showRedPacketModal = ref(false)
const rpAmount = ref<number | string>('')
const rpNote = ref('')

// Red Packet open result
const showRpOpenResult = ref(false)
const rpOpenAmount = ref(0)
const rpOpenSender = ref('')

const isTransferValid = computed(() => {
  const amt = Number(transferAmount.value)
  return amt > 0 && amt <= walletStore.balance
})

const isRpValid = computed(() => {
  const amt = Number(rpAmount.value)
  return amt > 0 && amt <= walletStore.balance
})

const conversationId = computed(() => {
  const id = route.params.friendId || route.params.id
  return id ? String(id) : null
})

// 获取当前角色
const currentCharacter = computed((): CharacterData | null => {
  const conv = chatStore.currentConversation
  if (!conv) return null
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

const activePresetName = computed(() => {
  const preset = getActivePreset()
  return preset?.name || ''
})

const userPersonaName = computed(() => {
  const persona = getCurrentUserPersona()
  return persona?.name || ''
})

// Helpers for extra data
function getTransferExtra(msg: ChatMessage) {
  return (msg.extra || {}) as { transferId?: string; amount?: number; note?: string; accepted?: boolean }
}

function getRedPacketExtra(msg: ChatMessage) {
  return (msg.extra || {}) as { rpId?: string; amount?: number; note?: string; opened?: boolean; sender?: string }
}

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

function handleScroll() {}

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

// === Transfer ===
function openTransferModal() {
  showActionMenu.value = false
  transferAmount.value = ''
  transferNote.value = ''
  showTransferModal.value = true
  nextTick(() => transferAmountRef.value?.focus())
}

function confirmTransfer() {
  if (!conversationId.value || !isTransferValid.value) return

  const amt = Number(transferAmount.value)
  const note = transferNote.value.trim() || '转账'
  const targetName = chatTitle.value

  const tf = walletStore.sendTransfer(amt, note, conversationId.value, targetName)
  if (!tf) return

  showTransferModal.value = false

  // Add transfer message (user)
  const msg: ChatMessage = {
    id: `user-tf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversation_id: conversationId.value,
    role: 'user',
    content: `[转账] ¥${amt.toFixed(2)} - ${note}`,
    msg_type: 'transfer',
    extra: { transferId: tf.id, amount: amt, note, accepted: false },
    created_at: new Date().toISOString(),
    timestamp: Date.now(),
  }
  chatStore.currentMessages.push(msg)
  chatStore.saveMessages(conversationId.value)

  // Update conversation preview
  const conv = chatStore.conversations.find((c: any) => c.id === conversationId.value)
  if (conv) {
    conv.last_message = `[转账] ¥${amt.toFixed(2)}`
    conv.last_at = msg.created_at
    chatStore.saveConversations()
  }

  scrollToBottom()

  // Trigger AI reply with transfer context
  triggerAIReplyWithContext(`[用户给你转了 ${amt.toFixed(2)} 元，备注：${note}，请自然地回应收到转账]`)

  // Mark transfer as accepted after AI processes it
  setTimeout(() => {
    const targetMsg = chatStore.currentMessages.find((m: ChatMessage) => m.id === msg.id)
    if (targetMsg && targetMsg.extra) {
      (targetMsg.extra as any).accepted = true
      chatStore.saveMessages(conversationId.value!)
    }
    walletStore.acceptTransfer(tf.id)
  }, 3000)
}

// === Red Packet ===
function openRedPacketModal() {
  showActionMenu.value = false
  rpAmount.value = ''
  rpNote.value = ''
  showRedPacketModal.value = true
  nextTick(() => rpAmountRef.value?.focus())
}

function confirmRedPacket() {
  if (!conversationId.value || !isRpValid.value) return

  const amt = Number(rpAmount.value)
  const note = rpNote.value.trim() || '恭喜发财，大吉大利'

  const rp = walletStore.sendRedPacket(amt, note, conversationId.value)
  if (!rp) return

  showRedPacketModal.value = false

  // Add red packet message (user)
  const msg: ChatMessage = {
    id: `user-rp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversation_id: conversationId.value,
    role: 'user',
    content: `[红包] ${note}`,
    msg_type: 'redpacket',
    extra: { rpId: rp.id, amount: amt, note, opened: false, sender: 'user' },
    created_at: new Date().toISOString(),
    timestamp: Date.now(),
  }
  chatStore.currentMessages.push(msg)
  chatStore.saveMessages(conversationId.value)

  const conv = chatStore.conversations.find((c: any) => c.id === conversationId.value)
  if (conv) {
    conv.last_message = `[红包] ${note}`
    conv.last_at = msg.created_at
    chatStore.saveConversations()
  }

  scrollToBottom()

  // Trigger AI reply - AI "opens" the red packet
  triggerAIReplyWithContext(`[用户发了一个 ${amt.toFixed(2)} 元的红包，祝福语：${note}，请自然地回应并表示收到了红包]`)

  // Mark as opened by AI after a delay
  setTimeout(() => {
    const targetMsg = chatStore.currentMessages.find((m: ChatMessage) => m.id === msg.id)
    if (targetMsg && targetMsg.extra) {
      (targetMsg.extra as any).opened = true
      chatStore.saveMessages(conversationId.value!)
    }
  }, 3000)
}

// Handle clicking on transfer card (AI's transfer - user accepts)
function handleTransferClick(msg: ChatMessage) {
  if (msg.role !== 'assistant') return
  const extra = getTransferExtra(msg)
  if (extra.accepted) return

  // Accept the transfer
  if (extra.transferId) {
    walletStore.acceptTransfer(extra.transferId)
  }
  // Add amount to balance
  if (extra.amount) {
    walletStore.topUp(extra.amount)
  }
  ;(msg.extra as any).accepted = true
  if (conversationId.value) {
    chatStore.saveMessages(conversationId.value)
  }
}

// Handle clicking on red packet card (AI's red packet - user opens)
function handleRedPacketClick(msg: ChatMessage) {
  if (msg.role !== 'assistant') return
  const extra = getRedPacketExtra(msg)
  if (extra.opened) return

  const amount = extra.amount || 0
  if (amount <= 0) return

  // Open the red packet
  ;(msg.extra as any).opened = true
  if (conversationId.value) {
    chatStore.saveMessages(conversationId.value)
  }

  // Add to balance
  walletStore.topUp(amount)

  // Show open result
  rpOpenAmount.value = amount
  rpOpenSender.value = extra.sender || chatTitle.value
  showRpOpenResult.value = true
}

// 构建消息历史给 AI
function buildMessageHistory(extraSystemHint?: string): AIMessage[] {
  const character = currentCharacter.value

  const contextLimit = settingsStore.settings.contextSize || 20

  const recent: AIMessage[] = chatStore.currentMessages
    .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
    .slice(-contextLimit)
    .map((m: ChatMessage) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // If there's an extra system hint (transfer/redpacket context), append it
  if (extraSystemHint) {
    recent.push({
      role: 'user',
      content: extraSystemHint,
    })
  }

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

  const extra: Record<string, any> = {}
  if (replyingTo.value) {
    extra.replyTo = { role: replyingTo.value.role, content: replyingTo.value.content }
    replyingTo.value = null
  }
  chatStore.addMessage(conversationId.value, 'user', text, undefined, Object.keys(extra).length > 0 ? extra : undefined)
  scrollToBottom()

  const s = settingsStore.settings
  if (!s.apiKey) {
    chatStore.addMessage(conversationId.value, 'assistant', '请先在设置中配置 API Key 才能和我聊天')
    scrollToBottom()
    return
  }

  await doAIReply()
}

async function doAIReply(extraSystemHint?: string) {
  if (!conversationId.value) return

  const s = settingsStore.settings
  if (!s.apiKey) return

  const startMsgLength = chatStore.currentMessages.length

  isTyping.value = true
  streamingText.value = ''
  abortController = new AbortController()

  try {
    const aiMessages = buildMessageHistory(extraSystemHint)

    // Update world book count
    const character = currentCharacter.value
    const allEntries = getCharacterWorldBookEntries(character?.id, character?.worldBooks)
    const contextLimit = settingsStore.settings.contextSize || 20
    const recentText = chatStore.currentMessages
      .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
      .slice(-contextLimit)
      .map((m: ChatMessage) => m.content)
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
      chatStore.addMessage(
        conversationId.value!,
        'assistant',
        '(AI 没有返回文本内容，可能是模型拒答/上下文过长/流式异常，请重试或切换模型)'
      )
      scrollToBottom()
      return
    }

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

    // --- 自动生图逻辑 ---
    if (isChatAutoImageGenEnabled()) {
      const finalMsgs = chatStore.currentMessages
      const newMsgs = finalMsgs.slice(startMsgLength)
      for (const addedMsg of newMsgs) {
        if (addedMsg.role === 'assistant') {
          const contentSegments = parseMessageContent(addedMsg.content)
          contentSegments.forEach((seg, idx) => {
            if (seg.type === 'image-prompt' && seg.prompt) {
              handleGenerateImage(addedMsg, seg.prompt, idx)
            }
          })
        }
      }
    }
  } catch (err: any) {
    isTyping.value = false
    streamingText.value = ''

    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      return
    }

    chatStore.addMessage(conversationId.value!, 'assistant', `AI 回复失败：${err.message}`)
    scrollToBottom()
  } finally {
    abortController = null
  }
}

async function triggerAIReplyWithContext(contextHint: string) {
  if (!conversationId.value) return

  const s = settingsStore.settings
  if (!s.apiKey) {
    chatStore.addMessage(conversationId.value, 'assistant', '请先在设置中配置 API Key')
    scrollToBottom()
    return
  }

  await doAIReply(contextHint)
}

function clearChat() {
  if (!conversationId.value) return
  if (!confirm('确定要清空所有聊天记录吗？')) return

  chatStore.currentMessages.splice(0)
  chatStore.saveMessages(conversationId.value)

  const char = currentCharacter.value
  if (char?.firstMessage) {
    chatStore.addMessage(conversationId.value, 'assistant', char.firstMessage)
  }

  showInfo.value = false
  scrollToBottom(false)
}

function handleWaitReply() {
  showActionMenu.value = false
  triggerAIReplyWithContext('')
}

function handleRoll() {
  showActionMenu.value = false
  regenerateLast()
}

async function regenerateLast() {
  if (!conversationId.value) return
  
  const msgs = chatStore.currentMessages
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'assistant') {
      msgs.splice(i, 1)
      break
    }
  }
  chatStore.saveMessages(conversationId.value)
  showInfo.value = false

  const lastUserMsg = [...msgs].reverse().find((m: ChatMessage) => m.role === 'user')
  if (!lastUserMsg) return

  const s = settingsStore.settings
  if (!s.apiKey) return

  await doAIReply()
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

.avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--fill-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-fallback svg {
  width: 22px;
  height: 22px;
  color: var(--text-tertiary);
}

.avatar-fallback.user-avatar {
  background: var(--brand-primary, #007aff);
}

.avatar-fallback.user-avatar svg {
  color: #fff;
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

/* === Transfer Card === */
.transfer-card {
  width: 240px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
}

.transfer-card:active {
  transform: scale(0.97);
}

.transfer-card.user {
  background: linear-gradient(135deg, #5B6EF5, #8B5CF6);
  color: #fff;
}

.transfer-card.assistant {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.transfer-card-body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.transfer-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.transfer-card.user .transfer-icon {
  background: rgba(255, 255, 255, 0.2);
}

.transfer-card.assistant .transfer-icon {
  background: linear-gradient(135deg, #5B6EF5, #8B5CF6);
}

.transfer-icon svg {
  width: 22px;
  height: 22px;
}

.transfer-info {
  flex: 1;
  min-width: 0;
}

.transfer-amount {
  font-size: 20px;
  font-weight: 700;
}

.transfer-note {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transfer-footer {
  padding: 8px 16px;
  font-size: 12px;
  opacity: 0.7;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.transfer-card.assistant .transfer-footer {
  border-top-color: var(--separator);
}

.transfer-card .msg-time {
  padding: 0 16px 8px;
  font-size: 11px;
  opacity: 0.5;
}

/* === Red Packet Card === */
.redpacket-card {
  width: 240px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
  background: linear-gradient(135deg, #E6162D, #FF4757);
  color: #fff;
}

.redpacket-card:active {
  transform: scale(0.97);
}

.redpacket-card.opened {
  opacity: 0.75;
}

.rp-card-body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.rp-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rp-icon svg {
  width: 28px;
  height: 28px;
}

.rp-info {
  flex: 1;
  min-width: 0;
}

.rp-note {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
}

.rp-status {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 4px;
}

.rp-footer {
  padding: 8px 16px;
  font-size: 12px;
  opacity: 0.7;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.rp-time {
  padding: 0 16px 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
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
  position: relative;
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

.close-btn svg {
  width: 16px;
  height: 16px;
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

/* Action Menu Button */
.action-menu-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--fill-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.action-menu-btn:active { background: var(--bg-tertiary); transform: scale(0.9); }
.action-menu-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-menu-btn svg { width: 20px; height: 20px; }

/* Action Menu Popup */
.action-menu-popup {
  position: absolute;
  bottom: 56px;
  right: 48px;
  background: var(--bg-primary);
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  min-width: 170px;
  z-index: 10;
  border: 0.5px solid var(--separator);
}

.action-menu-item {
  width: 100%;
  padding: 13px 16px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.action-menu-item + .action-menu-item {
  border-top: 0.5px solid var(--separator);
}

.action-menu-item:active {
  background: var(--fill-tertiary);
}

.action-menu-item svg {
  width: 20px;
  height: 20px;
  color: var(--brand-primary, #007aff);
  flex-shrink: 0;
}

.action-menu-item span {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

/* Action Menu Transition */
.action-menu-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.action-menu-leave-active {
  transition: all 0.15s ease-in;
}
.action-menu-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}
.action-menu-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
}

/* === Payment Modal === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-modal {
  width: 320px;
  background: var(--bg-primary);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.payment-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #5B6EF5, #8B5CF6);
  color: #fff;
}

.rp-header {
  background: linear-gradient(135deg, #E6162D, #FF4757);
}

.payment-modal-title {
  font-size: 18px;
  font-weight: 600;
}

.payment-close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}

.payment-close-btn svg {
  width: 16px;
  height: 16px;
}

.payment-modal-body {
  padding: 24px 20px;
}

.payment-target {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-align: center;
}

.payment-target strong {
  color: var(--text-primary);
}

.payment-amount-input {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.payment-currency {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.rp-currency {
  color: #E6162D;
}

.amount-input {
  width: 160px;
  border: none;
  border-bottom: 2px solid var(--separator);
  background: none;
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  outline: none;
  padding: 4px 0;
  font-family: inherit;
  -moz-appearance: textfield;
}

.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.amount-input:focus {
  border-bottom-color: var(--brand-primary, #007aff);
}

.payment-balance {
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.payment-note-row {
  margin-bottom: 20px;
}

.note-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--separator);
  background: none;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  padding: 8px 0;
  font-family: inherit;
}

.note-input::placeholder {
  color: var(--text-quaternary);
}

.payment-confirm-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.transfer-confirm {
  background: linear-gradient(135deg, #5B6EF5, #8B5CF6);
}

.rp-confirm {
  background: linear-gradient(135deg, #E6162D, #FF4757);
}

.payment-confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.payment-confirm-btn:active:not(:disabled) {
  transform: scale(0.97);
}

/* === Red Packet Open Result === */
.rp-open-result {
  width: 280px;
  background: linear-gradient(180deg, #E6162D 0%, #CC1228 50%, var(--bg-primary) 50%, var(--bg-primary) 100%);
  border-radius: 20px;
  overflow: hidden;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.rp-open-icon {
  padding: 30px 0 10px;
}

.rp-open-icon svg {
  width: 64px;
  height: 64px;
}

.rp-open-sender {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.rp-open-amount {
  font-size: 40px;
  font-weight: 700;
  color: #E6162D;
  padding: 20px 0;
}

.rp-open-close {
  width: calc(100% - 40px);
  margin: 0 20px 20px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: var(--fill-tertiary);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.rp-open-close:active {
  opacity: 0.7;
}

/* Modal Transition */
.modal-fade-enter-active {
  transition: all 0.25s ease-out;
}
.modal-fade-leave-active {
  transition: all 0.2s ease-in;
}
.modal-fade-enter-from {
  opacity: 0;
}
.modal-fade-enter-from .payment-modal,
.modal-fade-enter-from .rp-open-result {
  transform: scale(0.9) translateY(20px);
}
.modal-fade-leave-to {
  opacity: 0;
}

/* Message transition */
.msg-enter-active { transition: all 0.3s var(--ease-ios); }
.msg-enter-from { opacity: 0; transform: translateY(10px); }

/* Reply bar above input */
.reply-bar { display: flex; align-items: center; padding: 8px 16px; background: var(--fill-tertiary); border-top: 0.5px solid var(--separator); gap: 8px; }
.reply-bar-content { flex: 1; min-width: 0; border-left: 3px solid var(--brand-primary); padding-left: 8px; }
.reply-bar-label { font-size: 12px; font-weight: 600; color: var(--brand-primary); display: block; }
.reply-bar-text { font-size: 13px; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.reply-bar-close { background: none; border: none; font-size: 16px; color: var(--text-tertiary); cursor: pointer; padding: 4px; }

/* Inline reply quote inside message bubble */
.reply-quote-inline { padding: 6px 8px; margin-bottom: 4px; background: rgba(0,0,0,0.06); border-radius: 6px; border-left: 2px solid var(--brand-primary); }
.rqi-name { font-size: 11px; font-weight: 600; color: var(--brand-primary); display: block; }
.rqi-text { font-size: 12px; color: var(--text-tertiary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Chat Image Styles */
.chat-image-block {
  margin: 4px 0;
  max-width: 240px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.chat-generated-image {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid var(--separator);
  object-fit: cover;
}

.chat-image-trigger,
.chat-image-loading,
.chat-image-error {
  min-height: 100px;
  background: var(--bg-primary);
  border: 1px dashed var(--separator);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin-top: 4px;
}

.chat-image-trigger svg {
  width: 24px;
  height: 24px;
  stroke: var(--brand-primary, #007aff);
}

.chat-image-error {
  color: var(--danger, #ff3b30);
  border-color: var(--danger-light, #ff3b30);
}

.chat-image-error svg {
  width: 24px;
  height: 24px;
}

.chat-image-streaming-hint {
  color: var(--text-secondary);
  font-style: italic;
  font-size: 13px;
  margin-left: 4px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color, #eee);
  border-top-color: var(--brand-primary, #007aff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
