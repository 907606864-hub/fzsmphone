<template>
  <div class="characters-page">
    <NavBar title="角色卡" :show-back="true" back-to="/">
      <template #right>
        <button class="nav-btn" @click="showAIBatchModal = true" title="AI批量创建">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" />
            <path d="M17.8 11.8L19 13" /><path d="M15 9h0" />
            <path d="M17.8 6.2L19 5" /><path d="M11 6.2L9.7 5" /><path d="M11 11.8L9.7 13" />
            <path d="M3 21l9-9" /><path d="M12.2 6.8l2 2" />
          </svg>
        </button>
        <button class="nav-btn" @click="importCharacter" title="导入">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button class="nav-btn" @click="addCharacter" title="新建">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </template>
    </NavBar>

    <!-- 隐藏的文件选择器 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleFileImport"
      style="display: none"
    />

    <!-- Tab切换 -->
    <div class="segment-control">
      <button
        class="segment"
        :class="{ active: currentType === 'char' }"
        @click="currentType = 'char'"
      >
        角色
      </button>
      <button
        class="segment"
        :class="{ active: currentType === 'user' }"
        @click="currentType = 'user'"
      >
        用户
      </button>
    </div>

    <!-- AI批量创建弹窗 -->
    <div v-if="showAIBatchModal" class="modal-overlay" @click.self="closeAIBatchModal">
      <div class="ai-batch-panel">
        <div class="ai-batch-header">
          <h3>AI 批量创建角色</h3>
          <button class="close-btn" @click="closeAIBatchModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="ai-batch-body">
          <div class="form-group">
            <label>主题描述</label>
            <textarea
              v-model="aiBatchPrompt"
              rows="4"
              placeholder="描述你想要创建的角色主题，例如：&#10;- 一组来自中世纪奇幻世界的冒险者&#10;- 现代都市的几个性格迥异的大学生&#10;- 科幻太空站里的船员们"
              :disabled="aiBatchLoading"
            ></textarea>
          </div>
          <div class="form-group">
            <label>创建类型</label>
            <div class="type-selector">
              <button
                :class="{ active: aiBatchType === 'char' }"
                @click="aiBatchType = 'char'"
                :disabled="aiBatchLoading"
              >角色</button>
              <button
                :class="{ active: aiBatchType === 'user' }"
                @click="aiBatchType = 'user'"
                :disabled="aiBatchLoading"
              >用户</button>
            </div>
          </div>
          <div class="form-group">
            <label>生成数量</label>
            <div class="quantity-selector">
              <button @click="aiBatchCount = Math.max(1, aiBatchCount - 1)" :disabled="aiBatchLoading">-</button>
              <span>{{ aiBatchCount }}</span>
              <button @click="aiBatchCount = Math.min(10, aiBatchCount + 1)" :disabled="aiBatchLoading">+</button>
            </div>
          </div>
          <div v-if="aiBatchError" class="error-msg">{{ aiBatchError }}</div>
          <div v-if="aiBatchLoading" class="loading-state">
            <div class="spinner"></div>
            <span>AI 正在创建角色，请稍候...</span>
          </div>
        </div>
        <div class="ai-batch-footer">
          <button class="btn-cancel" @click="closeAIBatchModal" :disabled="aiBatchLoading">取消</button>
          <button class="btn-generate" @click="generateBatchCharacters" :disabled="aiBatchLoading || !aiBatchPrompt.trim()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
              <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" />
              <path d="M17.8 11.8L19 13" /><path d="M15 9h0" />
              <path d="M17.8 6.2L19 5" /><path d="M11 6.2L9.7 5" /><path d="M11 11.8L9.7 13" />
              <path d="M3 21l9-9" /><path d="M12.2 6.8l2 2" />
            </svg>
            生成
          </button>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="page-content">
      <!-- 空状态 -->
      <div v-if="filteredCharacters.length === 0" class="empty-state">
        <div class="empty-icon">{{ currentType === 'char' ? '🤖' : '👤' }}</div>
        <p>暂无{{ currentType === 'char' ? '角色' : '用户' }}卡</p>
        <span>点击右上角 + 创建，或导入角色卡</span>
      </div>

      <!-- 角色列表 -->
      <div v-else class="list-group">
        <div
          v-for="character in filteredCharacters"
          :key="character.id"
          class="list-item"
          @click="editCharacter(character)"
        >
          <div class="avatar">
            <img
              v-if="character.avatar && (character.avatar.startsWith('data:') || character.avatar.startsWith('http'))"
              :src="character.avatar"
              alt=""
            />
            <span v-else>{{ character.type === 'char' ? '🤖' : '👤' }}</span>
          </div>
          <div class="item-content">
            <h4>{{ character.name }}</h4>
            <p>{{ character.description || '暂无描述' }}</p>
          </div>
          <div class="item-actions">
            <!-- 开始聊天按钮（仅角色） -->
            <button v-if="character.type === 'char'" class="icon-btn chat-btn" @click.stop="startChat(character)" title="开始聊天">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <!-- 设为当前用户（仅用户类型） -->
            <button v-if="character.type === 'user'" class="icon-btn" :class="{ 'active-user': isCurrentUser(character.id) }" @click.stop="setAsCurrentUser(character)" title="设为当前身份">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path v-if="isCurrentUser(character.id)" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                <path v-else d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
            <button class="icon-btn edit-btn" @click.stop="editCharacter(character)" title="编辑">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>
            <button class="icon-btn danger" @click.stop="deleteCharacter(character.id)" title="删除">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import { sendAIRequest } from '@/utils/aiService'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settingsStore = useSettingsStore()

const currentType = ref('char')
const characters = ref<any[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const filteredCharacters = computed(() => {
  return characters.value.filter((c: any) => c.type === currentType.value)
})

const addCharacter = () => {
  router.push(`/character/edit/new?type=${currentType.value}`)
}

const importCharacter = () => {
  fileInput.value?.click()
}

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    let character: any = null

    // 支持酒馆 V3 格式
    if (data.spec === 'chara_card_v3' || data.spec_version === '3.0') {
      const charData = data.data || data
      character = {
        id: Date.now(),
        type: 'char',
        name: charData.name || data.name || '未命名角色',
        description: charData.description || data.description || '',
        avatar: '',
        persona: charData.personality || data.personality || '',
        scenario: charData.scenario || data.scenario || '',
        firstMessage: charData.first_mes || data.first_mes || '',
        exampleDialogue: charData.mes_example || data.mes_example || '',
        tags: charData.tags || data.tags || [],
        worldBooks: [],
      }
    }
    // 支持酒馆 V2 格式
    else if (data.spec === 'chara_card_v2') {
      const charData = data.data
      character = {
        id: Date.now(),
        type: 'char',
        name: charData.name || '未命名角色',
        description: charData.description || '',
        avatar: '',
        persona: charData.personality || charData.description || '',
        scenario: charData.scenario || '',
        firstMessage: charData.first_mes || '',
        exampleDialogue: charData.mes_example || '',
        tags: [],
        worldBooks: [],
      }
    }
    // 通用格式
    else if (data.name) {
      character = {
        id: Date.now(),
        type: 'char',
        name: data.name || '未命名角色',
        description: data.description || '',
        avatar: '',
        persona: data.personality || data.persona || data.description || '',
        scenario: data.scenario || '',
        firstMessage: data.first_mes || data.firstMessage || '',
        exampleDialogue: data.mes_example || data.exampleDialogue || '',
        tags: data.tags || [],
        worldBooks: [],
      }
    } else {
      throw new Error('不支持的角色卡格式')
    }

    characters.value.push(character)
    saveCharacters()
    alert(`成功导入角色：${character.name}`)
    target.value = ''
  } catch (error: any) {
    console.error('导入失败:', error)
    alert('导入失败：' + error.message)
    target.value = ''
  }
}

const editCharacter = (character: any) => {
  router.push(`/character/edit/${character.id}`)
}

const startChat = (character: any) => {
  // 直接跳转到聊天页，使用角色ID作为friendId
  router.push(`/chat/${character.id}`)
}

const isCurrentUser = (id: number): boolean => {
  const currentUserId = localStorage.getItem('currentUserCharId')
  return !!currentUserId && currentUserId === String(id)
}

const setAsCurrentUser = (character: any) => {
  localStorage.setItem('currentUserCharId', String(character.id))
  alert(`已设置「${character.name}」为当前用户身份`)
}

const deleteCharacter = (id: number) => {
  if (confirm('确定删除这个角色卡吗？')) {
    characters.value = characters.value.filter((c: any) => c.id !== id)
    saveCharacters()
  }
}

const saveCharacters = () => {
  localStorage.setItem('characters', JSON.stringify(characters.value))
}

const loadCharacters = () => {
  const saved = localStorage.getItem('characters')
  if (saved) characters.value = JSON.parse(saved)
}

// ======== AI 批量创建 ========
const showAIBatchModal = ref(false)
const aiBatchPrompt = ref('')
const aiBatchCount = ref(3)
const aiBatchType = ref('char')
const aiBatchLoading = ref(false)
const aiBatchError = ref('')

const closeAIBatchModal = () => {
  if (aiBatchLoading.value) return
  showAIBatchModal.value = false
  aiBatchError.value = ''
}

const generateBatchCharacters = async () => {
  if (!aiBatchPrompt.value.trim()) return

  const apiKey = settingsStore.settings.apiKey
  const apiUrl = settingsStore.getApiUrl()
  const model = settingsStore.settings.model

  if (!apiKey || !apiUrl || !model) {
    aiBatchError.value = '请先在设置中配置 API Key、API 地址和模型'
    return
  }

  aiBatchLoading.value = true
  aiBatchError.value = ''

  const typeLabel = aiBatchType.value === 'char' ? '角色' : '用户角色'

  try {
    const result = await sendAIRequest({
      apiKey,
      apiUrl,
      model,
      messages: [
        {
          role: 'system',
          content: `你是一个角色创作助手。用户会给你一个主题描述，你需要根据描述创建${aiBatchCount.value}个${typeLabel}卡。

请严格按照以下 JSON 数组格式输出，不要输出任何其他内容：
[
  {
    "name": "角色名",
    "description": "一句话简介",
    "persona": "详细的人设描述，包括性格、外貌、背景等",
    "scenario": "角色所处的场景或背景设定",
    "firstMessage": "角色的第一条打招呼消息（用角色口吻）",
    "exampleDialogue": "示例对话，展示角色说话风格",
    "tags": ["标签1", "标签2"]
  }
]

要求：
1. 每个角色都要独特，性格各异
2. 人设描述要丰富，至少100字
3. 第一条消息要符合角色性格
4. 示例对话要展现说话风格
5. 仅输出 JSON，不要有多余文字或 markdown 代码块标记`
        },
        {
          role: 'user',
          content: `主题：${aiBatchPrompt.value.trim()}\n数量：${aiBatchCount.value}个${typeLabel}`
        }
      ],
      temperature: 0.8,
      maxTokens: 4000,
      stream: false,
      timeout: settingsStore.settings.timeout || 120,
    })

    // 解析 JSON
    let parsed: any[]
    try {
      let content = result.content.trim()
      // 移除可能的 markdown 代码块标记
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      parsed = JSON.parse(content)
      if (!Array.isArray(parsed)) {
        throw new Error('返回格式不是数组')
      }
    } catch {
      aiBatchError.value = 'AI 返回的格式无法解析，请重试'
      aiBatchLoading.value = false
      return
    }

    // 创建角色卡
    const newCharacters = parsed.map((item: any) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      type: aiBatchType.value,
      name: item.name || '未命名',
      description: item.description || '',
      avatar: '',
      persona: item.persona || '',
      scenario: item.scenario || '',
      firstMessage: item.firstMessage || item.first_message || '',
      exampleDialogue: item.exampleDialogue || item.example_dialogue || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      worldBooks: [],
    }))

    characters.value.push(...newCharacters)
    saveCharacters()

    showAIBatchModal.value = false
    aiBatchPrompt.value = ''
    aiBatchError.value = ''
    alert(`成功创建 ${newCharacters.length} 个${typeLabel}`)
  } catch (err: any) {
    aiBatchError.value = err.message || 'AI 请求失败，请检查设置后重试'
  } finally {
    aiBatchLoading.value = false
  }
}

onMounted(() => loadCharacters())
</script>

<style scoped>
.characters-page {
  height: 100%;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
}

.nav-btn {
  display: flex;
  align-items: center;
  border: none;
  background: none;
  color: var(--brand-primary, #007aff);
  cursor: pointer;
  padding: 6px;
}

.nav-btn svg {
  width: 22px;
  height: 22px;
}

.segment-control {
  display: flex;
  margin: 12px 16px;
  background: var(--fill-tertiary, rgba(118, 118, 128, 0.12));
  border-radius: 9px;
  padding: 2px;
}

.segment {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.segment.active {
  background: var(--bg-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.page-content::-webkit-scrollbar { display: none; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50%;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-icon { font-size: 64px; margin-bottom: 16px; }

.empty-state p {
  font-size: 17px;
  margin: 0 0 8px;
  color: var(--text-secondary);
}

.empty-state span { font-size: 14px; }

.list-group {
  background: var(--bg-primary);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--separator, rgba(0, 0, 0, 0.1));
  cursor: pointer;
  transition: background 0.15s;
}

.list-item:last-child { border-bottom: none; }
.list-item:active { background: var(--fill-tertiary, rgba(0, 0, 0, 0.05)); }

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  overflow: hidden;
  margin-right: 12px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-content h4 {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 2px;
}

.item-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-actions {
  display: flex;
  gap: 6px;
  margin-left: 12px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  background: var(--fill-tertiary, rgba(0, 0, 0, 0.05));
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-btn:active { transform: scale(0.9); }

.icon-btn svg { width: 16px; height: 16px; }

.icon-btn.danger { color: #ff3b30; }
.icon-btn.chat-btn { color: var(--brand-primary, #007aff); }
.icon-btn.edit-btn { color: var(--color-orange, #ff9500); }
.icon-btn.active-user { color: var(--color-green, #34c759); background: rgba(52, 199, 89, 0.15); }

/* AI 批量创建弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.ai-batch-panel {
  width: 100%;
  max-width: 393px;
  max-height: 85%;
  background: var(--bg-primary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}

.ai-batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--separator, rgba(0,0,0,0.1));
}

.ai-batch-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: var(--fill-tertiary, rgba(118,118,128,0.12));
  border: none;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-btn svg { width: 16px; height: 16px; }

.ai-batch-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.ai-batch-body .form-group {
  margin-bottom: 16px;
}

.ai-batch-body .form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.ai-batch-body textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--separator, rgba(0,0,0,0.1));
  background: var(--fill-tertiary, rgba(118,118,128,0.12));
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
}

.ai-batch-body textarea:disabled {
  opacity: 0.5;
}

.type-selector {
  display: flex;
  gap: 0;
  background: var(--fill-tertiary, rgba(118,118,128,0.12));
  border-radius: 9px;
  padding: 2px;
}

.type-selector button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.type-selector button.active {
  background: var(--bg-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.type-selector button:disabled { opacity: 0.5; cursor: not-allowed; }

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quantity-selector button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--separator, rgba(0,0,0,0.1));
  background: var(--fill-tertiary, rgba(118,118,128,0.12));
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-selector button:disabled { opacity: 0.4; cursor: not-allowed; }
.quantity-selector button:active:not(:disabled) { background: var(--fill-secondary, rgba(118,118,128,0.24)); }

.quantity-selector span {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 30px;
  text-align: center;
}

.error-msg {
  padding: 10px 12px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 10px;
  color: #ff3b30;
  font-size: 13px;
  margin-top: 8px;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--fill-tertiary, rgba(118,118,128,0.12));
  border-top-color: var(--brand-primary, #007aff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-batch-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--separator, rgba(0,0,0,0.1));
}

.ai-batch-footer button {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.ai-batch-footer .btn-cancel {
  background: var(--fill-tertiary, rgba(118,118,128,0.12));
  color: var(--text-primary);
}

.ai-batch-footer .btn-generate {
  background: var(--brand-primary, #007aff);
  color: #fff;
}

.ai-batch-footer .btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-batch-footer .btn-icon {
  width: 18px;
  height: 18px;
}
</style>
