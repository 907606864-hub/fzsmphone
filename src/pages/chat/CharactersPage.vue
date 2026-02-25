<template>
  <div class="characters-page">
    <NavBar title="角色卡" :show-back="true" back-to="/">
      <template #right>
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

const router = useRouter()

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
</style>
