import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCharacterById } from '@/utils/aiService'
import type { CharacterData } from '@/utils/aiService'

export interface Character {
  id: string
  type?: string
  name: string
  avatar?: string
  avatar_url?: string
  description?: string
  persona?: string
  scenario?: string
  firstMessage?: string
  exampleDialogue?: string
  worldBooks?: string[]
  personality?: string
  system_prompt?: string
  greeting?: string
  is_public?: boolean
  tags?: string[]
}

export interface Conversation {
  id: string
  characterId: string
  title: string
  is_group: boolean
  last_message: string
  last_at: string
  character?: Character | null
  unread?: number
  createdAt: string
  groupMemberIds?: string[]
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  msg_type: string
  extra: Record<string, any>
  created_at: string
  timestamp: number
}

const CONV_STORAGE_KEY = 'chat-conversations'

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const characters = ref<Character[]>([])
  const currentMessages = ref<ChatMessage[]>([])
  const currentConversationId = ref<string | null>(null)
  const loading = ref(false)

  // Getters
  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      return new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
    })
  })

  const currentConversation = computed(() => {
    return conversations.value.find(c => c.id === currentConversationId.value) || null
  })

  // localStorage helpers
  function loadConversations() {
    try {
      const saved = localStorage.getItem(CONV_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          conversations.value = parsed
          // 恢复角色信息
          for (const conv of conversations.value) {
            if (conv.characterId && !conv.character) {
              const char = getCharacterById(conv.characterId)
              if (char) {
                conv.character = char as Character
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  function saveConversations() {
    try {
      // 保存时不保存完整角色对象，只保存 characterId
      const toSave = conversations.value.map(c => ({
        ...c,
        character: c.character ? {
          id: c.character.id,
          name: c.character.name,
          avatar: c.character.avatar || c.character.avatar_url,
          description: c.character.description,
        } : null,
      }))
      localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(toSave))
    } catch {
      // ignore
    }
  }

  function loadMessages(conversationId: string) {
    currentConversationId.value = conversationId
    try {
      const key = `chat-messages-${conversationId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        currentMessages.value = JSON.parse(saved)
      } else {
        currentMessages.value = []
      }
    } catch {
      currentMessages.value = []
    }
  }

  function saveMessages(conversationId: string) {
    try {
      const key = `chat-messages-${conversationId}`
      // 只保留最近200条
      const toSave = currentMessages.value.slice(-200)
      localStorage.setItem(key, JSON.stringify(toSave))
    } catch {
      // ignore
    }
  }

  // Actions
  function fetchConversations() {
    loadConversations()
  }

  function fetchCharacters() {
    try {
      const saved = localStorage.getItem('characters')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          characters.value = parsed.filter((c: any) => c.type === 'char')
        }
      }
    } catch {
      // ignore
    }
  }

  function fetchMessages(conversationId: string | number) {
    loadMessages(String(conversationId))
  }

  function addMessage(conversationId: string, role: 'user' | 'assistant', content: string, msgType?: string, extra?: Record<string, unknown>): ChatMessage {
    const msg: ChatMessage = {
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversation_id: conversationId,
      role,
      content,
      msg_type: msgType || 'text',
      extra: extra || {},
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
    }
    currentMessages.value.push(msg)
    saveMessages(conversationId)

    // 更新会话预览
    const conv = conversations.value.find(c => c.id === conversationId)
    if (conv) {
      conv.last_message = content.slice(0, 50)
      conv.last_at = msg.created_at
      saveConversations()
    }

    return msg
  }

  function sendMessage(conversationId: string | number, content: string) {
    addMessage(String(conversationId), 'user', content)
  }

  function createConversation(characterId: string | number): Conversation {
    const charIdStr = String(characterId)

    // 检查是否已有该角色的会话
    const existing = conversations.value.find(c => c.characterId === charIdStr)
    if (existing) {
      return existing
    }

    // 获取角色信息
    const char = getCharacterById(charIdStr)
    const charName = char?.name || '未命名角色'

    const conv: Conversation = {
      id: `conv-${Date.now()}`,
      characterId: charIdStr,
      title: charName,
      is_group: false,
      last_message: char?.firstMessage || '开始聊天吧~',
      last_at: new Date().toISOString(),
      character: char as Character | null,
      unread: 0,
      createdAt: new Date().toISOString(),
    }

    conversations.value.unshift(conv)
    saveConversations()

    // 如果角色有开场白，保存为第一条消息
    if (char?.firstMessage) {
      currentConversationId.value = conv.id
      currentMessages.value = []
      addMessage(conv.id, 'assistant', char.firstMessage)
    }

    return conv
  }

  function createGroupConversation(name: string, memberIds: string[]): Conversation {
    const now = new Date().toISOString()
    const conv: Conversation = {
      id: `group-${Date.now()}`,
      characterId: '',
      title: name || '群聊',
      is_group: true,
      last_message: '群聊已创建',
      last_at: now,
      character: null,
      unread: 0,
      createdAt: now,
      groupMemberIds: memberIds,
    }
    conversations.value.unshift(conv)
    saveConversations()
    return conv
  }

  function deleteConversation(id: string | number) {
    const idStr = String(id)
    conversations.value = conversations.value.filter(c => c.id !== idStr)
    saveConversations()

    // 删除消息
    try {
      localStorage.removeItem(`chat-messages-${idStr}`)
    } catch {
      // ignore
    }

    if (currentConversationId.value === idStr) {
      currentConversationId.value = null
      currentMessages.value = []
    }
  }

  function clearCurrentChat() {
    currentConversationId.value = null
    currentMessages.value = []
  }

  // 刷新会话中的角色信息
  function refreshConversationCharacters() {
    for (const conv of conversations.value) {
      if (conv.characterId) {
        const char = getCharacterById(conv.characterId)
        if (char) {
          conv.character = char as Character
          conv.title = char.name || conv.title
        }
      }
    }
    saveConversations()
  }

  return {
    // State
    conversations,
    characters,
    currentMessages,
    currentConversationId,
    loading,
    // Getters
    sortedConversations,
    currentConversation,
    // Actions
    fetchConversations,
    fetchCharacters,
    fetchMessages,
    sendMessage,
    addMessage,
    createConversation,
    createGroupConversation,
    deleteConversation,
    clearCurrentChat,
    refreshConversationCharacters,
    loadMessages,
    saveMessages,
    saveConversations,
  }
})
