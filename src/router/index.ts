import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Route name -> featureId mapping for feature gating
const routeFeatureMap: Record<string, string> = {
  Friends: 'chat',
  Chat: 'chat',
  GroupChat: 'chat',
  Characters: 'characters',
  CharacterEdit: 'characters',
  UserPersonas: 'personas',
  WorldBook: 'worldbook',
  Forum: 'forum',
  PostDetail: 'forum',
  Weibo: 'weibo',
  QZone: 'qzone',
  Moments: 'qzone',
  CoupleSpace: 'couple_space',
  Takeaway: 'takeaway',
  Restaurant: 'takeaway',
  TakeawayOrders: 'takeaway',
  Shopping: 'shopping',
  Wallet: 'wallet',
  ListenTogether: 'music',
  Live: 'live',
  Games: 'games',
  Casino: 'casino',
  MiniTheater: 'mini_theater',
  Diary: 'diary',
  Phone: 'phone',
  Sms: 'sms',
  Stock: 'stock',
  CurrencyConverter: 'currency',
  VoiceCall: 'voice_call',
  VideoCall: 'video_call',
  PhonePeek: 'phone_peek',
  ReversePhonePeek: 'reverse_phone_peek',
  OfflineDate: 'offline_date',
  Preset: 'preset',
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/home/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/pages/auth/AuthCallbackPage.vue'),
    meta: { public: true },
  },
  // === 聊天 ===
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('@/pages/chat/FriendsPage.vue'),
  },
  {
    path: '/chat/:friendId?',
    name: 'Chat',
    component: () => import('@/pages/chat/ChatPage.vue'),
  },
  {
    path: '/group/:groupId',
    name: 'GroupChat',
    component: () => import('@/pages/chat/GroupChatPage.vue'),
  },
  {
    path: '/characters',
    name: 'Characters',
    component: () => import('@/pages/chat/CharactersPage.vue'),
  },
  {
    path: '/character/edit/:id',
    name: 'CharacterEdit',
    component: () => import('@/pages/chat/CharacterEditPage.vue'),
  },
  {
    path: '/personas',
    name: 'UserPersonas',
    component: () => import('@/pages/chat/UserPersonasPage.vue'),
  },
  {
    path: '/worldbook',
    name: 'WorldBook',
    component: () => import('@/pages/chat/WorldBookPage.vue'),
  },
  // === 社交 ===
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/pages/social/ForumPage.vue'),
  },
  {
    path: '/forum/post/:postId',
    name: 'PostDetail',
    component: () => import('@/pages/social/PostDetailPage.vue'),
  },
  {
    path: '/weibo',
    name: 'Weibo',
    component: () => import('@/pages/social/WeiboPage.vue'),
  },
  {
    path: '/qzone',
    name: 'QZone',
    component: () => import('@/pages/social/QZonePage.vue'),
  },
  {
    path: '/moments',
    name: 'Moments',
    component: () => import('@/pages/social/QZonePage.vue'),
  },
  {
    path: '/couple-space',
    name: 'CoupleSpace',
    component: () => import('@/pages/social/CoupleSpacePage.vue'),
  },
  // === 生活服务 ===
  {
    path: '/takeaway',
    name: 'Takeaway',
    component: () => import('@/pages/lifestyle/TakeawayPage.vue'),
  },
  {
    path: '/takeaway/restaurant/:id',
    name: 'Restaurant',
    component: () => import('@/pages/lifestyle/RestaurantPage.vue'),
  },
  {
    path: '/takeaway/orders',
    name: 'TakeawayOrders',
    component: () => import('@/pages/lifestyle/TakeawayOrdersPage.vue'),
  },
  {
    path: '/shopping',
    name: 'Shopping',
    component: () => import('@/pages/lifestyle/ShoppingPage.vue'),
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('@/pages/lifestyle/WalletPage.vue'),
  },
  // === 娱乐 ===
  {
    path: '/listen-together',
    name: 'ListenTogether',
    component: () => import('@/pages/entertainment/ListenTogetherPage.vue'),
  },
  {
    path: '/live',
    name: 'Live',
    component: () => import('@/pages/entertainment/LivePage.vue'),
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('@/pages/entertainment/GamesPage.vue'),
  },
  {
    path: '/casino',
    name: 'Casino',
    component: () => import('@/pages/entertainment/CasinoPage.vue'),
  },
  {
    path: '/mini-theater',
    name: 'MiniTheater',
    component: () => import('@/pages/entertainment/MiniTheaterPage.vue'),
  },
  // === 工具 ===
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/pages/tools/DiaryPage.vue'),
  },
  {
    path: '/phone',
    name: 'Phone',
    component: () => import('@/pages/tools/PhonePage.vue'),
  },
  {
    path: '/sms',
    name: 'Sms',
    component: () => import('@/pages/tools/SmsPage.vue'),
  },
  {
    path: '/stock',
    name: 'Stock',
    component: () => import('@/pages/tools/StockPage.vue'),
  },
  {
    path: '/currency',
    name: 'CurrencyConverter',
    component: () => import('@/pages/tools/CurrencyConverterPage.vue'),
  },
  // === 其他 ===
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue'),
  },
  {
    path: '/customize',
    name: 'Customize',
    component: () => import('@/pages/CustomizePage.vue'),
  },
  {
    path: '/preset',
    name: 'Preset',
    component: () => import('@/pages/PresetPage.vue'),
  },
  {
    path: '/voice-call',
    name: 'VoiceCall',
    component: () => import('@/pages/tools/VoiceCallPage.vue'),
  },
  {
    path: '/video-call',
    name: 'VideoCall',
    component: () => import('@/pages/tools/VideoCallPage.vue'),
  },
  {
    path: '/phone-peek',
    name: 'PhonePeek',
    component: () => import('@/pages/tools/PhonePeekPage.vue'),
  },
  {
    path: '/reverse-phone-peek',
    name: 'ReversePhonePeek',
    component: () => import('@/pages/tools/ReversePhonePeekPage.vue'),
  },
  {
    path: '/offline-date',
    name: 'OfflineDate',
    component: () => import('@/pages/tools/OfflineDatePage.vue'),
  },
  // === Admin ===
  {
    path: '/admin/features',
    name: 'AdminFeatures',
    component: () => import('@/pages/admin/FeatureManagePage.vue'),
    meta: { admin: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const API_URL = import.meta.env.VITE_API_URL || ''

async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

router.beforeEach(async (to, _from, next) => {
  const isPublic = to.meta.public === true
  const token = localStorage.getItem('token')

  if (!isPublic) {
    if (!token) return next('/login')
    const valid = await validateToken(token)
    if (!valid) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return next('/login')
    }
  }

  if (to.path === '/login' && token) return next('/')

  // Feature gating: block access to disabled features
  const routeName = to.name as string
  if (routeName && routeFeatureMap[routeName]) {
    const { useFeaturesStore } = await import('@/stores/features')
    const featuresStore = useFeaturesStore()
    // Ensure features are loaded
    if (!featuresStore.loaded) {
      await featuresStore.fetchFeatures()
    }
    if (!featuresStore.isEnabled(routeFeatureMap[routeName])) {
      return next('/')
    }
  }

  next()
})

export default router
