<template>
  <div class="worldbook-page">
    <NavBar title="世界书" back-to="/friends">
      <template #right>
        <button class="icon-btn" @click="showBookMenu = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </template>
    </NavBar>

    <!-- 世界书选择器 -->
    <div class="book-tabs">
      <div
        v-for="book in worldBooks"
        :key="book.id"
        class="book-tab"
        :class="{ active: currentBookId === book.id }"
        @click="currentBookId = book.id"
      >
        <span class="book-tab-icon">📖</span>
        <span class="book-tab-name">{{ book.name }}</span>
        <span class="book-tab-count">{{ book.entries.length }}</span>
      </div>
      <div class="book-tab add-tab" @click="showBookMenu = true">
        <span>+</span>
      </div>
    </div>

    <div class="page-content" v-if="currentBook">
      <!-- 当前世界书信息 -->
      <div class="book-info-bar">
        <div class="book-info-left">
          <div class="book-title">{{ currentBook.name }}</div>
          <div class="book-meta">
            {{ currentBook.entries.length }} 个条目
            <span v-if="currentBook.bindChars.length > 0"> · 绑定 {{ currentBook.bindChars.length }} 个角色</span>
          </div>
        </div>
        <div class="book-info-actions">
          <button class="small-btn" @click="editBookName">✏️</button>
          <button class="small-btn" @click="exportBook">📤</button>
          <button class="small-btn danger" @click="deleteBook" v-if="worldBooks.length > 1">🗑️</button>
        </div>
      </div>

      <!-- 搜索和添加 -->
      <div class="toolbar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input v-model="searchText" placeholder="搜索条目..." />
        </div>
        <button class="add-entry-btn" @click="openEntryEditor(null)">+ 新条目</button>
      </div>

      <!-- 条目列表 -->
      <div v-if="filteredEntries.length === 0 && !showEntryForm" class="empty">
        <div class="empty-icon">📚</div>
        <p>还没有世界书条目</p>
        <p class="empty-hint">世界书条目会在聊天中根据关键词自动注入到AI的上下文中</p>
        <button class="empty-btn" @click="openEntryEditor(null)">创建第一个条目</button>
      </div>

      <div class="entry-list" v-if="filteredEntries.length > 0">
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="entry-card"
          :class="{ disabled: !entry.enabled }"
        >
          <div class="entry-header" @click="toggleEntryExpand(entry.id)">
            <div class="entry-title-row">
              <span class="entry-icon">📖</span>
              <span class="entry-title">{{ entry.title }}</span>
              <span class="entry-status" :class="{ on: entry.enabled }">
                {{ entry.enabled ? '✅' : '❌' }}
              </span>
            </div>
            <div class="entry-keywords-preview" v-if="entry.keywords.length > 0">
              <span class="kw-tag" v-for="kw in entry.keywords.slice(0, 5)" :key="kw">{{ kw }}</span>
              <span v-if="entry.keywords.length > 5" class="kw-more">+{{ entry.keywords.length - 5 }}</span>
            </div>
          </div>

          <div v-if="expandedEntryId === entry.id" class="entry-expand">
            <div class="entry-content-preview">{{ entry.content }}</div>
            <div class="entry-actions">
              <button class="act-btn" @click="toggleEntryEnabled(entry)">
                {{ entry.enabled ? '禁用' : '启用' }}
              </button>
              <button class="act-btn" @click="openEntryEditor(entry)">编辑</button>
              <button class="act-btn danger" @click="deleteEntry(entry.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无世界书时的空状态 -->
    <div v-if="worldBooks.length === 0" class="page-content">
      <div class="empty">
        <div class="empty-icon">📚</div>
        <p>还没有世界书</p>
        <p class="empty-hint">世界书用于在聊天中自动注入背景设定信息</p>
        <button class="empty-btn" @click="createNewBook">创建第一本世界书</button>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-bar">
      <button class="import-btn" @click="triggerImport">📥 导入世界书</button>
      <input ref="importInput" type="file" accept=".json" style="display:none" @change="handleImport" />
    </div>

    <!-- 条目编辑弹窗 -->
    <div v-if="showEntryForm" class="modal-overlay" @click.self="showEntryForm = false">
      <div class="editor-panel">
        <div class="editor-header">
          <h3>{{ editingEntry ? '编辑条目' : '新建条目' }}</h3>
          <span class="close-btn" @click="showEntryForm = false">✕</span>
        </div>
        <div class="editor-body">
          <div class="form-group">
            <label>条目标题</label>
            <input v-model="entryForm.title" placeholder="条目名称" />
          </div>
          <div class="form-group">
            <label>触发关键词</label>
            <input v-model="keywordsInput" placeholder="多个关键词用逗号分隔，如：魔法,法术,施法" />
            <div class="form-hint">当聊天内容中出现这些关键词时，条目内容会自动注入到AI上下文中</div>
          </div>
          <div class="form-group">
            <label>条目内容</label>
            <textarea v-model="entryForm.content" rows="6" placeholder="当关键词被触发时，注入到AI上下文的背景信息..."></textarea>
          </div>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="entryForm.enabled" />
              <span>启用此条目</span>
            </label>
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn-cancel" @click="showEntryForm = false">取消</button>
          <button class="btn-save" @click="saveEntry">💾 保存</button>
        </div>
      </div>
    </div>

    <!-- 世界书菜单弹窗 -->
    <div v-if="showBookMenu" class="modal-overlay" @click.self="showBookMenu = false">
      <div class="menu-panel">
        <div class="menu-header">
          <h3>世界书管理</h3>
          <span class="close-btn" @click="showBookMenu = false">✕</span>
        </div>
        <div class="menu-body">
          <div class="menu-item" @click="createNewBook">
            <span class="menu-icon">📝</span>
            <span>新建世界书</span>
          </div>
          <div class="menu-item" @click="triggerImport; showBookMenu = false">
            <span class="menu-icon">📥</span>
            <span>导入世界书</span>
          </div>
          <div class="menu-divider" v-if="worldBooks.length > 0"></div>
          <div class="menu-section-title" v-if="worldBooks.length > 0">已有世界书</div>
          <div
            v-for="book in worldBooks"
            :key="book.id"
            class="menu-item"
            :class="{ active: currentBookId === book.id }"
            @click="currentBookId = book.id; showBookMenu = false"
          >
            <span class="menu-icon">📖</span>
            <div class="menu-item-info">
              <span>{{ book.name }}</span>
              <span class="menu-item-meta">{{ book.entries.length }} 个条目</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'

interface WorldBookEntry {
  id: string
  title: string
  keywords: string[]
  content: string
  enabled: boolean
}

interface WorldBook {
  id: string
  name: string
  entries: WorldBookEntry[]
  bindChars: string[]  // 绑定的角色ID列表
  createdAt: string
}

const STORAGE_KEY = 'worldBooks'

const worldBooks = ref<WorldBook[]>([])
const currentBookId = ref<string | null>(null)
const searchText = ref('')
const expandedEntryId = ref<string | null>(null)
const showEntryForm = ref(false)
const showBookMenu = ref(false)
const editingEntry = ref<WorldBookEntry | null>(null)
const keywordsInput = ref('')
const importInput = ref<HTMLInputElement | null>(null)

const entryForm = ref({
  title: '',
  keywords: [] as string[],
  content: '',
  enabled: true,
})

const currentBook = computed(() => {
  if (!currentBookId.value) return null
  return worldBooks.value.find(b => b.id === currentBookId.value) || null
})

const filteredEntries = computed(() => {
  if (!currentBook.value) return []
  let entries = currentBook.value.entries
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    entries = entries.filter(e =>
      e.title.toLowerCase().includes(kw) ||
      e.content.toLowerCase().includes(kw) ||
      e.keywords.some(k => k.toLowerCase().includes(kw))
    )
  }
  return entries
})

// localStorage 操作
function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        worldBooks.value = parsed
      }
    }
  } catch {
    // ignore
  }

  if (worldBooks.value.length > 0) {
    currentBookId.value = worldBooks.value[0].id
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(worldBooks.value))
  } catch {
    // ignore
  }
}

// 世界书操作
function createNewBook() {
  const name = prompt('输入世界书名称：', '新世界书')
  if (!name?.trim()) return

  const book: WorldBook = {
    id: `wb-${Date.now()}`,
    name: name.trim(),
    entries: [],
    bindChars: [],
    createdAt: new Date().toISOString(),
  }
  worldBooks.value.unshift(book)
  currentBookId.value = book.id
  showBookMenu.value = false
  saveToStorage()
}

function editBookName() {
  if (!currentBook.value) return
  const name = prompt('修改世界书名称：', currentBook.value.name)
  if (!name?.trim()) return
  currentBook.value.name = name.trim()
  saveToStorage()
}

function deleteBook() {
  if (!currentBook.value) return
  if (!confirm(`确定要删除世界书「${currentBook.value.name}」吗？其中的所有条目都会被删除。`)) return

  const idx = worldBooks.value.findIndex(b => b.id === currentBookId.value)
  worldBooks.value.splice(idx, 1)

  if (worldBooks.value.length > 0) {
    currentBookId.value = worldBooks.value[0].id
  } else {
    currentBookId.value = null
  }
  saveToStorage()
}

function exportBook() {
  if (!currentBook.value) return

  // 导出为 SillyTavern 兼容格式
  const exportData = {
    name: currentBook.value.name,
    entries: currentBook.value.entries.reduce((acc: any, entry: WorldBookEntry, idx: number) => {
      acc[idx] = {
        uid: idx,
        key: entry.keywords,
        keysecondary: [],
        comment: entry.title,
        content: entry.content,
        constant: false,
        selective: true,
        order: idx,
        position: 0,
        disable: !entry.enabled,
        excludeRecursion: false,
        probability: 100,
        depth: 4,
      }
      return acc
    }, {}),
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `worldbook-${currentBook.value.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 条目操作
function toggleEntryExpand(id: string) {
  expandedEntryId.value = expandedEntryId.value === id ? null : id
}

function openEntryEditor(entry: WorldBookEntry | null) {
  editingEntry.value = entry
  if (entry) {
    entryForm.value = {
      title: entry.title,
      keywords: [...entry.keywords],
      content: entry.content,
      enabled: entry.enabled,
    }
    keywordsInput.value = entry.keywords.join(', ')
  } else {
    entryForm.value = {
      title: '',
      keywords: [],
      content: '',
      enabled: true,
    }
    keywordsInput.value = ''
  }
  showEntryForm.value = true
}

function saveEntry() {
  if (!currentBook.value) return
  if (!entryForm.value.title.trim()) return

  const keywords = keywordsInput.value
    .split(/[,，]/)
    .map(k => k.trim())
    .filter(k => k.length > 0)

  if (editingEntry.value) {
    // 更新
    const idx = currentBook.value.entries.findIndex(e => e.id === editingEntry.value!.id)
    if (idx >= 0) {
      currentBook.value.entries[idx] = {
        ...currentBook.value.entries[idx],
        title: entryForm.value.title.trim(),
        keywords,
        content: entryForm.value.content,
        enabled: entryForm.value.enabled,
      }
    }
  } else {
    // 新建
    currentBook.value.entries.push({
      id: `entry-${Date.now()}`,
      title: entryForm.value.title.trim(),
      keywords,
      content: entryForm.value.content,
      enabled: entryForm.value.enabled,
    })
  }

  saveToStorage()
  showEntryForm.value = false
}

function deleteEntry(id: string) {
  if (!currentBook.value) return
  if (!confirm('确定要删除此条目？')) return
  currentBook.value.entries = currentBook.value.entries.filter(e => e.id !== id)
  if (expandedEntryId.value === id) expandedEntryId.value = null
  saveToStorage()
}

function toggleEntryEnabled(entry: WorldBookEntry) {
  entry.enabled = !entry.enabled
  saveToStorage()
}

// 导入
function triggerImport() {
  importInput.value?.click()
}

function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      const bookName = data.name || file.name.replace(/\.json$/i, '')

      const entries: WorldBookEntry[] = []

      // 支持 SillyTavern 格式
      if (data.entries && typeof data.entries === 'object') {
        const entryObj = data.entries
        for (const key of Object.keys(entryObj)) {
          const e = entryObj[key]
          entries.push({
            id: `entry-${Date.now()}-${key}`,
            title: e.comment || e.title || `条目${key}`,
            keywords: Array.isArray(e.key) ? e.key : (typeof e.key === 'string' ? e.key.split(',').map((k: string) => k.trim()) : []),
            content: e.content || '',
            enabled: !e.disable,
          })
        }
      }
      // 支持我们自己的格式（直接数组）
      else if (Array.isArray(data)) {
        for (const e of data) {
          entries.push({
            id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: e.title || e.key || '未命名',
            keywords: Array.isArray(e.keywords) ? e.keywords : [],
            content: e.content || '',
            enabled: e.enabled !== false,
          })
        }
      }

      const newBook: WorldBook = {
        id: `wb-${Date.now()}`,
        name: bookName,
        entries,
        bindChars: [],
        createdAt: new Date().toISOString(),
      }

      worldBooks.value.unshift(newBook)
      currentBookId.value = newBook.id
      saveToStorage()

      alert(`成功导入世界书「${bookName}」，共 ${entries.length} 个条目`)
    } catch {
      alert('导入失败：文件格式不正确')
    }
  }
  reader.readAsText(file)
  if (importInput.value) importInput.value.value = ''
}

onMounted(() => {
  loadFromStorage()
})
</script>

<style scoped>
.worldbook-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* 世界书标签 */
.book-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  overflow-x: auto;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--separator);
}

.book-tabs::-webkit-scrollbar { display: none; }

.book-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  background: var(--bg-tertiary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.book-tab.active {
  background: var(--color-primary, #007aff);
  color: #fff;
}

.book-tab-icon { font-size: 14px; }
.book-tab-name { font-size: 13px; font-weight: 500; }

.book-tab-count {
  font-size: 11px;
  padding: 0 5px;
  border-radius: 8px;
  background: rgba(0,0,0,0.1);
  min-width: 16px;
  text-align: center;
}

.book-tab.active .book-tab-count {
  background: rgba(255,255,255,0.25);
}

.add-tab {
  width: 32px;
  justify-content: center;
  font-size: 18px;
  color: var(--text-tertiary);
}

/* 内容区 */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* 世界书信息栏 */
.book-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 10px;
}

.book-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.book-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.book-info-actions {
  display: flex;
  gap: 4px;
}

.small-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--bg-tertiary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.small-btn.danger { background: rgba(255, 59, 48, 0.1); }
.small-btn:active { opacity: 0.7; }

/* 工具栏 */
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  padding: 8px 10px;
}

.search-wrap input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: var(--text-primary);
}

.search-icon { font-size: 13px; opacity: 0.5; }

.add-entry-btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  background: var(--color-primary, #007aff);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

/* 条目卡片 */
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  transition: opacity 0.2s;
}

.entry-card.disabled { opacity: 0.5; }

.entry-header {
  padding: 12px 14px;
  cursor: pointer;
}

.entry-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.entry-icon { font-size: 14px; }

.entry-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.entry-status { font-size: 12px; }

.entry-keywords-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.kw-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.kw-more {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 2px 4px;
}

/* 展开区 */
.entry-expand {
  padding: 0 14px 12px;
  border-top: 1px solid var(--separator);
}

.entry-content-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-top: 8px;
  padding: 8px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  white-space: pre-wrap;
  max-height: 150px;
  overflow-y: auto;
}

.entry-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.act-btn {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
}

.act-btn.danger { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
.act-btn:active { opacity: 0.7; }

/* 空状态 */
.empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-hint { font-size: 13px; margin-top: 4px; opacity: 0.7; }

.empty-btn {
  margin-top: 12px;
  padding: 8px 20px;
  border-radius: 18px;
  border: none;
  background: var(--color-primary, #007aff);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* 底部 */
.bottom-bar {
  padding: 8px 12px 16px;
}

.import-btn {
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed var(--border-primary, var(--separator));
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.import-btn:active { background: var(--bg-tertiary); }

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.editor-panel, .menu-panel {
  width: 100%;
  max-width: 393px;
  max-height: 85%;
  background: var(--bg-primary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}

.editor-header, .menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--separator);
}

.editor-header h3, .menu-header h3 {
  margin: 0;
  font-size: 17px;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  border: none;
}

.editor-body, .menu-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--separator);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.form-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.4;
}

.form-row {
  margin-bottom: 12px;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.editor-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--separator);
}

.editor-footer button {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel { background: var(--bg-tertiary); color: var(--text-primary); }
.btn-save { background: var(--color-primary, #007aff); color: #fff; }

/* 菜单 */
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 4px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}

.menu-item:active { background: var(--bg-tertiary); }
.menu-item.active { background: rgba(0, 122, 255, 0.08); }

.menu-icon { font-size: 20px; flex-shrink: 0; }

.menu-item-info {
  display: flex;
  flex-direction: column;
  font-size: 15px;
  color: var(--text-primary);
}

.menu-item-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 1px;
}

.menu-divider {
  height: 0.5px;
  background: var(--separator);
  margin: 8px 0;
}

.menu-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  padding: 4px 4px 8px;
  text-transform: uppercase;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--brand-primary, var(--color-primary, #007aff));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:active { opacity: 0.5; }
.icon-btn svg { width: 22px; height: 22px; }
</style>
