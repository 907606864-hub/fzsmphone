<template>
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-content">
      <div class="login-logo">📱</div>
      <h1 class="login-title">fzsmphone</h1>
      <p class="login-subtitle">请登录以继续</p>
      <button class="discord-btn pressable" @click="loginWithDiscord">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
        </svg>
        <span>使用 Discord 登录</span>
      </button>
      <p class="login-hint">需要加入指定 Discord 服务器才能使用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || ''
const REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}/auth/callback`

function loginWithDiscord() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds guilds.members.read',
  })
  window.location.href = `https://discord.com/api/oauth2/authorize?${params.toString()}`
}
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #0f0c29, #302b63, #24243e);
}

.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
}

.login-logo {
  font-size: 72px;
  margin-bottom: 8px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.login-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}

.login-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 16px;
  text-align: center;
}

.discord-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: #5865F2;
  color: #fff;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
  transition: transform 0.15s ease;
}

.discord-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(88, 101, 242, 0.5);
}
</style>
