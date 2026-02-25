<template>
  <div class="customize-page">
    <NavBar title="设置" back />

    <div class="settings-sections">
      <!-- Tab 切换 -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', activeTab === tab.key && 'active']"
          @click="activeTab = tab.key"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- ===== API 设置 ===== -->
      <div v-show="activeTab === 'api'" class="tab-content">
        <div class="section">
          <div class="section-header">🔑 API 配置</div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">API Key</span>
              <span class="label-desc">用于调用 AI 模型</span>
            </div>
          </div>
          <div class="input-row">
            <input
              v-model="s.apiKey"
              :type="showApiKey ? 'text' : 'password'"
              class="setting-input"
              placeholder="输入你的 API Key"
            />
            <button class="icon-action" @click="showApiKey = !showApiKey">
              {{ showApiKey ? '🙈' : '👁️' }}
            </button>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">API 地址</span>
            </div>
          </div>
          <select v-model="s.apiUrl" class="setting-select">
            <option value="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions">Gemini AI Studio</option>
            <option value="https://api.openai.com/v1/chat/completions">OpenAI</option>
            <option value="https://openrouter.ai/api/v1/chat/completions">Claude (OpenRouter)</option>
            <option value="custom">自定义地址</option>
          </select>

          <template v-if="s.apiUrl === 'custom'">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">自定义 API 地址</span>
              </div>
            </div>
            <input
              v-model="s.customApiUrl"
              class="setting-input"
              placeholder="https://api.example.com/v1/chat/completions"
            />
          </template>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">模型</span>
            </div>
          </div>
          <div class="model-row">
            <select v-if="modelList.length > 0" v-model="s.model" class="setting-select flex-1">
              <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
            </select>
            <input v-else v-model="s.model" class="setting-input flex-1" placeholder="gpt-4o-mini" />
            <button class="fetch-btn" @click="handleFetchModels" :disabled="fetchingModels">
              {{ fetchingModels ? '加载中...' : '拉取模型' }}
            </button>
          </div>
          <div v-if="fetchError" class="error-text">{{ fetchError }}</div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">请求超时（秒）</span>
              <span class="label-desc">{{ s.timeout }}秒</span>
            </div>
          </div>
          <div class="slider-row">
            <span class="slider-min">10</span>
            <input type="range" min="10" max="300" v-model.number="s.timeout" class="slider" />
            <span class="slider-max">300</span>
          </div>
        </div>
      </div>

      <!-- ===== 对话设置 ===== -->
      <div v-show="activeTab === 'chat'" class="tab-content">
        <div class="section">
          <div class="section-header">💬 对话参数</div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">回复创意度 (Temperature)</span>
              <span class="label-desc">{{ s.temperature.toFixed(1) }}</span>
            </div>
          </div>
          <div class="slider-row">
            <span class="slider-min">精准</span>
            <input type="range" min="0" max="20" :value="s.temperature * 10" @input="s.temperature = Number(($event.target as HTMLInputElement).value) / 10" class="slider" />
            <span class="slider-max">创意</span>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">最大回复长度</span>
              <span class="label-desc">{{ s.maxLength }} tokens</span>
            </div>
          </div>
          <div class="slider-row">
            <span class="slider-min">短</span>
            <input type="range" min="1" max="40" :value="s.maxLength / 100" @input="s.maxLength = Number(($event.target as HTMLInputElement).value) * 100" class="slider" />
            <span class="slider-max">长</span>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">流式输出</span>
              <span class="label-desc">实时逐字显示 AI 生成的文字</span>
            </div>
            <div class="toggle" :class="{ on: s.streamEnabled }" @click="s.streamEnabled = !s.streamEnabled">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">消息分段</span>
              <span class="label-desc">将长回复拆分为多条消息，模拟真人聊天</span>
            </div>
            <div class="toggle" :class="{ on: s.enableSplit }" @click="s.enableSplit = !s.enableSplit">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">角色主动消息</span>
              <span class="label-desc">AI 角色会在你沉默一段时间后主动发消息</span>
            </div>
            <div class="toggle" :class="{ on: s.heartbeatEnabled }" @click="s.heartbeatEnabled = !s.heartbeatEnabled">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <template v-if="s.heartbeatEnabled">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">心跳间隔（分钟）</span>
                <span class="label-desc">{{ s.heartbeatInterval }} 分钟</span>
              </div>
            </div>
            <div class="slider-row">
              <span class="slider-min">1</span>
              <input type="range" min="1" max="60" v-model.number="s.heartbeatInterval" class="slider" />
              <span class="slider-max">60</span>
            </div>
          </template>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">发送键行为</span>
              <span class="label-desc">{{ s.sendKeyBehavior === 'send' ? 'Enter 发送' : 'Enter 换行' }}</span>
            </div>
            <div class="toggle" :class="{ on: s.sendKeyBehavior === 'send' }" @click="s.sendKeyBehavior = s.sendKeyBehavior === 'send' ? 'newline' : 'send'">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 外观设置 ===== -->
      <div v-show="activeTab === 'appearance'" class="tab-content">
        <div class="section">
          <div class="section-header">🎨 外观设置</div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">深色模式</span>
              <span class="label-desc">开启后界面切换为深色主题</span>
            </div>
            <div class="toggle" :class="{ on: s.darkMode }" @click="toggleDarkMode">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">主题色</span>
              <span class="label-desc">选择你喜欢的主题颜色</span>
            </div>
            <div class="color-options">
              <div
                v-for="color in themeColors"
                :key="color.value"
                class="color-dot"
                :style="{ background: color.value }"
                :class="{ active: s.themeColor === color.value }"
                @click="s.themeColor = color.value"
              >
                <span v-if="s.themeColor === color.value">✓</span>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">壁纸</span>
              <span class="label-desc">选择锁屏和主页壁纸</span>
            </div>
          </div>
          <div class="wallpaper-grid">
            <div
              v-for="wp in wallpapers"
              :key="wp.id"
              class="wallpaper-item"
              :class="{ active: s.wallpaper === wp.id }"
              :style="{ background: wp.gradient }"
              @click="s.wallpaper = wp.id"
            >
              <span class="wp-emoji">{{ wp.emoji }}</span>
              <span class="wp-name">{{ wp.name }}</span>
              <span v-if="s.wallpaper === wp.id" class="wp-check">✓</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">🔤 字体设置</div>
          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">字体大小</span>
              <span class="label-desc">当前：{{ fontSizes[s.fontSize]?.label || '标准' }}</span>
            </div>
          </div>
          <div class="slider-row">
            <span class="slider-label-sm">A</span>
            <input type="range" min="0" max="4" v-model.number="s.fontSize" class="slider" />
            <span class="slider-label-lg">A</span>
          </div>
          <div class="font-preview" :style="{ fontSize: fontSizes[s.fontSize]?.size + 'px' }">
            这是预览文本 Preview Text
          </div>
        </div>
      </div>

      <!-- ===== 通知设置 ===== -->
      <div v-show="activeTab === 'notify'" class="tab-content">
        <div class="section">
          <div class="section-header">🔔 通知设置</div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">消息提示音</span>
              <span class="label-desc">收到消息时播放提示音</span>
            </div>
            <div class="toggle" :class="{ on: s.notificationSoundEnabled }" @click="s.notificationSoundEnabled = !s.notificationSoundEnabled">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <template v-if="s.notificationSoundEnabled">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">提示音</span>
              </div>
            </div>
            <div class="model-row">
              <select v-model="s.notificationSound" class="setting-select flex-1">
                <option value="default">默认</option>
                <option value="ding">叮咚</option>
                <option value="bubble">气泡</option>
                <option value="chime">风铃</option>
                <option value="pop">弹出</option>
              </select>
              <button class="fetch-btn test-btn" @click="testSound">试听</button>
            </div>
          </template>
        </div>
      </div>

      <!-- ===== 数据管理 ===== -->
      <div v-show="activeTab === 'data'" class="tab-content">
        <div class="section">
          <div class="section-header">💾 存储与数据</div>

          <div class="setting-item" @click="exportData">
            <div class="setting-label">
              <span class="label-text">导出数据</span>
              <span class="label-desc">导出聊天记录和设置</span>
            </div>
            <span class="arrow">›</span>
          </div>

          <div class="setting-item" @click="showClearConfirm = true">
            <div class="setting-label">
              <span class="label-text danger">清除所有数据</span>
              <span class="label-desc">清除本地缓存和聊天记录</span>
            </div>
            <span class="arrow">›</span>
          </div>

          <div class="setting-item" @click="resetToDefaults">
            <div class="setting-label">
              <span class="label-text danger">恢复默认设置</span>
              <span class="label-desc">将所有设置恢复为默认值</span>
            </div>
            <span class="arrow">›</span>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="save-hint">设置自动保存，无需手动操作</div>
    </div>

    <!-- 清除确认弹窗 -->
    <Teleport to="body">
      <div v-if="showClearConfirm" class="modal-overlay" @click.self="showClearConfirm = false">
        <div class="confirm-dialog">
          <div class="confirm-icon">⚠️</div>
          <h3>确定要清除所有数据吗？</h3>
          <p>此操作不可恢复，将清除所有本地数据</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showClearConfirm = false">取消</button>
            <button class="btn-danger" @click="clearAllData">确认清除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { useSettingsStore } from '@/stores/settings'
import { usePhoneStore } from '@/stores/phone'

const settingsStore = useSettingsStore()
const phoneStore = usePhoneStore()

// 直接引用 settings 的响应式对象（自动保存到 localStorage）
const s = settingsStore.settings

const activeTab = ref('api')
const showApiKey = ref(false)
const showClearConfirm = ref(false)
const modelList = ref<string[]>([])
const fetchingModels = ref(false)
const fetchError = ref('')

const tabs = [
  { key: 'api', icon: '🔑', label: 'API' },
  { key: 'chat', icon: '💬', label: '对话' },
  { key: 'appearance', icon: '🎨', label: '外观' },
  { key: 'notify', icon: '🔔', label: '通知' },
  { key: 'data', icon: '💾', label: '数据' },
]

const themeColors = [
  { value: '#007aff', name: '蓝色' },
  { value: '#ff3b30', name: '红色' },
  { value: '#34c759', name: '绿色' },
  { value: '#ff9500', name: '橙色' },
  { value: '#af52de', name: '紫色' },
  { value: '#ff2d55', name: '粉色' },
  { value: '#5856d6', name: '靛蓝' },
  { value: '#00c7be', name: '青色' },
]

const wallpapers = [
  { id: 'default', name: '默认', emoji: '🌊', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'sunset', name: '日落', emoji: '🌅', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { id: 'forest', name: '森林', emoji: '🌲', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { id: 'ocean', name: '海洋', emoji: '🐳', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 'night', name: '夜空', emoji: '🌌', gradient: 'linear-gradient(135deg, #0c0c1d, #1a1a3e)' },
  { id: 'cherry', name: '樱花', emoji: '🌸', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
]

const fontSizes = [
  { label: '极小', size: 12 },
  { label: '小', size: 13 },
  { label: '标准', size: 14 },
  { label: '大', size: 16 },
  { label: '极大', size: 18 },
]

function toggleDarkMode() {
  s.darkMode = !s.darkMode
  phoneStore.toggleTheme()
}

async function handleFetchModels() {
  fetchingModels.value = true
  fetchError.value = ''
  try {
    const list = await settingsStore.fetchModels()
    modelList.value = list
    if (list.length > 0 && !list.includes(s.model)) {
      s.model = list[0]
    }
  } catch (err: any) {
    fetchError.value = err.message || '拉取失败'
  } finally {
    fetchingModels.value = false
  }
}

function testSound() {
  // 简单的提示音测试
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = 800
    gainNode.gain.value = 0.3
    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    oscillator.stop(ctx.currentTime + 0.3)
  } catch {
    // ignore
  }
}

function exportData() {
  const data = {
    settings: { ...s },
    exportTime: new Date().toISOString(),
  }
  // 不导出 apiKey
  delete (data.settings as any).apiKey
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fzsmphone-settings.json'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAllData() {
  showClearConfirm.value = false
  localStorage.clear()
  settingsStore.resetSettings()
  window.location.reload()
}

function resetToDefaults() {
  if (confirm('确定要恢复默认设置吗？')) {
    settingsStore.resetSettings()
  }
}
</script>

<style scoped>
.customize-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow-y: auto;
}

.settings-sections {
  padding: 0 12px 24px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  padding: 8px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabs::-webkit-scrollbar { display: none; }

.tab-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn.active {
  background: var(--brand-primary, #007aff);
  color: #fff;
}

/* Section */
.section {
  background: var(--bg-secondary);
  border-radius: 14px;
  margin-top: 12px;
  overflow: hidden;
}

.section-header {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 0.5px solid var(--separator);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
}

.setting-label {
  flex: 1;
  min-width: 0;
}

.label-text {
  font-size: 14px;
  color: var(--text-primary);
  display: block;
}

.label-text.danger { color: #ff3b30; }

.label-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 1px;
  display: block;
}

.arrow {
  font-size: 18px;
  color: var(--text-quaternary);
}

/* Inputs */
.setting-input,
.setting-select {
  width: 100%;
  border: 1px solid var(--separator);
  border-radius: 10px;
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
  margin: 0 16px 8px;
  width: calc(100% - 32px);
}

.setting-input:focus,
.setting-select:focus {
  border-color: var(--brand-primary, #007aff);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 8px;
}

.input-row .setting-input {
  margin: 0;
  width: auto;
  flex: 1;
}

.icon-action {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.model-row {
  display: flex;
  gap: 8px;
  padding: 0 16px 8px;
}

.model-row .setting-select,
.model-row .setting-input {
  margin: 0;
  width: auto;
}

.flex-1 { flex: 1; }

.fetch-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: #34c759;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.fetch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-btn {
  background: var(--brand-primary, #007aff);
}

.error-text {
  padding: 0 16px 8px;
  font-size: 12px;
  color: #ff3b30;
}

/* Toggle */
.toggle {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--bg-tertiary);
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
  flex-shrink: 0;
}

.toggle.on {
  background: #34c759;
}

.toggle-thumb {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: #fff;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle.on .toggle-thumb {
  transform: translateX(20px);
}

/* Color */
.color-options {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-dot.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px currentColor;
  transform: scale(1.1);
}

/* Wallpaper */
.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px 16px 12px;
}

.wallpaper-item {
  height: 80px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.wallpaper-item.active {
  border-color: var(--brand-primary, #007aff);
}

.wp-emoji { font-size: 24px; }
.wp-name { font-size: 10px; color: #fff; font-weight: 500; }

.wp-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--brand-primary, #007aff);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Slider */
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 16px 12px;
}

.slider-min, .slider-max { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }
.slider-label-sm { font-size: 14px; color: var(--text-tertiary); }
.slider-label-lg { font-size: 20px; color: var(--text-tertiary); }

.slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-tertiary);
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background: var(--brand-primary, #007aff);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.font-preview {
  padding: 8px 16px 12px;
  color: var(--text-secondary);
  text-align: center;
}

/* Save hint */
.save-hint {
  text-align: center;
  padding: 16px;
  color: var(--text-quaternary);
  font-size: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  width: 280px;
}

.confirm-icon { font-size: 40px; margin-bottom: 8px; }

.confirm-dialog h3 {
  margin: 0 0 6px;
  font-size: 17px;
  color: var(--text-primary);
}

.confirm-dialog p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 16px;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-actions button {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel { background: var(--bg-tertiary); color: var(--text-primary); }
.btn-danger { background: #ff3b30; color: #fff; }
</style>
