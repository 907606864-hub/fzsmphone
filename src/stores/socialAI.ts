/**
 * 社交AI统一Store
 * 管理论坛、微博、朋友圈的AI生成数据
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sendAIRequest } from '@/utils/aiService'
import { generateImageFromPrompt, isSocialAutoImageGenEnabled } from '@/utils/imageGenService'
import type { AIMessage } from '@/utils/aiService'
import { buildPrompt } from '@/utils/socialPrompts'
import type { SocialType } from '@/utils/socialPrompts'
import {
  parseForumContent,
  parseWeiboContent,
  parseMomentsContent,
  parseZhihuContent,
  parseXhsContent,
  parseDouyinContent,
  parseMusicContent,
  parseLiveContent,
  parseTheaterContent,
  parseTakeawayContent,
  parseShoppingContent,
  parseCoupleContent,
  parseStockContent,
  parseEmailContent,
  parseBrowserContent,
  parseMapContent,
  parseCalendarContent,
  generateId,
  parseImagePrompts,
} from '@/utils/socialParsers'
import type {
  ForumThread,
  WeiboItem,
  HotSearchItem,
  RankingItem,
  MomentItem,
  ZhihuQuestion,
  XhsNote,
  DouyinVideo,
  MusicTrack,
  MusicPlaylist,
  LiveStreamer,
  TheaterDrama,
  TakeawayRestaurant,
  ShoppingProduct,
  LoveLetter,
  WishItem,
  FootprintItem,
  StockIndex,
  StockItem as StockItemType,
  EmailItem,
  BrowserResult,
  MapLocation,
  CalendarEvent,
} from '@/utils/socialParsers'

// ==================== 存储键 ====================
const STORAGE_KEYS = {
  forum: 'social-data-forum',
  weibo: 'social-data-weibo',
  moments: 'social-data-moments',
  zhihu: 'social-data-zhihu',
  xiaohongshu: 'social-data-xiaohongshu',
  douyin: 'social-data-douyin',
  music: 'social-data-music',
  live: 'social-data-live',
  theater: 'social-data-theater',
  takeaway: 'social-data-takeaway',
  shopping: 'social-data-shopping',
  couple: 'social-data-couple',
  stock: 'social-data-stock',
  email: 'social-data-email',
  browser: 'social-data-browser',
  map: 'social-data-map',
  calendar: 'social-data-calendar',
}

// ==================== AI配置读取 ====================
function getAIConfig() {
  try {
    const saved = localStorage.getItem('fzsm-settings')
    if (saved) {
      const s = JSON.parse(saved)
      const mainApiKey = s.apiKey || ''
      const mainApiUrl = s.apiUrl === 'custom' ? (s.customApiUrl || '') : (s.apiUrl || '')
      const mainModel = s.model || ''
      // 优先使用社交API配置，留空则回退到主API
      const apiKey = s.socialApiKey || mainApiKey
      const apiUrl = s.socialApiUrl || mainApiUrl
      const model = s.socialModel || mainModel
      const maxTokens = s.maxLength || 4000
      const temperature = s.temperature ?? 0.9
      const enableYamlParsing = s.enableYamlParsing ?? false
      return { apiKey, apiUrl, model, maxTokens, temperature, enableYamlParsing }
    }
    return { apiKey: '', apiUrl: '', model: '', maxTokens: 4000, temperature: 0.9, enableYamlParsing: false }
  } catch {
    return { apiKey: '', apiUrl: '', model: '', maxTokens: 4000, temperature: 0.9, enableYamlParsing: false }
  }
}

export const useSocialAIStore = defineStore('socialAI', () => {
  // ==================== 论坛状态 ====================
  const forumThreads = ref<ForumThread[]>([])
  const forumLoading = ref(false)

  // ==================== 微博状态 ====================
  const weiboPosts = ref<WeiboItem[]>([])
  const weiboHotSearches = ref<HotSearchItem[]>([])
  const weiboRankings = ref<RankingItem[]>([])
  const weiboLoading = ref(false)

  // ==================== 朋友圈状态 ====================
  const moments = ref<MomentItem[]>([])
  const momentsLoading = ref(false)

  // ==================== 知乎状态 ====================
  const zhihuQuestions = ref<ZhihuQuestion[]>([])
  const zhihuLoading = ref(false)

  // ==================== 小红书状态 ====================
  const xhsNotes = ref<XhsNote[]>([])
  const xhsLoading = ref(false)

  // ==================== 抖音状态 ====================
  const douyinVideos = ref<DouyinVideo[]>([])
  const douyinLoading = ref(false)

  // ==================== 音乐状态 ====================
  const musicTracks = ref<MusicTrack[]>([])
  const musicPlaylists = ref<MusicPlaylist[]>([])
  const musicLoading = ref(false)

  // ==================== 直播状态 ====================
  const liveStreamers = ref<LiveStreamer[]>([])
  const liveLoading = ref(false)

  // ==================== 小剧场状态 ====================
  const theaterDramas = ref<TheaterDrama[]>([])
  const theaterLoading = ref(false)

  // ==================== 外卖状态 ====================
  const takeawayRestaurants = ref<TakeawayRestaurant[]>([])
  const takeawayLoading = ref(false)

  // ==================== 购物状态 ====================
  const shoppingProducts = ref<ShoppingProduct[]>([])
  const shoppingLoading = ref(false)

  // ==================== 情侣空间状态 ====================
  const coupleLetters = ref<LoveLetter[]>([])
  const coupleWishes = ref<WishItem[]>([])
  const coupleFootprints = ref<FootprintItem[]>([])
  const coupleLoading = ref(false)

  // ==================== 股票状态 ====================
  const stockIndices = ref<StockIndex[]>([])
  const stockItems = ref<StockItemType[]>([])
  const stockLoading = ref(false)

  // ==================== 邮箱状态 ====================
  const emailItems = ref<EmailItem[]>([])
  const emailLoading = ref(false)

  // ==================== 浏览器状态 ====================
  const browserResults = ref<BrowserResult[]>([])
  const browserLoading = ref(false)

  // ==================== 地图状态 ====================
  const mapLocations = ref<MapLocation[]>([])
  const mapLoading = ref(false)

  // ==================== 日历状态 ====================
  const calendarEvents = ref<CalendarEvent[]>([])
  const calendarLoading = ref(false)

  // ==================== 通用 ====================
  const generating = ref(false)
  const lastError = ref('')
  const lastRawResponse = ref('')

  // ==================== 持久化 ====================
  function saveData(type: SocialType) {
    try {
      switch (type) {
        case 'forum':
          localStorage.setItem(STORAGE_KEYS.forum, JSON.stringify(forumThreads.value))
          break
        case 'weibo':
          localStorage.setItem(STORAGE_KEYS.weibo, JSON.stringify({
            posts: weiboPosts.value,
            hotSearches: weiboHotSearches.value,
            rankings: weiboRankings.value,
          }))
          break
        case 'moments':
          localStorage.setItem(STORAGE_KEYS.moments, JSON.stringify(moments.value))
          break
        case 'zhihu':
          localStorage.setItem(STORAGE_KEYS.zhihu, JSON.stringify(zhihuQuestions.value))
          break
        case 'xiaohongshu':
          localStorage.setItem(STORAGE_KEYS.xiaohongshu, JSON.stringify(xhsNotes.value))
          break
        case 'douyin':
          localStorage.setItem(STORAGE_KEYS.douyin, JSON.stringify(douyinVideos.value))
          break
        case 'music':
          localStorage.setItem(STORAGE_KEYS.music, JSON.stringify({ tracks: musicTracks.value, playlists: musicPlaylists.value }))
          break
        case 'live':
          localStorage.setItem(STORAGE_KEYS.live, JSON.stringify(liveStreamers.value))
          break
        case 'theater':
          localStorage.setItem(STORAGE_KEYS.theater, JSON.stringify(theaterDramas.value))
          break
        case 'takeaway':
          localStorage.setItem(STORAGE_KEYS.takeaway, JSON.stringify(takeawayRestaurants.value))
          break
        case 'shopping':
          localStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(shoppingProducts.value))
          break
        case 'couple':
          localStorage.setItem(STORAGE_KEYS.couple, JSON.stringify({
            letters: coupleLetters.value,
            wishes: coupleWishes.value,
            footprints: coupleFootprints.value,
          }))
          break
        case 'stock':
          localStorage.setItem(STORAGE_KEYS.stock, JSON.stringify({
            indices: stockIndices.value,
            stocks: stockItems.value,
          }))
          break
        case 'email':
          localStorage.setItem(STORAGE_KEYS.email, JSON.stringify(emailItems.value))
          break
        case 'browser':
          localStorage.setItem(STORAGE_KEYS.browser, JSON.stringify(browserResults.value))
          break
        case 'map':
          localStorage.setItem(STORAGE_KEYS.map, JSON.stringify(mapLocations.value))
          break
        case 'calendar':
          localStorage.setItem(STORAGE_KEYS.calendar, JSON.stringify(calendarEvents.value))
          break
      }
    } catch { /* ignore */ }
  }

  function loadData(type: SocialType) {
    try {
      switch (type) {
        case 'forum': {
          const saved = localStorage.getItem(STORAGE_KEYS.forum)
          if (saved) {
            forumThreads.value = JSON.parse(saved)
          }
          break
        }
        case 'weibo': {
          const saved = localStorage.getItem(STORAGE_KEYS.weibo)
          if (saved) {
            const data = JSON.parse(saved)
            weiboPosts.value = data.posts || []
            weiboHotSearches.value = data.hotSearches || []
            weiboRankings.value = data.rankings || []
          }
          break
        }
        case 'moments': {
          const saved = localStorage.getItem(STORAGE_KEYS.moments)
          if (saved) {
            moments.value = JSON.parse(saved)
          }
          break
        }
        case 'zhihu': {
          const saved = localStorage.getItem(STORAGE_KEYS.zhihu)
          if (saved) {
            zhihuQuestions.value = JSON.parse(saved)
          }
          break
        }
        case 'xiaohongshu': {
          const saved = localStorage.getItem(STORAGE_KEYS.xiaohongshu)
          if (saved) {
            xhsNotes.value = JSON.parse(saved)
          }
          break
        }
        case 'douyin': {
          const saved = localStorage.getItem(STORAGE_KEYS.douyin)
          if (saved) {
            douyinVideos.value = JSON.parse(saved)
          }
          break
        }
        case 'music': {
          const saved = localStorage.getItem(STORAGE_KEYS.music)
          if (saved) {
            const data = JSON.parse(saved)
            musicTracks.value = data.tracks || []
            musicPlaylists.value = data.playlists || []
          }
          break
        }
        case 'live': {
          const saved = localStorage.getItem(STORAGE_KEYS.live)
          if (saved) {
            liveStreamers.value = JSON.parse(saved)
          }
          break
        }
        case 'theater': {
          const saved = localStorage.getItem(STORAGE_KEYS.theater)
          if (saved) {
            theaterDramas.value = JSON.parse(saved)
          }
          break
        }
        case 'takeaway': {
          const saved = localStorage.getItem(STORAGE_KEYS.takeaway)
          if (saved) {
            takeawayRestaurants.value = JSON.parse(saved)
          }
          break
        }
        case 'shopping': {
          const saved = localStorage.getItem(STORAGE_KEYS.shopping)
          if (saved) {
            shoppingProducts.value = JSON.parse(saved)
          }
          break
        }
        case 'couple': {
          const saved = localStorage.getItem(STORAGE_KEYS.couple)
          if (saved) {
            const data = JSON.parse(saved)
            coupleLetters.value = data.letters || []
            coupleWishes.value = data.wishes || []
            coupleFootprints.value = data.footprints || []
          }
          break
        }
        case 'stock': {
          const saved = localStorage.getItem(STORAGE_KEYS.stock)
          if (saved) {
            const data = JSON.parse(saved)
            stockIndices.value = data.indices || []
            stockItems.value = data.stocks || []
          }
          break
        }
        case 'email': {
          const saved = localStorage.getItem(STORAGE_KEYS.email)
          if (saved) emailItems.value = JSON.parse(saved)
          break
        }
        case 'browser': {
          const saved = localStorage.getItem(STORAGE_KEYS.browser)
          if (saved) browserResults.value = JSON.parse(saved)
          break
        }
        case 'map': {
          const saved = localStorage.getItem(STORAGE_KEYS.map)
          if (saved) mapLocations.value = JSON.parse(saved)
          break
        }
        case 'calendar': {
          const saved = localStorage.getItem(STORAGE_KEYS.calendar)
          if (saved) calendarEvents.value = JSON.parse(saved)
          break
        }
      }
    } catch { /* ignore */ }
  }


  // ==================== 通用图片生成处理 ====================
  function handleImagePromptsGenerically(content: string, parsedData: any, saveCallback: () => void) {
    const prompts = parseImagePrompts(content)
    if (Object.keys(prompts).length === 0) {
      console.log('[Social Image Gen] 未找到 [图片提示|...] 标记，跳过生图')
      return
    }

    console.log(`[Social Image Gen] 提取到 ${Object.keys(prompts).length} 个图片提示:`, prompts)
    const shouldAutoGenerate = isSocialAutoImageGenEnabled()
    if (!shouldAutoGenerate) {
      console.log('[Social Image Gen] 社交自动生图已关闭，跳过')
    }

    const stack = [parsedData]
    const seen = new Set()

    while (stack.length > 0) {
      const curr = stack.pop()
      if (!curr || typeof curr !== 'object' || seen.has(curr)) continue
      seen.add(curr)

      if (curr.id && prompts[curr.id]) {
        curr.imagePrompt = prompts[curr.id]
        if (!curr.images) curr.images = []

        if (shouldAutoGenerate && curr.images.length === 0) {
          const itemId = curr.id
          console.log(`[Social Image Gen] 开始为 ${itemId} 生图: ${curr.imagePrompt.slice(0, 80)}...`)
          generateImageFromPrompt(curr.imagePrompt).then(url => {
            if (url) {
              curr.images.push(url)
              saveCallback()
              console.log(`[Social Image Gen] ✅ ${itemId} 生图成功，dataUrl 长度: ${url.length}`)
            }
          }).catch(err => {
            console.error(`[Social Image Gen] ❌ ${itemId} 生图失败: ${err.message}`)
          })
        }
      }

      for (const key of Object.keys(curr)) {
        if (typeof curr[key] === 'object') {
          stack.push(curr[key])
        }
      }
    }
  }

  // ==================== AI调用核心 ====================
  async function callAI(type: SocialType, action?: string): Promise<string> {
    const config = getAIConfig()
    if (!config.apiKey || !config.apiUrl || !config.model) {
      throw new Error('请先在设置中配置AI接口（API Key、API URL、模型名称）')
    }

    const prompt = buildPrompt(type, action)
    const messages: AIMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: action || '请生成内容。' },
    ]

    console.log(`[SocialAI] 调用AI (${type})，提示词长度: ${prompt.length}`)
    console.log(`[SocialAI] API配置: url=${config.apiUrl}, model=${config.model}`)

    const response = await sendAIRequest({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      model: config.model,
      messages,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      stream: false,
    })

    console.log(`[SocialAI] AI返回内容长度: ${response.content.length}`)
    console.log(`[SocialAI] AI返回内容前500字: ${response.content.slice(0, 500)}`)
    lastRawResponse.value = response.content

    return response.content
  }

  // ==================== 论坛操作 ====================
  async function generateForumContent(action?: string) {
    if (generating.value) return
    generating.value = true
    forumLoading.value = true
    lastError.value = ''

    try {
      const content = await callAI('forum', action)
      const data = parseForumContent(content)
      handleImagePromptsGenerically(content, data, () => saveData('forum'))

      if (data.threads.length > 0) {
        // 合并新帖子（避免重复id）
        const existingIds = new Set(forumThreads.value.map(t => t.id))
        for (const thread of data.threads) {
          if (existingIds.has(thread.id)) {
            thread.id = generateId('t')
          }
          forumThreads.value.unshift(thread)
        }
        saveData('forum')
      } else {
        lastError.value = 'AI未生成有效的论坛内容。请打开浏览器控制台(F12)查看AI原始回复，或检查提示词设置。'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 论坛生成失败:', e)
    } finally {
      generating.value = false
      forumLoading.value = false
    }
  }

  function getForumThread(threadId: string): ForumThread | undefined {
    return forumThreads.value.find(t => t.id === threadId)
  }

  async function forumPost(title: string, content: string) {
    const action = `用户"${getUserNameLocal()}"发布了一个新帖子：\n标题：${title}\n内容：${content}\n\n请在生成的论坛内容中包含这个帖子，并让其他角色对此帖子进行回复和互动。同时也生成一些其他帖子。`
    await generateForumContent(action)
  }

  async function forumReply(threadId: string, replyContent: string) {
    const thread = getForumThread(threadId)
    if (!thread) return

    const action = `用户"${getUserNameLocal()}"在帖子"${thread.title}"（作者：${thread.author}）下回复了：${replyContent}\n\n请在回复内容中包含用户的这条回复 [回复|${getUserNameLocal()}|${threadId}|${replyContent}]，并让其他角色继续讨论和回复。保留原有帖子和回复。`
    await generateForumContent(action)
  }

  function deleteForumThread(threadId: string) {
    forumThreads.value = forumThreads.value.filter(t => t.id !== threadId)
    saveData('forum')
  }

  function toggleForumLike(threadId: string) {
    const thread = forumThreads.value.find(t => t.id === threadId)
    if (thread) {
      thread.isLiked = !thread.isLiked
      thread.likes += thread.isLiked ? 1 : -1
      saveData('forum')
    }
  }

  function toggleReplyLike(threadId: string, replyId: string) {
    const thread = forumThreads.value.find(t => t.id === threadId)
    if (!thread) return
    const reply = thread.replies.find(r => r.id === replyId)
    if (reply) {
      reply.isLiked = !reply.isLiked
      reply.likes += reply.isLiked ? 1 : -1
      saveData('forum')
    }
  }

  // ==================== 微博操作 ====================
  async function generateWeiboContent(action?: string) {
    if (generating.value) return
    generating.value = true
    weiboLoading.value = true
    lastError.value = ''

    try {
      const content = await callAI('weibo', action)
      const data = parseWeiboContent(content)
      handleImagePromptsGenerically(content, data, () => saveData('weibo'))

      if (data.posts.length > 0 || data.hotSearches.length > 0) {
        // 合并博文
        const existingIds = new Set(weiboPosts.value.map(p => p.id))
        for (const post of data.posts) {
          if (existingIds.has(post.id)) {
            post.id = generateId('w')
          }
          weiboPosts.value.unshift(post)
        }

        // 替换热搜和榜单（实时性内容）
        if (data.hotSearches.length > 0) {
          weiboHotSearches.value = data.hotSearches
        }
        if (data.rankings.length > 0) {
          weiboRankings.value = data.rankings
        }

        saveData('weibo')
      } else {
        lastError.value = 'AI未生成有效的微博内容。请打开浏览器控制台(F12)查看AI原始回复，或检查提示词设置。'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 微博生成失败:', e)
    } finally {
      generating.value = false
      weiboLoading.value = false
    }
  }

  async function weiboPost(content: string) {
    const action = `用户"${getUserNameLocal()}"发了一条微博：${content}\n\n请在生成的微博内容中包含这条博文 [博文|${getUserNameLocal()}|new01|${content}]，并让其他角色对此进行评论互动。同时也生成其他博文和更新热搜。`
    await generateWeiboContent(action)
  }

  async function weiboReply(postId: string, replyContent: string) {
    const post = weiboPosts.value.find(p => p.id === postId)
    if (!post) return

    // 本地先添加评论
    post.comments.push({
      id: generateId('wc'),
      postId,
      author: getUserNameLocal(),
      content: replyContent,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    })
    saveData('weibo')

    // 然后让AI生成其他角色的回应
    const action = `用户"${getUserNameLocal()}"评论了${post.author}的微博"${post.content.slice(0, 30)}"，评论内容：${replyContent}\n\n请生成其他角色对此的回应评论，以及新的微博和热搜内容。`
    await generateWeiboContent(action)
  }

  function toggleWeiboLike(postId: string) {
    const post = weiboPosts.value.find(p => p.id === postId)
    if (post) {
      post.isLiked = !post.isLiked
      post.likes += post.isLiked ? 1 : -1
      saveData('weibo')
    }
  }

  function toggleWeiboCommentLike(postId: string, commentId: string) {
    const post = weiboPosts.value.find(p => p.id === postId)
    if (!post) return
    const comment = post.comments.find(c => c.id === commentId)
    if (comment) {
      comment.isLiked = !comment.isLiked
      comment.likes += comment.isLiked ? 1 : -1
      saveData('weibo')
    }
  }

  function deleteWeiboPost(postId: string) {
    weiboPosts.value = weiboPosts.value.filter(p => p.id !== postId)
    saveData('weibo')
  }

  // ==================== 朋友圈操作 ====================
  async function generateMomentsContent(action?: string) {
    if (generating.value) return
    generating.value = true
    momentsLoading.value = true
    lastError.value = ''

    try {
      const content = await callAI('moments', action)
      const data = parseMomentsContent(content)
      handleImagePromptsGenerically(content, data, () => saveData('moments'))

      if (data.moments.length > 0) {
        const existingIds = new Set(moments.value.map(m => m.id))
        for (const moment of data.moments) {
          if (existingIds.has(moment.id)) {
            moment.id = generateId('m')
          }
          moments.value.unshift(moment)
        }
        saveData('moments')
      } else {
        lastError.value = 'AI未生成有效的朋友圈内容。请打开浏览器控制台(F12)查看AI原始回复，或检查提示词设置。'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 朋友圈生成失败:', e)
    } finally {
      generating.value = false
      momentsLoading.value = false
    }
  }

  async function momentPublish(content: string) {
    // 本地先添加
    const newMoment: MomentItem = {
      id: generateId('m'),
      author: getUserNameLocal(),
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      likedBy: [],
      comments: [],
      showInteraction: false,
      commentDraft: '',
    }
    moments.value.unshift(newMoment)
    saveData('moments')

    // 让AI生成其他角色的互动
    const action = `用户"${getUserNameLocal()}"发了一条朋友圈：${content}\n\n请生成其他角色的朋友圈动态，同时让一些角色对用户的这条动态进行点赞和评论互动。`
    await generateMomentsContent(action)
  }

  async function momentComment(momentId: string, commentContent: string) {
    const moment = moments.value.find(m => m.id === momentId)
    if (!moment) return

    moment.comments.push({
      id: generateId('mc'),
      momentId,
      author: getUserNameLocal(),
      content: commentContent,
      timestamp: new Date().toISOString(),
    })
    saveData('moments')
  }

  function toggleMomentLike(momentId: string) {
    const moment = moments.value.find(m => m.id === momentId)
    if (!moment) return
    const userName = getUserNameLocal()

    if (moment.isLiked) {
      moment.isLiked = false
      moment.likes--
      moment.likedBy = moment.likedBy.filter(n => n !== userName)
    } else {
      moment.isLiked = true
      moment.likes++
      if (!moment.likedBy.includes(userName)) {
        moment.likedBy.push(userName)
      }
    }
    saveData('moments')
  }

  function deleteMoment(momentId: string) {
    moments.value = moments.value.filter(m => m.id !== momentId)
    saveData('moments')
  }

  // ==================== 知乎操作 ====================
  async function generateZhihuContent(action?: string) {
    if (generating.value) return
    generating.value = true
    zhihuLoading.value = true
    lastError.value = ''

    try {
      const content = await callAI('zhihu', action)
      const data = parseZhihuContent(content)
      handleImagePromptsGenerically(content, data, () => saveData('zhihu'))

      if (data.questions.length > 0) {
        const existingIds = new Set(zhihuQuestions.value.map(q => q.id))
        for (const question of data.questions) {
          if (existingIds.has(question.id)) {
            question.id = generateId('q')
          }
          zhihuQuestions.value.unshift(question)
        }
        saveData('zhihu')
      } else {
        lastError.value = 'AI未生成有效的知乎内容。请打开浏览器控制台(F12)查看AI原始回复，或检查提示词设置。'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 知乎生成失败:', e)
    } finally {
      generating.value = false
      zhihuLoading.value = false
    }
  }

  function toggleZhihuVote(questionId: string, answerId: string, voteType: 'up' | 'down') {
    const question = zhihuQuestions.value.find(q => q.id === questionId)
    if (!question) return
    const answer = question.answers.find(a => a.id === answerId)
    if (!answer) return

    if (voteType === 'up') {
      if (answer.isUpvoted) {
        answer.isUpvoted = false
        answer.upvotes--
      } else {
        answer.isUpvoted = true
        answer.upvotes++
        if (answer.isDownvoted) {
          answer.isDownvoted = false
          answer.downvotes--
        }
      }
    } else {
      if (answer.isDownvoted) {
        answer.isDownvoted = false
        answer.downvotes--
      } else {
        answer.isDownvoted = true
        answer.downvotes++
        if (answer.isUpvoted) {
          answer.isUpvoted = false
          answer.upvotes--
        }
      }
    }
    saveData('zhihu')
  }

  function deleteZhihuQuestion(questionId: string) {
    zhihuQuestions.value = zhihuQuestions.value.filter(q => q.id !== questionId)
    saveData('zhihu')
  }

  // ==================== 小红书操作 ====================
  async function generateXhsContent(action?: string) {
    if (generating.value) return
    generating.value = true
    xhsLoading.value = true
    lastError.value = ''

    try {
      const content = await callAI('xiaohongshu', action)
      const data = parseXhsContent(content)
      handleImagePromptsGenerically(content, data, () => saveData('xiaohongshu'))

      if (data.notes.length > 0) {
        const existingIds = new Set(xhsNotes.value.map(n => n.id))
        for (const note of data.notes) {
          if (existingIds.has(note.id)) {
            note.id = generateId('n')
          }
          xhsNotes.value.unshift(note)
        }
        saveData('xiaohongshu')
      } else {
        lastError.value = 'AI未生成有效的小红书内容。请打开浏览器控制台(F12)查看AI原始回复，或检查提示词设置。'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 小红书生成失败:', e)
    } finally {
      generating.value = false
      xhsLoading.value = false
    }
  }

  function toggleXhsLike(noteId: string) {
    const note = xhsNotes.value.find(n => n.id === noteId)
    if (note) {
      note.isLiked = !note.isLiked
      note.likes += note.isLiked ? 1 : -1
      saveData('xiaohongshu')
    }
  }

  function toggleXhsCollect(noteId: string) {
    const note = xhsNotes.value.find(n => n.id === noteId)
    if (note) {
      note.isCollected = !note.isCollected
      note.collects += note.isCollected ? 1 : -1
      saveData('xiaohongshu')
    }
  }

  function deleteXhsNote(noteId: string) {
    xhsNotes.value = xhsNotes.value.filter(n => n.id !== noteId)
    saveData('xiaohongshu')
  }

  // ==================== 抖音操作 ====================
  async function generateDouyinContent(action?: string) {
    if (generating.value) return
    generating.value = true
    douyinLoading.value = true
    lastError.value = ''

    try {
      const content = await callAI('douyin', action)
      const data = parseDouyinContent(content)
      handleImagePromptsGenerically(content, data, () => saveData('douyin'))

      if (data.videos.length > 0) {
        const existingIds = new Set(douyinVideos.value.map(v => v.id))
        for (const video of data.videos) {
          if (existingIds.has(video.id)) {
            video.id = generateId('v')
          }
          douyinVideos.value.unshift(video)
        }
        saveData('douyin')
      } else {
        lastError.value = 'AI未生成有效的抖音内容。请打开浏览器控制台(F12)查看AI原始回复，或检查提示词设置。'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 抖音生成失败:', e)
    } finally {
      generating.value = false
      douyinLoading.value = false
    }
  }

  function toggleDouyinLike(videoId: string) {
    const video = douyinVideos.value.find(v => v.id === videoId)
    if (video) {
      video.isLiked = !video.isLiked
      video.likes += video.isLiked ? 1 : -1
      saveData('douyin')
    }
  }

  function toggleDouyinCommentLike(videoId: string, commentId: string) {
    const video = douyinVideos.value.find(v => v.id === videoId)
    if (!video) return
    const comment = video.comments.find(c => c.id === commentId)
    if (comment) {
      comment.isLiked = !comment.isLiked
      comment.likes += comment.isLiked ? 1 : -1
      saveData('douyin')
    }
  }

  function deleteDouyinVideo(videoId: string) {
    douyinVideos.value = douyinVideos.value.filter(v => v.id !== videoId)
    saveData('douyin')
  }

  // ==================== 音乐操作 ====================
  async function generateMusicContent(action?: string) {
    if (generating.value) return
    generating.value = true
    musicLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('music', action)
      const data = parseMusicContent(raw)
      if (data.tracks.length > 0) {
        musicTracks.value = data.tracks
        musicPlaylists.value = data.playlists
        saveData('music')
      } else {
        lastError.value = 'AI returned no music content'
      }
    } catch (e: any) {
      lastError.value = e.message || 'Unknown error'
    } finally {
      generating.value = false
      musicLoading.value = false
    }
  }

  // ==================== 直播操作 ====================
  async function generateLiveContent(action?: string) {
    if (generating.value) return
    generating.value = true
    liveLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('live', action)
      const data = parseLiveContent(raw)
      if (data.streamers.length > 0) {
        liveStreamers.value = data.streamers
        saveData('live')
      } else {
        lastError.value = 'AI returned no live content'
      }
    } catch (e: any) {
      lastError.value = e.message || 'Unknown error'
    } finally {
      generating.value = false
      liveLoading.value = false
    }
  }

  // ==================== 小剧场操作 ====================
  async function generateTheaterContent(action?: string) {
    if (generating.value) return
    generating.value = true
    theaterLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('theater', action)
      const data = parseTheaterContent(raw)
      if (data.dramas.length > 0) {
        theaterDramas.value = data.dramas
        saveData('theater')
      } else {
        lastError.value = 'AI returned no theater content'
      }
    } catch (e: any) {
      lastError.value = e.message || 'Unknown error'
    } finally {
      generating.value = false
      theaterLoading.value = false
    }
  }

  // ==================== 外卖操作 ====================
  async function generateTakeawayContent(action?: string) {
    if (generating.value) return
    generating.value = true
    takeawayLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('takeaway', action)
      const data = parseTakeawayContent(raw)
      if (data.restaurants.length > 0) {
        takeawayRestaurants.value = data.restaurants
        saveData('takeaway')
      } else {
        lastError.value = 'AI未生成有效的外卖内容'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 外卖生成失败:', e)
    } finally {
      generating.value = false
      takeawayLoading.value = false
    }
  }

  // ==================== 购物操作 ====================
  async function generateShoppingContent(action?: string) {
    if (generating.value) return
    generating.value = true
    shoppingLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('shopping', action)
      const data = parseShoppingContent(raw)
      if (data.products.length > 0) {
        shoppingProducts.value = data.products
        saveData('shopping')
      } else {
        lastError.value = 'AI未生成有效的购物内容'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 购物生成失败:', e)
    } finally {
      generating.value = false
      shoppingLoading.value = false
    }
  }

  // ==================== 情侣空间操作 ====================
  async function generateCoupleContent(action?: string) {
    if (generating.value) return
    generating.value = true
    coupleLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('couple', action)
      const data = parseCoupleContent(raw)
      let hasData = false
      if (data.letters.length > 0) {
        const existingIds = new Set(coupleLetters.value.map(l => l.id))
        for (const letter of data.letters) {
          if (existingIds.has(letter.id)) letter.id = generateId('lt')
          coupleLetters.value.unshift(letter)
        }
        hasData = true
      }
      if (data.wishes.length > 0) {
        const existingIds = new Set(coupleWishes.value.map(w => w.id))
        for (const wish of data.wishes) {
          if (existingIds.has(wish.id)) wish.id = generateId('ws')
          coupleWishes.value.push(wish)
        }
        hasData = true
      }
      if (data.footprints.length > 0) {
        const existingIds = new Set(coupleFootprints.value.map(f => f.id))
        for (const fp of data.footprints) {
          if (existingIds.has(fp.id)) fp.id = generateId('fp')
          coupleFootprints.value.push(fp)
        }
        hasData = true
      }
      if (hasData) {
        saveData('couple')
      } else {
        lastError.value = 'AI未生成有效的情侣空间内容'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 情侣空间生成失败:', e)
    } finally {
      generating.value = false
      coupleLoading.value = false
    }
  }

  // ==================== 股票操作 ====================
  async function generateStockContent(action?: string) {
    if (generating.value) return
    generating.value = true
    stockLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('stock', action)
      const data = parseStockContent(raw)
      if (data.stocks.length > 0) {
        stockIndices.value = data.indices
        stockItems.value = data.stocks
        saveData('stock')
      } else {
        lastError.value = 'AI未生成有效的股票内容'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
      console.error('[SocialAI] 股票生成失败:', e)
    } finally {
      generating.value = false
      stockLoading.value = false
    }
  }

  // ==================== 邮箱操作 ====================
  async function generateEmailContent(action?: string) {
    if (generating.value) return
    generating.value = true
    emailLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('email', action)
      const data = parseEmailContent(raw)
      if (data.emails.length > 0) {
        emailItems.value = [...emailItems.value, ...data.emails]
        saveData('email')
      } else {
        lastError.value = 'AI未生成有效的邮箱内容'
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
    } finally {
      generating.value = false
      emailLoading.value = false
    }
  }

  // ==================== 浏览器操作 ====================
  async function generateBrowserContent(action?: string) {
    if (generating.value) return
    generating.value = true
    browserLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('browser', action)
      const data = parseBrowserContent(raw)
      if (data.results.length > 0) {
        browserResults.value = data.results
        saveData('browser')
      } else {
        lastError.value = 'AI未生成有效的搜索结果。AI返回: ' + raw.slice(0, 200)
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
    } finally {
      generating.value = false
      browserLoading.value = false
    }
  }

  // ==================== 地图操作 ====================
  async function generateMapContent(action?: string) {
    if (generating.value) return
    generating.value = true
    mapLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('map', action)
      const data = parseMapContent(raw)
      if (data.locations.length > 0) {
        mapLocations.value = data.locations
        saveData('map')
      } else {
        lastError.value = 'AI未生成有效的地图内容。AI返回: ' + raw.slice(0, 200)
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
    } finally {
      generating.value = false
      mapLoading.value = false
    }
  }

  // ==================== 日历操作 ====================
  async function generateCalendarContent(action?: string) {
    if (generating.value) return
    generating.value = true
    calendarLoading.value = true
    lastError.value = ''
    try {
      const raw = await callAI('calendar', action)
      const data = parseCalendarContent(raw)
      if (data.events.length > 0) {
        calendarEvents.value = data.events
        saveData('calendar')
      } else {
        lastError.value = 'AI未生成有效的日历内容。AI返回: ' + raw.slice(0, 200)
      }
    } catch (e: any) {
      lastError.value = e.message || '生成失败'
    } finally {
      generating.value = false
      calendarLoading.value = false
    }
  }

  // ==================== 清除数据 ====================
  function clearData(type: SocialType) {
    switch (type) {
      case 'forum':
        forumThreads.value = []
        break
      case 'weibo':
        weiboPosts.value = []
        weiboHotSearches.value = []
        weiboRankings.value = []
        break
      case 'moments':
        moments.value = []
        break
      case 'zhihu':
        zhihuQuestions.value = []
        break
      case 'xiaohongshu':
        xhsNotes.value = []
        break
      case 'douyin':
        douyinVideos.value = []
        break
      case 'music':
        musicTracks.value = []
        musicPlaylists.value = []
        break
      case 'live':
        liveStreamers.value = []
        break
      case 'theater':
        theaterDramas.value = []
        break
      case 'takeaway':
        takeawayRestaurants.value = []
        break
      case 'shopping':
        shoppingProducts.value = []
        break
      case 'couple':
        coupleLetters.value = []
        coupleWishes.value = []
        coupleFootprints.value = []
        break
      case 'stock':
        stockIndices.value = []
        stockItems.value = []
        break
      case 'email':
        emailItems.value = []
        break
      case 'browser':
        browserResults.value = []
        break
      case 'map':
        mapLocations.value = []
        break
      case 'calendar':
        calendarEvents.value = []
        break
    }
    saveData(type)
  }

  // ==================== 工具 ====================
  function getUserNameLocal(): string {
    try {
      const currentId = localStorage.getItem('currentPersonaId')
      if (currentId) {
        const charsStr = localStorage.getItem('characters')
        if (charsStr) {
          const chars = JSON.parse(charsStr)
          const user = chars.find((c: any) => c.id === currentId && c.type === 'user')
          if (user?.name) return user.name
        }
      }
    } catch { /* ignore */ }
    return '我'
  }

  return {
    // 论坛
    forumThreads,
    forumLoading,
    generateForumContent,
    getForumThread,
    forumPost,
    forumReply,
    deleteForumThread,
    toggleForumLike,
    toggleReplyLike,

    // 微博
    weiboPosts,
    weiboHotSearches,
    weiboRankings,
    weiboLoading,
    generateWeiboContent,
    weiboPost,
    weiboReply,
    toggleWeiboLike,
    toggleWeiboCommentLike,
    deleteWeiboPost,

    // 朋友圈
    moments,
    momentsLoading,
    generateMomentsContent,
    momentPublish,
    momentComment,
    toggleMomentLike,
    deleteMoment,

    // 知乎
    zhihuQuestions,
    zhihuLoading,
    generateZhihuContent,
    toggleZhihuVote,
    deleteZhihuQuestion,

    // 小红书
    xhsNotes,
    xhsLoading,
    generateXhsContent,
    toggleXhsLike,
    toggleXhsCollect,
    deleteXhsNote,

    // 抖音
    douyinVideos,
    douyinLoading,
    generateDouyinContent,
    toggleDouyinLike,
    toggleDouyinCommentLike,
    deleteDouyinVideo,

    // 音乐
    musicTracks,
    musicPlaylists,
    musicLoading,
    generateMusicContent,

    // 直播
    liveStreamers,
    liveLoading,
    generateLiveContent,

    // 小剧场
    theaterDramas,
    theaterLoading,
    generateTheaterContent,

    // 外卖
    takeawayRestaurants,
    takeawayLoading,
    generateTakeawayContent,

    // 购物
    shoppingProducts,
    shoppingLoading,
    generateShoppingContent,

    // 情侣空间
    coupleLetters,
    coupleWishes,
    coupleFootprints,
    coupleLoading,
    generateCoupleContent,

    // 股票
    stockIndices,
    stockItems,
    stockLoading,
    generateStockContent,

    // 邮箱
    emailItems,
    emailLoading,
    generateEmailContent,

    // 浏览器
    browserResults,
    browserLoading,
    generateBrowserContent,

    // 地图
    mapLocations,
    mapLoading,
    generateMapContent,

    // 日历
    calendarEvents,
    calendarLoading,
    generateCalendarContent,

    // 通用
    generating,
    lastError,
    lastRawResponse,
    loadData,
    saveData,
    clearData,
  }
})
