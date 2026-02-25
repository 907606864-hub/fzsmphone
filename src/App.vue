<template>
  <PhoneLayout>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </PhoneLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import PhoneLayout from '@/layouts/PhoneLayout.vue'
import { usePhoneStore } from '@/stores/phone'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const phone = usePhoneStore()
const auth = useAuthStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  // 以 settingsStore 的 darkMode 为准，同步 phoneStore 的主题
  const savedDark = settingsStore.settings.darkMode
  phone.theme = savedDark ? 'dark' : 'light'
  phone.initTheme()
  phone.startBatteryDrain()

  if (auth.token) {
    auth.fetchUser()
  }
})

onUnmounted(() => {
  phone.stopBatteryTimer()
})
</script>
