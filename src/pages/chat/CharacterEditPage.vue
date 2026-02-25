<template>
  <div class="character-edit-page">
    <NavBar :title="isNew ? '新建角色卡' : '编辑角色卡'" :show-back="true" back-to="/characters">
      <template #right>
        <button class="save-btn" @click="saveCharacter" :disabled="!formData.name.trim()">保存</button>
      </template>
    </NavBar>

    <div class="edit-content">
      <!-- 头像上传 -->
      <div class="avatar-section">
        <div class="avatar-preview" @click="showAvatarInput = true">
          <img v-if="avatarPreview" :src="avatarPreview" alt="头像" />
          <div v-else class="avatar-placeholder">
            <span class="placeholder-icon">📷</span>
            <span>点击设置头像</span>
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileChange"
          style="display: none"
        />
        <div class="avatar-hint">推荐使用图床链接（避免卡顿）</div>
      </div>

      <!-- 头像输入弹窗 -->
      <div v-if="showAvatarInput" class="avatar-input-overlay" @click.self="showAvatarInput = false">
        <div class="avatar-input-modal">
          <div class="modal-header">
            <span>设置头像</span>
            <button class="close-btn" @click="showAvatarInput = false">✕</button>
          </div>
          <div class="modal-content">
            <div class="input-group">
              <label>图床链接（推荐）</label>
              <input
                v-model="avatarUrlInput"
                type="text"
                placeholder="粘贴图片链接，如 https://xxx.com/avatar.png"
                class="form-input"
              />
              <button class="confirm-url-btn" @click="confirmAvatarUrl">确认使用链接</button>
            </div>
            <div class="divider"><span>或</span></div>
            <div class="input-group">
              <button class="upload-local-btn" @click="triggerFileInput">📷 本地上传（可能卡顿）</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-section">
        <div class="form-group">
          <label>角色类型</label>
          <div class="type-selector">
            <button class="type-btn" :class="{ active: formData.type === 'char' }" @click="formData.type = 'char'">
              角色 (Char)
            </button>
            <button class="type-btn" :class="{ active: formData.type === 'user' }" @click="formData.type = 'user'">
              用户 (User)
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>名称 *</label>
          <input v-model="formData.name" type="text" placeholder="输入角色名称" class="form-input" />
        </div>

        <div class="form-group">
          <label>描述</label>
          <textarea v-model="formData.description" placeholder="角色的基本信息，如姓名、性别、年龄、身高等" class="form-textarea" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label>人设 (Personality / Persona)</label>
          <textarea v-model="formData.persona" placeholder="角色的性格特点、行为习惯、说话方式等&#10;例如：警惕、独立、冷静、聪慧、内心渴望温暖" class="form-textarea" rows="6"></textarea>
        </div>

        <div class="form-group">
          <label>场景 (Scenario)</label>
          <textarea v-model="formData.scenario" placeholder="角色所处的背景设定和情境&#10;例如：现代大学校园，你与角色的相遇会改变他封闭的世界" class="form-textarea" rows="4"></textarea>
        </div>

        <div v-if="formData.type === 'char'" class="form-group">
          <label>开场白 (First Message)</label>
          <textarea v-model="formData.firstMessage" placeholder="角色发送的第一条消息..." class="form-textarea" rows="3"></textarea>
        </div>

        <div v-if="formData.type === 'char'" class="form-group">
          <label>示例对话 (Example Dialogue)</label>
          <textarea v-model="formData.exampleDialogue" placeholder="示例对话格式：&#10;{{user}}: 你好&#10;{{char}}: 嗯，你来了..." class="form-textarea" rows="4"></textarea>
        </div>

        <!-- 用户身份设置 -->
        <div v-if="formData.type === 'user' && !isNew" class="form-group">
          <label>身份设置</label>
          <button class="set-active-btn" :class="{ active: isCurrentUser }" @click="setAsCurrentUser">
            {{ isCurrentUser ? '✓ 当前使用中' : '设为当前用户身份' }}
          </button>
          <div class="setting-hint">设置后，聊天时将使用该角色的头像和昵称</div>
        </div>

        <!-- 世界书绑定 -->
        <div class="form-group">
          <label>绑定世界书</label>
          <div class="worldbook-bind-section">
            <div v-if="formData.worldBooks && formData.worldBooks.length > 0" class="bound-worldbooks">
              <div v-for="wbId in formData.worldBooks" :key="wbId" class="bound-wb-item">
                <span>{{ getWorldBookName(wbId) }}</span>
                <button class="remove-wb-btn" @click="removeWorldBook(wbId)">×</button>
              </div>
            </div>
            <button class="add-wb-btn" @click="showWorldBookSelector = true">添加世界书</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 世界书选择器 -->
    <div v-if="showWorldBookSelector" class="selector-overlay" @click.self="showWorldBookSelector = false">
      <div class="selector-popup">
        <div class="selector-header">
          <div class="selector-title">选择世界书</div>
          <button class="selector-close" @click="showWorldBookSelector = false">×</button>
        </div>
        <div class="selector-content">
          <div v-if="worldBooks.length === 0" class="selector-empty">
            暂无世界书，请先创建世界书
          </div>
          <div
            v-for="wb in worldBooks"
            :key="wb.id"
            class="selector-item"
            :class="{ selected: formData.worldBooks?.includes(wb.id) }"
            @click="toggleWorldBook(wb.id)"
          >
            <div class="selector-item-name">{{ wb.name }}</div>
            <div class="selector-item-info">{{ wb.entries?.length || 0 }} 个条目</div>
            <div v-if="formData.worldBooks?.includes(wb.id)" class="selector-check">✓</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'

const router = useRouter()
const route = useRoute()

const fileInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref('')
const isNew = ref(true)
const showAvatarInput = ref(false)
const avatarUrlInput = ref('')
const showWorldBookSelector = ref(false)
const worldBooks = ref<any[]>([])

const formData = ref({
  id: null as number | null,
  type: 'char',
  name: '',
  description: '',
  avatar: '',
  persona: '',
  scenario: '',
  firstMessage: '',
  exampleDialogue: '',
  worldBooks: [] as number[],
})

// 检查是否是当前使用的用户身份
const isCurrentUser = computed(() => {
  const currentUserId = localStorage.getItem('currentUserCharId')
  return formData.value.id !== null && currentUserId === String(formData.value.id)
})

// 设为当前用户身份
const setAsCurrentUser = () => {
  if (formData.value.id) {
    localStorage.setItem('currentUserCharId', String(formData.value.id))
    alert(`已设置「${formData.value.name}」为当前用户身份`)
  } else {
    alert('请先保存角色卡')
  }
}

// 触发文件选择
const triggerFileInput = () => {
  showAvatarInput.value = false
  fileInput.value?.click()
}

// 确认使用图床链接
const confirmAvatarUrl = () => {
  const url = avatarUrlInput.value.trim()
  if (!url) {
    alert('请输入图片链接')
    return
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('请输入有效的图片链接（以 http:// 或 https:// 开头）')
    return
  }
  avatarPreview.value = url
  formData.value.avatar = url
  showAvatarInput.value = false
  avatarUrlInput.value = ''
}

// 处理文件上传
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
    formData.value.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 保存角色
const saveCharacter = () => {
  if (!formData.value.name.trim()) {
    alert('请输入角色名称')
    return
  }

  const characters = JSON.parse(localStorage.getItem('characters') || '[]')

  if (isNew.value) {
    formData.value.id = Date.now()
    characters.push({ ...formData.value })
  } else {
    const index = characters.findIndex((c: any) => c.id === formData.value.id)
    if (index > -1) {
      characters[index] = { ...formData.value }
    }
  }

  localStorage.setItem('characters', JSON.stringify(characters))
  router.push('/characters')
}

// 加载世界书列表
const loadWorldBooks = () => {
  const saved = localStorage.getItem('worldBooks')
  if (saved) {
    worldBooks.value = JSON.parse(saved)
  }
}

// 获取世界书名称
const getWorldBookName = (wbId: number): string => {
  const wb = worldBooks.value.find((w: any) => w.id === wbId)
  return wb ? wb.name : '未知世界书'
}

// 切换世界书绑定
const toggleWorldBook = (wbId: number) => {
  if (!formData.value.worldBooks) {
    formData.value.worldBooks = []
  }
  const index = formData.value.worldBooks.indexOf(wbId)
  if (index > -1) {
    formData.value.worldBooks.splice(index, 1)
  } else {
    formData.value.worldBooks.push(wbId)
  }
}

// 移除世界书绑定
const removeWorldBook = (wbId: number) => {
  if (formData.value.worldBooks) {
    formData.value.worldBooks = formData.value.worldBooks.filter((id: number) => id !== wbId)
  }
}

// 加载角色数据
const loadCharacter = () => {
  const characterId = route.params.id as string
  if (characterId && characterId !== 'new') {
    isNew.value = false
    const characters = JSON.parse(localStorage.getItem('characters') || '[]')
    const character = characters.find((c: any) => c.id === Number(characterId))
    if (character) {
      formData.value = { ...character, worldBooks: character.worldBooks || [] }
      avatarPreview.value = character.avatar || ''
    }
  } else {
    isNew.value = true
    // 从 query 参数获取默认类型
    const typeParam = route.query.type as string
    if (typeParam === 'user' || typeParam === 'char') {
      formData.value.type = typeParam
    }
  }
}

onMounted(() => {
  loadWorldBooks()
  loadCharacter()
})
</script>

<style scoped>
.character-edit-page {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.save-btn {
  border: none;
  background: none;
  color: var(--brand-primary, #007aff);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px;
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edit-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
}

.edit-content::-webkit-scrollbar { display: none; }

/* 头像 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  gap: 12px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--fill-tertiary, #e9ecef);
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-preview:active { transform: scale(0.95); }

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  gap: 8px;
}

.placeholder-icon { font-size: 32px; }
.avatar-placeholder span:last-child { font-size: 12px; }

.avatar-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

/* 表单 */
.form-section {
  background: var(--bg-primary);
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child { margin-bottom: 0; }

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.type-selector {
  display: flex;
  gap: 12px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid var(--separator);
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn.active {
  border-color: var(--brand-primary, #007aff);
  background: rgba(0, 122, 255, 0.08);
  color: var(--brand-primary, #007aff);
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--separator);
  border-radius: 8px;
  font-size: 15px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand-primary, #007aff);
  background: var(--bg-primary);
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--separator);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  background: var(--bg-secondary);
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
  min-height: 80px;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--brand-primary, #007aff);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.setting-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* 设为当前用户按钮 */
.set-active-btn {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--brand-primary, #007aff);
  background: var(--bg-primary);
  color: var(--brand-primary, #007aff);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.set-active-btn.active {
  background: var(--brand-primary, #007aff);
  color: #fff;
}

/* 世界书绑定 */
.worldbook-bind-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bound-worldbooks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bound-wb-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-primary);
}

.remove-wb-btn {
  border: none;
  background: none;
  color: var(--text-tertiary);
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-wb-btn {
  background: var(--brand-primary, #007aff);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
}

/* 头像输入弹窗 */
.avatar-input-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.avatar-input-modal {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 90%;
  max-width: 320px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--separator);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-header .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.modal-content { padding: 20px; }

.modal-content .input-group { margin-bottom: 0; }

.modal-content .input-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-url-btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  background: var(--brand-primary, #007aff);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--separator);
}

.divider span { padding: 0 12px; }

.upload-local-btn {
  width: 100%;
  padding: 12px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--separator);
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 世界书选择器 */
.selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.selector-popup {
  background: var(--bg-primary);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--separator);
}

.selector-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.selector-close {
  border: none;
  background: none;
  font-size: 28px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.selector-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.selector-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
  font-size: 15px;
}

.selector-item {
  padding: 14px 16px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s;
}

.selector-item:active { background: var(--fill-tertiary); }
.selector-item.selected { background: rgba(0, 122, 255, 0.1); }

.selector-item-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.selector-item-info {
  font-size: 13px;
  color: var(--text-tertiary);
}

.selector-check {
  color: var(--brand-primary, #007aff);
  font-size: 18px;
  font-weight: 600;
}
</style>
