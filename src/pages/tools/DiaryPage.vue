<template>
  <div class="diary-page">
    <NavBar title="日记" back-to="/">
      <template #right>
        <button class="icon-btn" @click="startNew">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </template>
    </NavBar>

    <!-- Editor View -->
    <div v-if="editing" class="editor">
      <div class="editor-header">
        <button class="editor-back" @click="cancelEdit">取消</button>
        <span class="editor-date">{{ formatFullDate(editingDiary.created_at || '') }}</span>
        <button class="editor-save" @click="saveDiary">保存</button>
      </div>

      <div class="editor-meta">
        <div class="meta-row">
          <span class="meta-label">心情</span>
          <div class="mood-picker">
            <button
              v-for="m in moods"
              :key="m.value"
              class="mood-btn"
              :class="{ active: editingDiary.mood === m.value }"
              @click="editingDiary.mood = m.value"
            >{{ m.emoji }}</button>
          </div>
        </div>
        <div class="meta-row">
          <span class="meta-label">天气</span>
          <div class="mood-picker">
            <button
              v-for="w in weathers"
              :key="w.value"
              class="mood-btn"
              :class="{ active: editingDiary.weather === w.value }"
              @click="editingDiary.weather = w.value"
            >{{ w.emoji }}</button>
          </div>
        </div>
      </div>

      <input
        v-model="editingDiary.title"
        type="text"
        class="editor-title"
        placeholder="标题"
      />
      <textarea
        ref="contentRef"
        v-model="editingDiary.content"
        class="editor-content"
        placeholder="今天发生了什么..."
      ></textarea>
    </div>

    <!-- List View -->
    <div v-else class="diary-list">
      <div v-if="diaries.length === 0" class="empty-state">
        <div class="empty-emoji">▤</div>
        <div class="empty-title">还没有日记</div>
        <div class="empty-sub">记录你的每一天</div>
      </div>

      <div v-for="diary in diaries" :key="diary.id" class="diary-card" @click="openDiary(diary)">
        <div class="diary-top">
          <div class="diary-date-block">
            <span class="diary-day">{{ getDay(diary.created_at) }}</span>
            <span class="diary-month">{{ getMonth(diary.created_at) }}</span>
          </div>
          <div class="diary-info">
            <h3 class="diary-title">{{ diary.title || '无标题' }}</h3>
            <p class="diary-preview">{{ truncate(diary.content, 80) }}</p>
          </div>
          <div class="diary-mood" v-if="diary.mood">
            {{ getMoodEmoji(diary.mood) }}
          </div>
        </div>
        <div class="diary-tags" v-if="diary.tags?.length">
          <span v-for="tag in diary.tags" :key="tag" class="diary-tag">#{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useDiaryStore } from '@/stores/diary'

const store = useDiaryStore()
const diaries = computed(() => store.diaries)

const moods = [
  { value: 'happy', emoji: '◠' },
  { value: 'excited', emoji: '✦' },
  { value: 'calm', emoji: '○' },
  { value: 'sad', emoji: '◡' },
  { value: 'angry', emoji: '✕' },
  { value: 'tired', emoji: '—' },
]

const weathers = [
  { value: 'sunny', emoji: '☀' },
  { value: 'cloudy', emoji: '☁' },
  { value: 'rainy', emoji: '☂' },
  { value: 'snowy', emoji: '❄' },
  { value: 'windy', emoji: '≋' },
]

const editing = ref(false)
const contentRef = ref<HTMLTextAreaElement | null>(null)

const editingDiary = reactive<Record<string, any>>({
  title: '',
  content: '',
  mood: 'calm',
  weather: 'sunny',
  tags: [],
  created_at: new Date().toISOString(),
})

let editingId: number | null = null

function getMoodEmoji(mood: string): string {
  return moods.find(m => m.value === mood)?.emoji || '—'
}

function getDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString()
}

function getMonth(dateStr: string): string {
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  return months[new Date(dateStr).getMonth()]
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}

function startNew() {
  editingId = null
  editingDiary.title = ''
  editingDiary.content = ''
  editingDiary.mood = 'calm'
  editingDiary.weather = 'sunny'
  editingDiary.tags = []
  editingDiary.created_at = new Date().toISOString()
  editing.value = true
}

function openDiary(diary: any) {
  editingId = diary.id
  editingDiary.title = diary.title
  editingDiary.content = diary.content
  editingDiary.mood = diary.mood
  editingDiary.weather = diary.weather
  editingDiary.tags = diary.tags || []
  editingDiary.created_at = diary.created_at
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveDiary() {
  const data = {
    title: editingDiary.title,
    content: editingDiary.content,
    mood: editingDiary.mood,
    weather: editingDiary.weather,
    tags: editingDiary.tags,
  }
  if (editingId) {
    await store.updateDiary(editingId, data as any)
  } else {
    await store.createDiary(data as any)
  }
  editing.value = false
}

onMounted(() => store.fetchDiaries())
</script>

<style scoped>
.diary-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

/* List */
.diary-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.diary-card {
  background: var(--bg-primary);
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: transform 0.15s var(--ease-ios);
}

.diary-card:active { transform: scale(0.98); }

.diary-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.diary-date-block {
  width: 48px;
  text-align: center;
  flex-shrink: 0;
}

.diary-day {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--brand-primary);
  line-height: 1.2;
}

.diary-month {
  font-size: 12px;
  color: var(--text-tertiary);
}

.diary-info {
  flex: 1;
  min-width: 0;
}

.diary-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.diary-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}

.diary-mood {
  font-size: 24px;
  flex-shrink: 0;
}

.diary-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.diary-tag {
  font-size: 12px;
  color: var(--brand-primary);
  background: rgba(88, 86, 214, 0.08);
  padding: 2px 8px;
  border-radius: 8px;
}

/* Editor */
.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--separator);
}

.editor-date {
  font-size: 14px;
  color: var(--text-secondary);
}

.editor-back, .editor-save {
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}
.editor-back { color: var(--text-secondary); }
.editor-save { color: var(--brand-primary); font-weight: 600; }

.editor-meta {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 0.5px solid var(--separator);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-label {
  font-size: 14px;
  color: var(--text-secondary);
  width: 40px;
  flex-shrink: 0;
}

.mood-picker {
  display: flex;
  gap: 8px;
}

.mood-btn {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  background: var(--fill-tertiary);
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.mood-btn.active {
  border-color: var(--brand-primary);
  background: rgba(88, 86, 214, 0.1);
  transform: scale(1.1);
}

.editor-title {
  padding: 16px 16px 8px;
  border: none;
  background: none;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
}
.editor-title::placeholder { color: var(--text-quaternary); font-weight: 400; }

.editor-content {
  flex: 1;
  padding: 0 16px 16px;
  border: none;
  background: none;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
  outline: none;
  resize: none;
  font-family: inherit;
}
.editor-content::placeholder { color: var(--text-quaternary); }

/* Common */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-emoji { font-size: 48px; margin-bottom: 12px; }
.empty-title { font-size: 17px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
.empty-sub { font-size: 14px; color: var(--text-tertiary); }

.icon-btn {
  width: 32px; height: 32px; border: none; background: none;
  color: var(--brand-primary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:active { opacity: 0.5; }
.icon-btn svg { width: 22px; height: 22px; }
</style>
