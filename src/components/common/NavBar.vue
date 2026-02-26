<template>
  <div class="navbar">
    <div class="navbar-left">
      <button v-if="showBack" class="nav-btn" @click="handleBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span v-if="backText" class="back-text">{{ backText }}</span>
      </button>
      <slot name="left" />
    </div>
    <div class="navbar-center">
      <slot name="title">
        <span class="navbar-title">{{ title }}</span>
      </slot>
    </div>
    <div class="navbar-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  showBack?: boolean
  backText?: string
  backTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  backText: '',
  backTo: '',
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()

function handleBack() {
  emit('back')
  if (props.backTo) {
    router.push(props.backTo)
  } else {
    router.back()
  }
}
</script>

<style scoped>
.navbar {
  --status-bar-height: 54px;
  height: calc(var(--status-bar-height) + 44px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--status-bar-height) 8px 0;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--separator);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
}

.navbar-right {
  justify-content: flex-end;
}

.navbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.navbar-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: none;
  color: var(--brand-primary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: all 0.15s var(--ease-ios);
  -webkit-tap-highlight-color: transparent;
}

.nav-btn:active {
  opacity: 0.5;
  transform: scale(0.95);
}

.nav-btn svg {
  width: 22px;
  height: 22px;
}

.back-text {
  font-size: 17px;
  font-weight: 400;
}
</style>
