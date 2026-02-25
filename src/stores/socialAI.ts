/**
 * 社交AI统一Store
 * 管理论坛、微博、朋友圈的AI生成数据
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sendAIRequest } from '@/utils/aiService'
import type { AIMessage } from '@/utils/aiService'
import { buildPrompt } from '@/utils/socialPrompts'
import type { SocialType } from '@/utils/socialPrompts'
import {
  parseForumContent,
  parseWeiboContent,
  parseMomentsContent,
  generateId,
} from '@/utils/socialParsers'
import type {
  ForumThread,
  ForumReply,
  WeiboItem,
  WeiboComment,
  HotSearchItem,
  RankingItem,
  MomentItem,
  MomentComment,
} from '@/utils/socialParsers'

// ==================== 存储键 ====================
const STORAGE_KEYS = {
  forum: 'social-data-forum',
  weibo: 'social-data-weibo',
  moments: 'social-data-moments',
}

// ==================== AI配置读取 ====================
function getAIConfig() {
  try {
    const saved = localStorage.getItem('fzsm-settings')
    if (saved) {
      const s = JSON.parse(saved)
      const apiKey = s.apiKey || ''
      const apiUrl = s.apiUrl === 'custom' ? (s.customApiUrl || '') : (s.apiUrl || '')
      const model = s.model || ''
      const maxTokens = s.maxLength || 4000
      const temperature = s.temperature ?? 0.9
      return { apiKey, apiUrl, model, maxTokens, temperature }
    }
    return { apiKey: '', apiUrl: '', model: '', maxTokens: 4000, temperature: 0.9 }
  } catch {
    return { apiKey: '', apiUrl: '', model: '', maxTokens: 4000, temperature: 0.9 }
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
      }
    } catch { /* ignore */ }
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

    // 通用
    generating,
    lastError,
    lastRawResponse,
    loadData,
    saveData,
    clearData,
  }
})
