<template>
  <div class="forum-page" :class="`theme-${activeTab}`">
    <NavBar :title="tabTitles[activeTab]" back-to="/">
      <template #right>
        <div class="header-actions">
          <button class="hdr-btn" @click="showPromptEditor = true" title="提示词设置">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button class="hdr-btn" @click="handleRefresh" :disabled="store.generating" title="刷新">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" :class="{ spinning: store.generating }"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </template>
    </NavBar>

    <!-- Tab 栏 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="forum-content" ref="contentRef">
      <!-- 全局错误提示 -->
      <div v-if="store.lastError" class="error-toast" @click="store.lastError = ''">
        ⚠️ {{ store.lastError }}
      </div>

      <!-- ==================== 知乎 Tab ==================== -->
      <template v-if="activeTab === 'zhihu'">
        <div v-if="store.zhihuLoading && store.zhihuQuestions.length === 0" class="loading-state">
          <div class="loading-spinner">🔍</div>
          <div class="loading-text">正在生成知乎内容...</div>
        </div>

        <div v-else-if="store.zhihuQuestions.length === 0" class="empty-state">
          <div class="empty-icon">💡</div>
          <div class="empty-text">暂无问答</div>
          <div class="empty-hint">点击刷新按钮让AI生成知乎内容～</div>
          <button class="generate-btn zhihu-btn" @click="handleRefresh" :disabled="store.generating">
            {{ store.generating ? '生成中...' : '✨ 生成知乎内容' }}
          </button>
        </div>

        <div v-else class="zhihu-list">
          <div v-if="store.generating" class="top-loading"><span class="dot-loading">生成中</span></div>

          <div v-for="question in store.zhihuQuestions" :key="question.id" class="zhihu-question-card">
            <div class="zhihu-question-header">
              <h3 class="zhihu-question-title">{{ question.title }}</h3>
              <button class="delete-btn-sm" @click="store.deleteZhihuQuestion(question.id)">×</button>
            </div>
            <p v-if="question.description" class="zhihu-question-desc">{{ truncate(question.description, 80) }}</p>
            <div class="zhihu-question-meta">
              <span>{{ question.answers.length }} 个回答</span>
              <span>{{ question.followers }} 关注</span>
              <span>{{ question.views }} 浏览</span>
            </div>

            <!-- 回答列表 -->
            <div v-for="answer in question.answers.slice(0, 2)" :key="answer.id" class="zhihu-answer">
              <div class="zhihu-answer-header">
                <div class="zhihu-avatar" :style="{ background: getColor(answer.author) }">{{ answer.author[0] }}</div>
                <span class="zhihu-author">{{ answer.author }}</span>
              </div>
              <div class="zhihu-answer-content">{{ truncate(answer.content, 150) }}</div>
              <div class="zhihu-answer-actions">
                <button
                  class="zhihu-vote-btn"
                  :class="{ active: answer.isUpvoted }"
                  @click="store.toggleZhihuVote(question.id, answer.id, 'up')"
                >
                  ▲ 赞同 {{ answer.upvotes }}
                </button>
                <button
                  class="zhihu-vote-btn down"
                  :class="{ active: answer.isDownvoted }"
                  @click="store.toggleZhihuVote(question.id, answer.id, 'down')"
                >
                  ▼
                </button>
                <span class="zhihu-comment-count">💬 {{ answer.comments.length }}</span>
              </div>

              <!-- 评论 -->
              <div v-if="answer.comments.length > 0" class="zhihu-comments">
                <div v-for="comment in answer.comments" :key="comment.id" class="zhihu-comment">
                  <span class="comment-author">{{ comment.author }}</span>：{{ comment.content }}
                </div>
              </div>
            </div>

            <div v-if="question.answers.length > 2" class="zhihu-more">
              查看全部 {{ question.answers.length }} 个回答 →
            </div>
          </div>
        </div>
      </template>

      <!-- ==================== 小红书 Tab ==================== -->
      <template v-if="activeTab === 'xiaohongshu'">
        <div v-if="store.xhsLoading && store.xhsNotes.length === 0" class="loading-state">
          <div class="loading-spinner">📕</div>
          <div class="loading-text">正在生成小红书内容...</div>
        </div>

        <div v-else-if="store.xhsNotes.length === 0" class="empty-state">
          <div class="empty-icon">📕</div>
          <div class="empty-text">暂无笔记</div>
          <div class="empty-hint">点击刷新按钮让AI生成小红书内容～</div>
          <button class="generate-btn xhs-btn" @click="handleRefresh" :disabled="store.generating">
            {{ store.generating ? '生成中...' : '✨ 生成小红书内容' }}
          </button>
        </div>

        <div v-else class="xhs-waterfall">
          <div v-if="store.generating" class="top-loading"><span class="dot-loading">生成中</span></div>

          <div class="xhs-grid">
            <div v-for="note in store.xhsNotes" :key="note.id" class="xhs-card" @click="toggleXhsComments(note.id)">
              <!-- 模拟封面图 -->
              <div class="xhs-cover" :style="{ background: getCoverGradient(note.id) }">
                <div class="xhs-cover-text">{{ note.title.slice(0, 2) }}</div>
              </div>
              <div class="xhs-card-body">
                <h4 class="xhs-title">{{ note.title }}</h4>
                <p class="xhs-content">{{ truncate(note.content, 60) }}</p>
                <div class="xhs-tags" v-if="note.tags.length">
                  <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="xhs-tag">#{{ tag }}</span>
                </div>
                <div class="xhs-card-footer">
                  <div class="xhs-author-row">
                    <div class="xhs-avatar-sm" :style="{ background: getColor(note.author) }">{{ note.author[0] }}</div>
                    <span class="xhs-author-name">{{ note.author }}</span>
                  </div>
                  <div class="xhs-actions">
                    <button class="xhs-action" :class="{ liked: note.isLiked }" @click.stop="store.toggleXhsLike(note.id)">
                      {{ note.isLiked ? '❤️' : '🤍' }} {{ formatCount(note.likes) }}
                    </button>
                    <button class="xhs-action" :class="{ collected: note.isCollected }" @click.stop="store.toggleXhsCollect(note.id)">
                      {{ note.isCollected ? '⭐' : '☆' }} {{ formatCount(note.collects) }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 展开的评论区 -->
              <div v-if="note.showComments" class="xhs-comments-section" @click.stop>
                <div class="xhs-comments-header">
                  <span>评论 {{ note.comments.length }}</span>
                  <button class="delete-btn-sm" @click.stop="store.deleteXhsNote(note.id)">删除</button>
                </div>
                <div v-for="comment in note.comments" :key="comment.id" class="xhs-comment">
                  <span class="comment-author">{{ comment.author }}</span>
                  <span v-if="comment.replyTo" class="reply-to">回复 <span class="mention">@{{ comment.replyTo }}</span></span>
                  ：{{ comment.content }}
                </div>
                <div v-if="note.comments.length === 0" class="no-comments">暂无评论</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ==================== 抖音 Tab ==================== -->
      <template v-if="activeTab === 'douyin'">
        <div v-if="store.douyinLoading && store.douyinVideos.length === 0" class="loading-state douyin-loading">
          <div class="loading-spinner">🎵</div>
          <div class="loading-text">正在生成抖音内容...</div>
        </div>

        <div v-else-if="store.douyinVideos.length === 0" class="empty-state douyin-empty">
          <div class="empty-icon">🎬</div>
          <div class="empty-text">暂无视频</div>
          <div class="empty-hint">点击刷新按钮让AI生成抖音内容～</div>
          <button class="generate-btn douyin-btn" @click="handleRefresh" :disabled="store.generating">
            {{ store.generating ? '生成中...' : '✨ 生成抖音内容' }}
          </button>
        </div>

        <div v-else class="douyin-feed">
          <div v-if="store.generating" class="top-loading douyin-top-loading"><span class="dot-loading">生成中</span></div>

          <div v-for="video in store.douyinVideos" :key="video.id" class="douyin-card">
            <!-- 模拟视频画面 -->
            <div class="douyin-video-area" :style="{ background: getVideoBg(video.id) }">
              <div class="douyin-play-icon">▶</div>
              <div class="douyin-video-overlay">
                <div class="douyin-author-info">
                  <div class="douyin-avatar" :style="{ background: getColor(video.author) }">{{ video.author[0] }}</div>
                  <span class="douyin-author-name">@{{ video.author }}</span>
                </div>
                <p class="douyin-description">{{ video.description }}</p>
                <div class="douyin-tags" v-if="video.tags.length">
                  <span v-for="tag in video.tags" :key="tag" class="douyin-tag">#{{ tag }}</span>
                </div>
              </div>

              <!-- 右侧操作栏 -->
              <div class="douyin-side-actions">
                <div class="douyin-side-item" @click="store.toggleDouyinLike(video.id)">
                  <span class="douyin-side-icon" :class="{ liked: video.isLiked }">{{ video.isLiked ? '❤️' : '🤍' }}</span>
                  <span class="douyin-side-count">{{ formatCount(video.likes) }}</span>
                </div>
                <div class="douyin-side-item" @click="toggleDouyinComments(video.id)">
                  <span class="douyin-side-icon">💬</span>
                  <span class="douyin-side-count">{{ formatCount(video.commentCount) }}</span>
                </div>
                <div class="douyin-side-item">
                  <span class="douyin-side-icon">➡️</span>
                  <span class="douyin-side-count">{{ formatCount(video.shares) }}</span>
                </div>
                <div class="douyin-side-item" @click="store.deleteDouyinVideo(video.id)">
                  <span class="douyin-side-icon">🗑️</span>
                </div>
              </div>
            </div>

            <!-- 评论区 -->
            <div v-if="video.showComments" class="douyin-comments">
              <div class="douyin-comments-header">
                <span>评论 ({{ video.comments.length }})</span>
              </div>
              <div v-for="comment in video.comments" :key="comment.id" class="douyin-comment">
                <div class="douyin-comment-avatar" :style="{ background: getColor(comment.author) }">{{ comment.author[0] }}</div>
                <div class="douyin-comment-body">
                  <div class="douyin-comment-author">
                    {{ comment.author }}
                    <span v-if="comment.isAuthorReply" class="author-badge">作者</span>
                    <span v-if="comment.replyTo" class="reply-to">回复 @{{ comment.replyTo }}</span>
                  </div>
                  <div class="douyin-comment-text">{{ comment.content }}</div>
                  <div class="douyin-comment-actions">
                    <button
                      class="douyin-comment-like"
                      :class="{ liked: comment.isLiked }"
                      @click="store.toggleDouyinCommentLike(video.id, comment.id)"
                    >
                      {{ comment.isLiked ? '❤️' : '🤍' }} {{ formatCount(comment.likes) }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="video.comments.length === 0" class="no-comments">暂无评论</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 提示词编辑弹窗 -->
    <Teleport to="#phone-overlay">
      <Transition name="slide-up">
        <div v-if="showPromptEditor" class="compose-overlay" @click.self="showPromptEditor = false">
          <div class="compose-panel prompt-panel">
            <div class="dialog-header">
              <button class="dialog-close" @click="showPromptEditor = false">关闭</button>
              <h3>{{ tabTitles[activeTab] }}提示词</h3>
              <button class="dialog-submit" @click="savePrompt">保存</button>
            </div>
            <div class="dialog-body">
              <p class="prompt-hint">自定义AI生成{{ tabTitles[activeTab] }}内容的提示词。支持变量：<code v-pre>{{characters}}</code> <code v-pre>{{user}}</code> <code v-pre>{{action}}</code></p>
              <textarea v-model="promptText" class="prompt-textarea" rows="12"></textarea>
              <div class="prompt-actions">
                <button class="reset-btn" @click="resetPrompt">恢复默认</button>
                <button class="clear-data-btn" @click="clearCurrentData">清除所有数据</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useSocialAIStore } from '@/stores/socialAI'
import { getAvatarColor, truncateText, hashUsername } from '@/utils/socialParsers'
import { getPromptTemplate, setPromptTemplate, resetPromptTemplate } from '@/utils/socialPrompts'
import type { SocialType } from '@/utils/socialPrompts'

const store = useSocialAIStore()

type TabKey = 'zhihu' | 'xiaohongshu' | 'douyin'

const tabs = [
  { key: 'zhihu' as TabKey, label: '知乎', icon: '💡' },
  { key: 'xiaohongshu' as TabKey, label: '小红书', icon: '📕' },
  { key: 'douyin' as TabKey, label: '抖音', icon: '🎵' },
]

const tabTitles: Record<TabKey, string> = {
  zhihu: '知乎',
  xiaohongshu: '小红书',
  douyin: '抖音',
}

const tabSocialType: Record<TabKey, SocialType> = {
  zhihu: 'zhihu',
  xiaohongshu: 'xiaohongshu',
  douyin: 'douyin',
}

const activeTab = ref<TabKey>('zhihu')
const showPromptEditor = ref(false)
const promptText = ref('')
const contentRef = ref<HTMLElement>()

function getColor(name: string) {
  return getAvatarColor(name)
}

function truncate(text: string, max: number) {
  return truncateText(text, max)
}

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function getCoverGradient(id: string): string {
  const h = hashUsername(id)
  const gradients = [
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    'linear-gradient(135deg, #ffd1ff 0%, #fad0c4 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ]
  return gradients[h % gradients.length]
}

function getVideoBg(id: string): string {
  const h = hashUsername(id)
  const bgs = [
    'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(180deg, #2d1b69 0%, #11001c 100%)',
    'linear-gradient(180deg, #0c0c1d 0%, #1a1a3e 50%, #2d2d5e 100%)',
    'linear-gradient(180deg, #1b1b2f 0%, #162447 50%, #1f4068 100%)',
    'linear-gradient(180deg, #200122 0%, #6f0000 100%)',
    'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  ]
  return bgs[h % bgs.length]
}

function switchTab(key: TabKey) {
  activeTab.value = key
  store.loadData(tabSocialType[key])
  promptText.value = getPromptTemplate(tabSocialType[key])
}

function toggleXhsComments(noteId: string) {
  const note = store.xhsNotes.find(n => n.id === noteId)
  if (note) note.showComments = !note.showComments
}

function toggleDouyinComments(videoId: string) {
  const video = store.douyinVideos.find(v => v.id === videoId)
  if (video) video.showComments = !video.showComments
}

async function handleRefresh() {
  const type = tabSocialType[activeTab.value]
  switch (type) {
    case 'zhihu':
      await store.generateZhihuContent()
      break
    case 'xiaohongshu':
      await store.generateXhsContent()
      break
    case 'douyin':
      await store.generateDouyinContent()
      break
  }
}

function savePrompt() {
  setPromptTemplate(tabSocialType[activeTab.value], promptText.value)
  showPromptEditor.value = false
}

function resetPrompt() {
  resetPromptTemplate(tabSocialType[activeTab.value])
  promptText.value = getPromptTemplate(tabSocialType[activeTab.value])
}

function clearCurrentData() {
  if (confirm(`确定清除所有${tabTitles[activeTab.value]}数据吗？`)) {
    store.clearData(tabSocialType[activeTab.value])
  }
}

onMounted(() => {
  store.loadData('zhihu')
  store.loadData('xiaohongshu')
  store.loadData('douyin')
  promptText.value = getPromptTemplate(tabSocialType[activeTab.value])
})
</script>

<style scoped>
.forum-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
  transition: background 0.3s ease;
}

.theme-zhihu { background: #f6f6f6; }
.theme-xiaohongshu { background: #fefefe; }
.theme-douyin { background: #161823; }

/* ==================== Header ==================== */
.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.hdr-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--brand-primary, #5856d6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
}

.hdr-btn:active { opacity: 0.5; }
.hdr-btn:disabled { opacity: 0.3; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ==================== Tab Bar ==================== */
.tab-bar {
  display: flex;
  border-bottom: 1px solid #eee;
  background: white;
  padding: 0 8px;
  flex-shrink: 0;
}

.theme-douyin .tab-bar {
  background: #222;
  border-bottom-color: #333;
}

.tab-item {
  flex: 1;
  border: none;
  background: none;
  padding: 10px 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.tab-icon { font-size: 18px; }
.tab-label { font-size: 11px; color: #999; font-weight: 500; }

.theme-douyin .tab-label { color: #666; }

.tab-item.active .tab-label { font-weight: 700; }
.theme-zhihu .tab-item.active .tab-label { color: #0066ff; }
.theme-xiaohongshu .tab-item.active .tab-label { color: #ff2442; }
.theme-douyin .tab-item.active .tab-label { color: #fff; }

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 3px;
  border-radius: 3px;
}

.theme-zhihu .tab-item.active::after { background: #0066ff; }
.theme-xiaohongshu .tab-item.active::after { background: #ff2442; }
.theme-douyin .tab-item.active::after { background: #fe2c55; }

/* ==================== Content Area ==================== */
.forum-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  -webkit-overflow-scrolling: touch;
}

.forum-content::-webkit-scrollbar { display: none; }

/* ==================== Common States ==================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  color: #8f8a82;
}

.loading-spinner {
  font-size: 42px;
  margin-bottom: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
}

.loading-text { font-size: 14px; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  text-align: center;
  color: #b8b2a9;
  padding: 20px;
}

.empty-icon { font-size: 42px; margin-bottom: 12px; opacity: 0.6; }
.empty-text { font-size: 17px; font-weight: 600; color: #8f8a82; margin-bottom: 6px; }
.empty-hint { font-size: 13px; margin-bottom: 20px; }

.douyin-loading, .douyin-empty { color: #aaa; }
.douyin-empty .empty-text { color: #ccc; }

.generate-btn {
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
}

.generate-btn:active { transform: scale(0.95); }
.generate-btn:disabled { opacity: 0.5; }

.zhihu-btn { background: linear-gradient(135deg, #0066ff, #0084ff); }
.xhs-btn { background: linear-gradient(135deg, #ff2442, #ff6b81); }
.douyin-btn { background: linear-gradient(135deg, #fe2c55, #25f4ee); }

.error-toast {
  background: #fff3cd;
  color: #856404;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 8px;
}

.theme-douyin .error-toast {
  background: #3a2a00;
  color: #ffcc02;
}

.top-loading {
  text-align: center;
  padding: 8px;
  font-size: 13px;
}

.theme-zhihu .top-loading { color: #0066ff; }
.theme-xiaohongshu .top-loading { color: #ff2442; }
.douyin-top-loading { color: #fe2c55; }

.dot-loading::after {
  content: '';
  animation: dots 1.5s steps(4) infinite;
}

@keyframes dots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
}

.delete-btn-sm {
  border: none;
  background: #eee;
  color: #999;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn-sm:active { background: #ddd; }

/* ==================== 知乎样式 ==================== */
.zhihu-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zhihu-question-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.zhihu-question-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.zhihu-question-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px;
  line-height: 1.4;
}

.zhihu-question-desc {
  font-size: 13px;
  color: #8590a6;
  margin: 0 0 8px;
  line-height: 1.4;
}

.zhihu-question-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8590a6;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.zhihu-answer {
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.zhihu-answer:last-child { border-bottom: none; }

.zhihu-answer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.zhihu-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.zhihu-author {
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.zhihu-answer-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px;
}

.zhihu-answer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zhihu-vote-btn {
  border: 1px solid #e0e0e0;
  background: #f6f6f6;
  color: #8590a6;
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.zhihu-vote-btn.active {
  background: #0066ff;
  color: white;
  border-color: #0066ff;
}

.zhihu-vote-btn.down {
  padding: 4px 8px;
}

.zhihu-vote-btn.down.active {
  background: #f6f6f6;
  color: #8590a6;
  border-color: #e0e0e0;
}

.zhihu-comment-count {
  font-size: 13px;
  color: #8590a6;
  margin-left: auto;
}

.zhihu-comments {
  margin-top: 8px;
  padding: 8px;
  background: #f6f6f6;
  border-radius: 8px;
}

.zhihu-comment {
  font-size: 13px;
  color: #666;
  padding: 4px 0;
  line-height: 1.5;
}

.comment-author {
  font-weight: 600;
  color: #0066ff;
}

.zhihu-more {
  text-align: center;
  padding: 10px;
  color: #0066ff;
  font-size: 13px;
  cursor: pointer;
}

/* ==================== 小红书样式 ==================== */
.xhs-waterfall {
  display: flex;
  flex-direction: column;
}

.xhs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.xhs-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.xhs-card:active { transform: scale(0.98); }

.xhs-cover {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.xhs-cover-text {
  font-size: 32px;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
}

.xhs-card-body {
  padding: 8px 10px 10px;
}

.xhs-title {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin: 0 0 4px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.xhs-content {
  font-size: 11px;
  color: #999;
  margin: 0 0 6px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.xhs-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.xhs-tag {
  font-size: 10px;
  color: #ff2442;
  background: rgba(255, 36, 66, 0.08);
  padding: 1px 6px;
  border-radius: 10px;
}

.xhs-card-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xhs-author-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.xhs-avatar-sm {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
}

.xhs-author-name {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.xhs-actions {
  display: flex;
  gap: 8px;
}

.xhs-action {
  border: none;
  background: none;
  padding: 0;
  font-size: 11px;
  color: #999;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.xhs-action.liked { color: #ff2442; }
.xhs-action.collected { color: #ffc107; }

.xhs-comments-section {
  padding: 8px 10px 10px;
  border-top: 1px solid #f0f0f0;
}

.xhs-comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
}

.xhs-comment {
  font-size: 12px;
  color: #666;
  padding: 3px 0;
  line-height: 1.4;
}

.xhs-comment .comment-author { color: #ff2442; }

.reply-to {
  color: #999;
  font-size: 11px;
}

.mention { color: #0066ff; }

.no-comments {
  font-size: 12px;
  color: #ccc;
  text-align: center;
  padding: 10px 0;
}

/* ==================== 抖音样式 ==================== */
.douyin-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.douyin-card {
  border-radius: 12px;
  overflow: hidden;
  background: #222;
}

.douyin-video-area {
  position: relative;
  width: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.douyin-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  color: rgba(255,255,255,0.3);
  z-index: 1;
}

.douyin-video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 50px;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  z-index: 2;
}

.douyin-author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.douyin-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  border: 2px solid white;
  flex-shrink: 0;
}

.douyin-author-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.douyin-description {
  color: white;
  font-size: 13px;
  line-height: 1.4;
  margin: 0 0 4px;
}

.douyin-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.douyin-tag {
  color: #25f4ee;
  font-size: 12px;
  font-weight: 500;
}

/* 右侧操作栏 */
.douyin-side-actions {
  position: absolute;
  right: 8px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 3;
}

.douyin-side-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.douyin-side-icon {
  font-size: 22px;
  transition: transform 0.2s;
}

.douyin-side-icon.liked { transform: scale(1.2); }

.douyin-side-count {
  font-size: 11px;
  color: white;
  font-weight: 500;
}

/* 抖音评论区 */
.douyin-comments {
  background: #2a2a2a;
  padding: 10px 12px;
}

.douyin-comments-header {
  font-size: 14px;
  color: #ddd;
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3a3a3a;
}

.douyin-comment {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}

.douyin-comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.douyin-comment-body { flex: 1; min-width: 0; }

.douyin-comment-author {
  font-size: 12px;
  color: #888;
  margin-bottom: 2px;
}

.author-badge {
  background: #fe2c55;
  color: white;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  margin-left: 4px;
}

.douyin-comment-author .reply-to {
  color: #666;
  font-size: 11px;
  margin-left: 4px;
}

.douyin-comment-text {
  font-size: 13px;
  color: #ddd;
  line-height: 1.4;
}

.douyin-comment-actions {
  margin-top: 4px;
}

.douyin-comment-like {
  border: none;
  background: none;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.douyin-comment-like.liked { color: #fe2c55; }

.theme-douyin .no-comments { color: #555; }

/* ==================== 弹窗 ==================== */
.compose-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compose-panel {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.dialog-close, .dialog-submit {
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  -webkit-tap-highlight-color: transparent;
}

.dialog-close { color: #999; }
.dialog-submit { color: #0066ff; font-weight: 600; }

.dialog-body { padding: 16px; }

.prompt-hint {
  font-size: 12px;
  color: #999;
  margin: 0 0 10px;
  line-height: 1.5;
}

.prompt-hint code {
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 11px;
}

.prompt-textarea {
  width: 100%;
  min-height: 180px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  color: #333;
  line-height: 1.5;
  background: #fafafa;
}

.prompt-textarea:focus { border-color: #0066ff; }

.prompt-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.reset-btn, .clear-data-btn {
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  background: #f8f8f8;
  color: #666;
  transition: all 0.2s;
}

.reset-btn:active, .clear-data-btn:active { background: #eee; }
.clear-data-btn { color: #e74c3c; border-color: #fed7d7; }

/* ==================== Transitions ==================== */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(20px) scale(0.95); opacity: 0; }
</style>
