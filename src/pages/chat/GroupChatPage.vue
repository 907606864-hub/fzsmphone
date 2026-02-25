<template>
  <div class="group-chat-page">
    <NavBar title="群聊">
      <template #right>
        <button class="members-btn" @click="showMembers = !showMembers">
          👥 {{ members.length }}
        </button>
      </template>
    </NavBar>

    <!-- 消息列表 -->
    <div class="messages-area" ref="messagesRef">
      <div v-if="messages.length === 0" class="empty-chat">
        <span>💬</span>
        <p>群聊已创建，开始聊天吧~</p>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-row"
        :class="{ 'is-self': msg.role === 'user' }"
      >
        <div v-if="msg.role !== 'user'" class="msg-avatar">
          <span>{{ getMemberName(msg.role).charAt(0) }}</span>
        </div>
        <div class="msg-content">
          <span v-if="msg.role !== 'user'" class="msg-sender">{{ getMemberName(msg.role) }}</span>
          <div class="msg-bubble" :class="msg.role === 'user' ? 'bubble-self' : 'bubble-other'">
            {{ msg.content }}
          </div>
          <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
        </div>
        <div v-if="msg.role === 'user'" class="msg-avatar self-avatar">
          <span>我</span>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <div class="input-row">
        <input
          v-model="inputText"
          type="text"
          placeholder="发送消息..."
          class="chat-input"
          @keyup.enter="sendMessage"
        />
        <button class="send-btn" :disabled="!inputText.trim()" @click="sendMessage">
          发送
        </button>
      </div>
    </div>

    <!-- 成员面板 -->
    <div v-if="showMembers" class="members-overlay" @click.self="showMembers = false">
      <div class="members-panel">
        <div class="panel-header">
          <h3>群成员 ({{ members.length }})</h3>
          <button class="close-btn" @click="showMembers = false">✕</button>
        </div>
        <div class="members-list">
          <div v-for="member in members" :key="member.id" class="member-item">
            <div class="member-avatar" :style="{ background: member.color }">
              {{ member.name.charAt(0) }}
            </div>
            <div class="member-info">
              <span class="member-name">{{ member.name }}</span>
              <span class="member-role">{{ member.role }}</span>
            </div>
            <span v-if="member.isOwner" class="owner-badge">群主</span>
          </div>
        </div>

        <div class="panel-actions">
          <button class="action-btn add-btn" @click="showAddMember = true">
            ➕ 添加成员
          </button>
        </div>
      </div>
    </div>

    <!-- 添加成员弹窗 -->
    <div v-if="showAddMember" class="members-overlay" @click.self="showAddMember = false">
      <div class="members-panel">
        <div class="panel-header">
          <h3>添加角色到群聊</h3>
          <button class="close-btn" @click="showAddMember = false">✕</button>
        </div>
        <div v-if="availableCharacters.length === 0" class="empty-chars">
          <p>没有更多角色可添加</p>
        </div>
        <div v-else class="members-list">
          <div
            v-for="char in availableCharacters"
            :key="char.id"
            class="member-item clickable"
            @click="addMember(char)"
          >
            <div class="member-avatar">
              {{ char.name.charAt(0) }}
            </div>
            <div class="member-info">
              <span class="member-name">{{ char.name }}</span>
              <span class="member-role">{{ char.description?.slice(0, 30) || '角色' }}</span>
            </div>
            <span class="add-icon">+</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import { useChatStore, type Character } from '@/stores/chat'

interface GroupMember {
  id: string
  name: string
  role: string
  color: string
  isOwner: boolean
}

interface GroupMessage {
  id: number
  role: string
  content: string
  created_at: string
}

const route = useRoute()
const chatStore = useChatStore()
const groupId = route.params.groupId as string

const messages = ref<GroupMessage[]>([])
const inputText = ref('')
const showMembers = ref(false)
const showAddMember = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const memberColors = [
  'var(--accent-blue)',
  'var(--accent-purple)',
  'var(--accent-pink)',
  'var(--accent-orange)',
  'var(--accent-green)',
  '#e74c3c',
  '#1abc9c',
  '#f39c12',
]

const members = ref<GroupMember[]>([
  { id: '0', name: '我', role: '群主', color: 'var(--accent-blue)', isOwner: true },
])

const availableCharacters = computed(() => {
  const memberIds = new Set(members.value.map((m) => m.id))
  return chatStore.characters.filter((c) => !memberIds.has(String(c.id)))
})

onMounted(async () => {
  await chatStore.fetchCharacters()
  // 如果群里只有自己，自动添加前两个角色
  if (members.value.length === 1 && chatStore.characters.length > 0) {
    const toAdd = chatStore.characters.slice(0, 2)
    toAdd.forEach((c, i) => addMember(c))
  }
})

function addMember(char: Character) {
  const colorIdx = members.value.length % memberColors.length
  members.value.push({
    id: String(char.id),
    name: char.name,
    role: char.description?.slice(0, 20) || '角色',
    color: memberColors[colorIdx],
    isOwner: false,
  })
  showAddMember.value = false
}

function getMemberName(role: string): string {
  if (role === 'user') return '我'
  // role 存的是成员名
  return role
}

async function sendMessage() {
  if (!inputText.value.trim()) return
  const text = inputText.value.trim()
  inputText.value = ''

  // 添加用户消息
  const userMsg: GroupMessage = {
    id: Date.now(),
    role: 'user',
    content: text,
    created_at: new Date().toISOString(),
  }
  messages.value.push(userMsg)
  scrollToBottom()

  // 模拟群成员回复（随机1-3个成员回复）
  const otherMembers = members.value.filter((m) => m.id !== '0')
  if (otherMembers.length === 0) return

  const replyCount = Math.min(
    otherMembers.length,
    Math.floor(Math.random() * 3) + 1
  )
  const shuffled = [...otherMembers].sort(() => Math.random() - 0.5)
  const repliers = shuffled.slice(0, replyCount)

  for (let i = 0; i < repliers.length; i++) {
    await delay(800 + Math.random() * 1500)
    const reply: GroupMessage = {
      id: Date.now() + i,
      role: repliers[i].name,
      content: generateReply(repliers[i].name, text),
      created_at: new Date().toISOString(),
    }
    messages.value.push(reply)
    scrollToBottom()
  }
}

function generateReply(name: string, userMsg: string): string {
  const replies = [
    `嗯嗯，我觉得是这样的~`,
    `${userMsg.slice(0, 10)}...这个话题很有趣！`,
    `哈哈哈，说得对！`,
    `我也这么想的呢`,
    `嗯...让我想想`,
    `有道理！`,
    `真的吗？太棒了！`,
    `我有不同看法哦~`,
    `+1`,
    `了解了~`,
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.group-chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.members-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--accent-blue);
  cursor: pointer;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
}

.empty-chat span {
  font-size: 48px;
  margin-bottom: 8px;
}

.message-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-row.is-self {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-purple);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.self-avatar {
  background: var(--accent-blue);
}

.msg-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.is-self .msg-content {
  align-items: flex-end;
}

.msg-sender {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 2px;
  padding-left: 4px;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.bubble-other {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.bubble-self {
  background: var(--accent-blue);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-time {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
  padding: 0 4px;
}

/* 输入区 */
.input-area {
  padding: 8px 16px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.input-row {
  display: flex;
  gap: 8px;
}

.chat-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
}

.chat-input:focus {
  border-color: var(--accent-blue);
}

.send-btn {
  padding: 8px 18px;
  background: var(--accent-blue);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.4;
}

/* 成员面板 */
.members-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.members-panel {
  width: 100%;
  max-width: 393px;
  max-height: 70vh;
  background: var(--bg-secondary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.members-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.member-item:last-child {
  border-bottom: none;
}

.member-item.clickable {
  cursor: pointer;
  border-radius: 8px;
  padding: 10px 8px;
}

.member-item.clickable:active {
  background: var(--bg-tertiary);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-purple);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.member-role {
  font-size: 12px;
  color: var(--text-tertiary);
}

.owner-badge {
  font-size: 11px;
  color: var(--accent-orange);
  background: rgba(255, 149, 0, 0.12);
  padding: 2px 8px;
  border-radius: 10px;
}

.add-icon {
  font-size: 20px;
  color: var(--accent-blue);
  font-weight: 600;
}

.panel-actions {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
}

.add-btn {
  background: var(--accent-blue);
  color: #fff;
}

.empty-chars {
  padding: 30px 16px;
  text-align: center;
  color: var(--text-tertiary);
}
</style>
