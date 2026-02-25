/**
 * 社交内容解析器
 * 从AI生成的文本中解析出论坛帖子、微博、朋友圈等结构化数据
 */

// ==================== 论坛数据类型 ====================

export interface ForumThread {
  id: string
  author: string
  title: string
  content: string
  replies: ForumReply[]
  timestamp: string
  likes: number
  isLiked: boolean
}

export interface ForumReply {
  id: string
  threadId: string
  author: string
  content: string
  floor: number
  timestamp: string
  type: 'reply' | 'subreply'
  parentFloor?: string
  subReplies: ForumSubReply[]
  likes: number
  isLiked: boolean
}

export interface ForumSubReply {
  id: string
  threadId: string
  author: string
  content: string
  parentFloor: string
  timestamp: string
  likes: number
  isLiked: boolean
}

export interface ForumData {
  threads: ForumThread[]
  replies: Record<string, ForumReply[]>
}

// ==================== 微博数据类型 ====================

export interface WeiboItem {
  id: string
  author: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  reposts: number
  comments: WeiboComment[]
  showComments: boolean
}

export interface WeiboComment {
  id: string
  postId: string
  author: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
}

export interface HotSearchItem {
  rank: number
  title: string
  heat: string
}

export interface RankingItem {
  name: string
  type: string
  heat?: string
}

export interface WeiboData {
  posts: WeiboItem[]
  hotSearches: HotSearchItem[]
  rankings: RankingItem[]
}

// ==================== 朋友圈数据类型 ====================

export interface MomentItem {
  id: string
  author: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  likedBy: string[]
  comments: MomentComment[]
  showInteraction: boolean
  commentDraft: string
}

export interface MomentComment {
  id: string
  momentId: string
  author: string
  content: string
  replyTo?: string
  timestamp: string
}

export interface MomentsData {
  moments: MomentItem[]
}

// ==================== 头像颜色系统 ====================

const AVATAR_COLORS = [
  'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
  '#b28cb9', '#e2b3d4', '#f7d1e6', '#d49ec2',
  '#f3c6d7', '#ec97b7', '#d66a88', '#b74d66',
  '#e3d6a7', '#c8ac6d', '#a0d8e1', '#2e8b9b',
  '#1a6369', '#0e3d45', '#6ba1e1', '#1f5e8d',
  '#b7d3a8', '#3e7b41', '#f9e79f', '#a3b4e2',
]

export function hashUsername(username: string): number {
  let hash = 0
  if (!username || username.length === 0) return hash
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getAvatarColor(username: string): string {
  const hash = hashUsername(username)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ==================== 时间工具 ====================

export function generateTimestamp(): string {
  return new Date().toISOString()
}

export function generateId(prefix: string = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ==================== 通用文本预处理 ====================

/**
 * 预处理AI返回的内容：去除markdown代码块、多余空白等
 */
function preprocessContent(content: string): string {
  let text = content || ''

  // 去除 markdown 代码块包裹（```text ... ``` 或 ```...```）
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')

  // 去除HTML代码块
  text = text.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '$1')

  return text.trim()
}

/**
 * 提取标记区域内容，如果标记不存在则返回整个文本
 */
function extractMarkedContent(content: string, startMarker: string, endMarker: string): string {
  // 1. 尝试完整标记匹配
  const fullRegex = new RegExp(`${escapeRegex(startMarker)}([\\s\\S]*?)${escapeRegex(endMarker)}`)
  const fullMatch = content.match(fullRegex)
  if (fullMatch) {
    return fullMatch[1]
  }

  // 2. 只有开始标记（结束标记被截断）
  const startIdx = content.indexOf(startMarker)
  if (startIdx !== -1) {
    console.log(`[SocialParser] 找到开始标记但未找到结束标记，取开始标记之后全部内容`)
    return content.slice(startIdx + startMarker.length)
  }

  // 3. 都没找到，返回全文
  console.log(`[SocialParser] 未找到标记 ${startMarker}，将在全文中搜索格式化内容`)
  return content
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ==================== 论坛解析器 ====================

export function parseForumContent(content: string): ForumData {
  const processed = preprocessContent(content)
  const forumContent = extractMarkedContent(processed, '<!-- FORUM_CONTENT_START -->', '<!-- FORUM_CONTENT_END -->')

  const threads: ForumThread[] = []
  const replies: Record<string, ForumReply[]> = {}

  // 解析标题: [标题|发帖人昵称|帖子id|标题内容|帖子详情] 或 [标题|发帖人昵称|帖子id|标题内容]
  // 支持5字段和4字段两种格式，也支持内容中没有结尾]的不完整条目
  const titleRegex5 = /\[标题\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  const titleRegex4 = /\[标题\|([^|]+)\|([^|]+)\|([^\]|]+)\]/g
  let m: RegExpExecArray | null

  // 先尝试5字段
  while ((m = titleRegex5.exec(forumContent)) !== null) {
    const thread: ForumThread = {
      id: m[2].trim(),
      author: m[1].trim(),
      title: m[3].trim(),
      content: m[4].trim(),
      replies: [],
      timestamp: generateTimestamp(),
      likes: Math.floor(Math.random() * 50) + 5,
      isLiked: false,
    }
    threads.push(thread)
    replies[thread.id] = []
  }

  // 如果5字段没匹配到，尝试4字段格式
  if (threads.length === 0) {
    while ((m = titleRegex4.exec(forumContent)) !== null) {
      const thread: ForumThread = {
        id: m[2].trim(),
        author: m[1].trim(),
        title: m[3].trim(),
        content: m[3].trim(),
        replies: [],
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 50) + 5,
        isLiked: false,
      }
      threads.push(thread)
      replies[thread.id] = []
    }
  }

  // 如果仍然没匹配到，尝试不完整条目（被截断的）
  if (threads.length === 0) {
    const incompleteRegex = /\[标题\|([^|\]]+)\|([^|\]]+)\|([^|\]]*)/g
    while ((m = incompleteRegex.exec(forumContent)) !== null) {
      const titleOrContent = m[3]?.trim() || '无标题'
      const thread: ForumThread = {
        id: m[2].trim() || generateId('t'),
        author: m[1].trim(),
        title: titleOrContent,
        content: titleOrContent,
        replies: [],
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 50) + 5,
        isLiked: false,
      }
      threads.push(thread)
      replies[thread.id] = []
    }
  }

  // 解析回复: [回复|回帖人昵称|帖子id|回复内容]
  const replyRegex = /\[回复\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = replyRegex.exec(forumContent)) !== null) {
    const threadId = m[2].trim()
    if (!replies[threadId]) replies[threadId] = []
    const floor = replies[threadId].length + 2

    const reply: ForumReply = {
      id: generateId('reply'),
      threadId,
      author: m[1].trim(),
      content: m[3].trim(),
      floor,
      timestamp: generateTimestamp(),
      type: 'reply',
      subReplies: [],
      likes: Math.floor(Math.random() * 10) + 1,
      isLiked: false,
    }
    replies[threadId].push(reply)
  }

  // 解析楼中楼: [楼中楼|回帖人昵称|帖子id|父楼层|回复内容]
  const subReplyRegex = /\[楼中楼\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = subReplyRegex.exec(forumContent)) !== null) {
    const threadId = m[2].trim()
    const parentFloor = m[3].trim()

    const subReply: ForumSubReply = {
      id: generateId('sub'),
      threadId,
      author: m[1].trim(),
      content: m[4].trim(),
      parentFloor,
      timestamp: generateTimestamp(),
      likes: Math.floor(Math.random() * 5),
      isLiked: false,
    }

    if (replies[threadId]) {
      const parent = replies[threadId].find(
        r => r.author === parentFloor ||
          String(r.floor) === parentFloor ||
          replies[threadId].indexOf(r) + 2 === parseInt(parentFloor)
      )
      if (parent) {
        parent.subReplies.push(subReply)
      } else {
        const floor = replies[threadId].length + 2
        replies[threadId].push({
          id: subReply.id,
          threadId,
          author: subReply.author,
          content: subReply.content,
          floor,
          timestamp: subReply.timestamp,
          type: 'reply',
          subReplies: [],
          likes: subReply.likes,
          isLiked: false,
        })
      }
    }
  }

  // 将回复绑定到帖子
  threads.forEach(thread => {
    thread.replies = replies[thread.id] || []
  })

  console.log(`[SocialParser] 论坛解析结果: ${threads.length}个帖子`)
  return { threads, replies }
}

// ==================== 微博解析器 ====================

export function parseWeiboContent(content: string): WeiboData {
  const processed = preprocessContent(content)
  const weiboContent = extractMarkedContent(processed, '<!-- WEIBO_CONTENT_START -->', '<!-- WEIBO_CONTENT_END -->')

  const posts: WeiboItem[] = []
  const hotSearches: HotSearchItem[] = []
  const rankings: RankingItem[] = []
  let m: RegExpExecArray | null

  // 解析博文: [博文|发博人昵称|博文id|博文内容]
  const postRegex = /\[博文\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = postRegex.exec(weiboContent)) !== null) {
    posts.push({
      id: m[2].trim(),
      author: m[1].trim(),
      content: m[3].trim(),
      timestamp: generateTimestamp(),
      likes: Math.floor(Math.random() * 200) + 10,
      isLiked: false,
      reposts: Math.floor(Math.random() * 50),
      comments: [],
      showComments: false,
    })
  }

  // 如果没匹配到完整博文，尝试不完整（截断）的博文
  if (posts.length === 0) {
    const incompletePostRegex = /\[博文\|([^|\]]+)\|([^|\]]+)\|([^|\]]*)/g
    while ((m = incompletePostRegex.exec(weiboContent)) !== null) {
      const content = m[3]?.trim() || '(内容被截断)'
      if (content.length > 0) {
        posts.push({
          id: m[2].trim() || generateId('w'),
          author: m[1].trim(),
          content,
          timestamp: generateTimestamp(),
          likes: Math.floor(Math.random() * 200) + 10,
          isLiked: false,
          reposts: Math.floor(Math.random() * 50),
          comments: [],
          showComments: false,
        })
      }
    }
  }

  // 解析评论: [评论|评论人昵称|博文id|评论内容]
  const commentRegex = /\[评论\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = commentRegex.exec(weiboContent)) !== null) {
    const postId = m[2].trim()
    const post = posts.find(p => p.id === postId)
    if (post) {
      post.comments.push({
        id: generateId('wc'),
        postId,
        author: m[1].trim(),
        content: m[3].trim(),
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 20),
        isLiked: false,
      })
    }
  }

  // 解析热搜: [热搜|排名|热搜标题|热度值]
  const hotRegex = /\[热搜\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = hotRegex.exec(weiboContent)) !== null) {
    hotSearches.push({
      rank: parseInt(m[1].trim()) || hotSearches.length + 1,
      title: m[2].trim(),
      heat: m[3].trim(),
    })
  }

  // 如果没匹配到完整热搜，尝试不完整的热搜
  if (hotSearches.length === 0) {
    const incompleteHotRegex = /\[热搜\|([^|\]]+)\|([^|\]]+)\|?([^|\]]*)/g
    while ((m = incompleteHotRegex.exec(weiboContent)) !== null) {
      hotSearches.push({
        rank: parseInt(m[1].trim()) || hotSearches.length + 1,
        title: m[2].trim(),
        heat: m[3]?.trim() || '热',
      })
    }
  }

  // 解析榜单: [榜单|榜单名称|榜单类型]
  const rankRegex = /\[榜单\|([^|]+)\|([^\]]+)\]/g
  while ((m = rankRegex.exec(weiboContent)) !== null) {
    rankings.push({
      name: m[1].trim(),
      type: m[2].trim(),
    })
  }

  // 如果没匹配到完整榜单，尝试不完整的榜单
  if (rankings.length === 0) {
    const incompleteRankRegex = /\[榜单\|([^|\]]+)\|?([^|\]]*)/g
    while ((m = incompleteRankRegex.exec(weiboContent)) !== null) {
      rankings.push({
        name: m[1].trim(),
        type: m[2]?.trim() || '综合',
      })
    }
  }

  console.log(`[SocialParser] 微博解析结果: ${posts.length}条博文, ${hotSearches.length}条热搜, ${rankings.length}个榜单`)
  return { posts, hotSearches, rankings }
}

// ==================== 朋友圈解析器 ====================

export function parseMomentsContent(content: string): MomentsData {
  const processed = preprocessContent(content)
  const momentsContent = extractMarkedContent(processed, '<!-- MOMENTS_CONTENT_START -->', '<!-- MOMENTS_CONTENT_END -->')

  const moments: MomentItem[] = []
  let m: RegExpExecArray | null

  // 解析动态: [动态|发布人昵称|动态id|动态内容]
  const momentRegex = /\[动态\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = momentRegex.exec(momentsContent)) !== null) {
    moments.push({
      id: m[2].trim(),
      author: m[1].trim(),
      content: m[3].trim(),
      timestamp: generateTimestamp(),
      likes: 0,
      isLiked: false,
      likedBy: [],
      comments: [],
      showInteraction: false,
      commentDraft: '',
    })
  }

  // 如果没匹配到完整动态，尝试不完整（截断）的动态
  if (moments.length === 0) {
    const incompleteMomentRegex = /\[动态\|([^|\]]+)\|([^|\]]+)\|([^|\]]*)/g
    while ((m = incompleteMomentRegex.exec(momentsContent)) !== null) {
      const content = m[3]?.trim() || '(内容被截断)'
      if (content.length > 0) {
        moments.push({
          id: m[2].trim() || generateId('m'),
          author: m[1].trim(),
          content,
          timestamp: generateTimestamp(),
          likes: 0,
          isLiked: false,
          likedBy: [],
          comments: [],
          showInteraction: false,
          commentDraft: '',
        })
      }
    }
  }

  // 解析点赞: [点赞|点赞人昵称|动态id]
  const likeRegex = /\[点赞\|([^|]+)\|([^\]]+)\]/g
  while ((m = likeRegex.exec(momentsContent)) !== null) {
    const momentId = m[2].trim()
    const moment = moments.find(mo => mo.id === momentId)
    if (moment) {
      const liker = m[1].trim()
      if (!moment.likedBy.includes(liker)) {
        moment.likedBy.push(liker)
        moment.likes++
      }
    }
  }

  // 解析评论: [评论|评论人昵称|动态id|评论内容]
  const commentRegex = /\[评论\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = commentRegex.exec(momentsContent)) !== null) {
    const momentId = m[2].trim()
    const moment = moments.find(mo => mo.id === momentId)
    if (moment) {
      moment.comments.push({
        id: generateId('mc'),
        momentId,
        author: m[1].trim(),
        content: m[3].trim(),
        timestamp: generateTimestamp(),
      })
    }
  }

  // 解析回复评论: [回复评论|回复人昵称|动态id|被回复人昵称|回复内容]
  const replyCommentRegex = /\[回复评论\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = replyCommentRegex.exec(momentsContent)) !== null) {
    const momentId = m[2].trim()
    const moment = moments.find(mo => mo.id === momentId)
    if (moment) {
      moment.comments.push({
        id: generateId('mcr'),
        momentId,
        author: m[1].trim(),
        content: m[4].trim(),
        replyTo: m[3].trim(),
        timestamp: generateTimestamp(),
      })
    }
  }

  console.log(`[SocialParser] 朋友圈解析结果: ${moments.length}条动态`)
  return { moments }
}

// ==================== 知乎数据类型 ====================

export interface ZhihuQuestion {
  id: string
  author: string
  title: string
  description: string
  answers: ZhihuAnswer[]
  timestamp: string
  followers: number
  views: number
}

export interface ZhihuAnswer {
  id: string
  questionId: string
  author: string
  content: string
  timestamp: string
  upvotes: number
  downvotes: number
  isUpvoted: boolean
  isDownvoted: boolean
  comments: ZhihuComment[]
}

export interface ZhihuComment {
  id: string
  questionId: string
  answerAuthor: string
  author: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
}

export interface ZhihuData {
  questions: ZhihuQuestion[]
}

// ==================== 小红书数据类型 ====================

export interface XhsNote {
  id: string
  author: string
  title: string
  content: string
  tags: string[]
  timestamp: string
  likes: number
  isLiked: boolean
  collects: number
  isCollected: boolean
  comments: XhsComment[]
  showComments: boolean
}

export interface XhsComment {
  id: string
  noteId: string
  author: string
  content: string
  replyTo?: string
  timestamp: string
  likes: number
  isLiked: boolean
}

export interface XhsData {
  notes: XhsNote[]
}

// ==================== 抖音数据类型 ====================

export interface DouyinVideo {
  id: string
  author: string
  description: string
  tags: string[]
  timestamp: string
  likes: number
  isLiked: boolean
  commentCount: number
  shares: number
  comments: DouyinComment[]
  showComments: boolean
}

export interface DouyinComment {
  id: string
  videoId: string
  author: string
  content: string
  replyTo?: string
  timestamp: string
  likes: number
  isLiked: boolean
  isAuthorReply: boolean
}

export interface DouyinData {
  videos: DouyinVideo[]
}

// ==================== 知乎解析器 ====================

export function parseZhihuContent(content: string): ZhihuData {
  const processed = preprocessContent(content)
  const zhihuContent = extractMarkedContent(processed, '<!-- ZHIHU_CONTENT_START -->', '<!-- ZHIHU_CONTENT_END -->')

  const questions: ZhihuQuestion[] = []
  let m: RegExpExecArray | null

  // 解析问题: [问题|提问人昵称|问题id|问题标题|问题描述]
  const questionRegex5 = /\[问题\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = questionRegex5.exec(zhihuContent)) !== null) {
    questions.push({
      id: m[2].trim(),
      author: m[1].trim(),
      title: m[3].trim(),
      description: m[4].trim(),
      answers: [],
      timestamp: generateTimestamp(),
      followers: Math.floor(Math.random() * 200) + 10,
      views: Math.floor(Math.random() * 5000) + 100,
    })
  }

  // 如果5字段没匹配到，尝试4字段
  if (questions.length === 0) {
    const questionRegex4 = /\[问题\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
    while ((m = questionRegex4.exec(zhihuContent)) !== null) {
      questions.push({
        id: m[2].trim(),
        author: m[1].trim(),
        title: m[3].trim(),
        description: '',
        answers: [],
        timestamp: generateTimestamp(),
        followers: Math.floor(Math.random() * 200) + 10,
        views: Math.floor(Math.random() * 5000) + 100,
      })
    }
  }

  // 不完整匹配
  if (questions.length === 0) {
    const incompleteRegex = /\[问题\|([^|\]]+)\|([^|\]]+)\|([^|\]]*)/g
    while ((m = incompleteRegex.exec(zhihuContent)) !== null) {
      questions.push({
        id: m[2].trim() || generateId('q'),
        author: m[1].trim(),
        title: m[3]?.trim() || '无标题问题',
        description: '',
        answers: [],
        timestamp: generateTimestamp(),
        followers: Math.floor(Math.random() * 200) + 10,
        views: Math.floor(Math.random() * 5000) + 100,
      })
    }
  }

  // 解析回答: [回答|回答人昵称|问题id|回答内容]
  const answerRegex = /\[回答\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = answerRegex.exec(zhihuContent)) !== null) {
    const qId = m[2].trim()
    const question = questions.find(q => q.id === qId)
    if (question) {
      question.answers.push({
        id: generateId('ans'),
        questionId: qId,
        author: m[1].trim(),
        content: m[3].trim(),
        timestamp: generateTimestamp(),
        upvotes: Math.floor(Math.random() * 500) + 5,
        downvotes: Math.floor(Math.random() * 10),
        isUpvoted: false,
        isDownvoted: false,
        comments: [],
      })
    }
  }

  // 解析评论: [评论|评论人昵称|问题id|回答人昵称|评论内容]
  const commentRegex = /\[评论\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = commentRegex.exec(zhihuContent)) !== null) {
    const qId = m[2].trim()
    const answerAuthor = m[3].trim()
    const question = questions.find(q => q.id === qId)
    if (question) {
      const answer = question.answers.find(a => a.author === answerAuthor)
      if (answer) {
        answer.comments.push({
          id: generateId('zc'),
          questionId: qId,
          answerAuthor,
          author: m[1].trim(),
          content: m[4].trim(),
          timestamp: generateTimestamp(),
          likes: Math.floor(Math.random() * 20),
          isLiked: false,
        })
      }
    }
  }

  console.log(`[SocialParser] 知乎解析结果: ${questions.length}个问题`)
  return { questions }
}

// ==================== 小红书解析器 ====================

export function parseXhsContent(content: string): XhsData {
  const processed = preprocessContent(content)
  const xhsContent = extractMarkedContent(processed, '<!-- XHS_CONTENT_START -->', '<!-- XHS_CONTENT_END -->')

  const notes: XhsNote[] = []
  let m: RegExpExecArray | null

  // 解析笔记: [笔记|作者昵称|笔记id|笔记标题|笔记内容|标签1,标签2,标签3]
  const noteRegex6 = /\[笔记\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = noteRegex6.exec(xhsContent)) !== null) {
    const tagsStr = m[5].trim()
    const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    notes.push({
      id: m[2].trim(),
      author: m[1].trim(),
      title: m[3].trim(),
      content: m[4].trim(),
      tags,
      timestamp: generateTimestamp(),
      likes: Math.floor(Math.random() * 1000) + 50,
      isLiked: false,
      collects: Math.floor(Math.random() * 300) + 10,
      isCollected: false,
      comments: [],
      showComments: false,
    })
  }

  // 5字段（无标签）
  if (notes.length === 0) {
    const noteRegex5 = /\[笔记\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
    while ((m = noteRegex5.exec(xhsContent)) !== null) {
      notes.push({
        id: m[2].trim(),
        author: m[1].trim(),
        title: m[3].trim(),
        content: m[4].trim(),
        tags: [],
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 1000) + 50,
        isLiked: false,
        collects: Math.floor(Math.random() * 300) + 10,
        isCollected: false,
        comments: [],
        showComments: false,
      })
    }
  }

  // 不完整匹配
  if (notes.length === 0) {
    const incompleteRegex = /\[笔记\|([^|\]]+)\|([^|\]]+)\|([^|\]]*)/g
    while ((m = incompleteRegex.exec(xhsContent)) !== null) {
      notes.push({
        id: m[2].trim() || generateId('n'),
        author: m[1].trim(),
        title: m[3]?.trim() || '无标题',
        content: '',
        tags: [],
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 1000) + 50,
        isLiked: false,
        collects: Math.floor(Math.random() * 300) + 10,
        isCollected: false,
        comments: [],
        showComments: false,
      })
    }
  }

  // 解析评论: [评论|评论人昵称|笔记id|评论内容]
  const commentRegex = /\[评论\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = commentRegex.exec(xhsContent)) !== null) {
    const noteId = m[2].trim()
    const note = notes.find(n => n.id === noteId)
    if (note) {
      note.comments.push({
        id: generateId('xc'),
        noteId,
        author: m[1].trim(),
        content: m[3].trim(),
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 50),
        isLiked: false,
      })
    }
  }

  // 解析回复: [回复|回复人昵称|笔记id|被回复人昵称|回复内容]
  const replyRegex = /\[回复\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = replyRegex.exec(xhsContent)) !== null) {
    const noteId = m[2].trim()
    const note = notes.find(n => n.id === noteId)
    if (note) {
      note.comments.push({
        id: generateId('xcr'),
        noteId,
        author: m[1].trim(),
        content: m[4].trim(),
        replyTo: m[3].trim(),
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 20),
        isLiked: false,
      })
    }
  }

  console.log(`[SocialParser] 小红书解析结果: ${notes.length}条笔记`)
  return { notes }
}

// ==================== 抖音解析器 ====================

export function parseDouyinContent(content: string): DouyinData {
  const processed = preprocessContent(content)
  const dyContent = extractMarkedContent(processed, '<!-- DOUYIN_CONTENT_START -->', '<!-- DOUYIN_CONTENT_END -->')

  const videos: DouyinVideo[] = []
  let m: RegExpExecArray | null

  // 解析视频: [视频|作者昵称|视频id|视频描述|标签1,标签2]
  const videoRegex5 = /\[视频\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = videoRegex5.exec(dyContent)) !== null) {
    const tagsStr = m[4].trim()
    const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    videos.push({
      id: m[2].trim(),
      author: m[1].trim(),
      description: m[3].trim(),
      tags,
      timestamp: generateTimestamp(),
      likes: Math.floor(Math.random() * 10000) + 100,
      isLiked: false,
      commentCount: 0,
      shares: Math.floor(Math.random() * 500) + 10,
      comments: [],
      showComments: false,
    })
  }

  // 4字段（无标签）
  if (videos.length === 0) {
    const videoRegex4 = /\[视频\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
    while ((m = videoRegex4.exec(dyContent)) !== null) {
      videos.push({
        id: m[2].trim(),
        author: m[1].trim(),
        description: m[3].trim(),
        tags: [],
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 10000) + 100,
        isLiked: false,
        commentCount: 0,
        shares: Math.floor(Math.random() * 500) + 10,
        comments: [],
        showComments: false,
      })
    }
  }

  // 不完整匹配
  if (videos.length === 0) {
    const incompleteRegex = /\[视频\|([^|\]]+)\|([^|\]]+)\|([^|\]]*)/g
    while ((m = incompleteRegex.exec(dyContent)) !== null) {
      videos.push({
        id: m[2].trim() || generateId('v'),
        author: m[1].trim(),
        description: m[3]?.trim() || '(视频内容)',
        tags: [],
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 10000) + 100,
        isLiked: false,
        commentCount: 0,
        shares: Math.floor(Math.random() * 500) + 10,
        comments: [],
        showComments: false,
      })
    }
  }

  // 解析评论: [评论|评论人昵称|视频id|评论内容]
  const commentRegex = /\[评论\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = commentRegex.exec(dyContent)) !== null) {
    const videoId = m[2].trim()
    const video = videos.find(v => v.id === videoId)
    if (video) {
      video.comments.push({
        id: generateId('dc'),
        videoId,
        author: m[1].trim(),
        content: m[3].trim(),
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 2000) + 10,
        isLiked: false,
        isAuthorReply: false,
      })
    }
  }

  // 解析回复: [回复|回复人昵称|视频id|被回复人昵称|回复内容]
  const replyRegex = /\[回复\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = replyRegex.exec(dyContent)) !== null) {
    const videoId = m[2].trim()
    const video = videos.find(v => v.id === videoId)
    if (video) {
      const replyAuthor = m[1].trim()
      const isAuthor = replyAuthor === video.author
      video.comments.push({
        id: generateId('dcr'),
        videoId,
        author: replyAuthor,
        content: m[4].trim(),
        replyTo: m[3].trim(),
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 500),
        isLiked: false,
        isAuthorReply: isAuthor,
      })
    }
  }

  // 更新评论计数
  videos.forEach(v => {
    v.commentCount = v.comments.length
  })

  console.log(`[SocialParser] 抖音解析结果: ${videos.length}条视频`)
  return { videos }
}

// ==================== 内容格式化工具 ====================

/** 格式化内容: 处理@用户、话题标签、换行 */
export function formatContent(content: string): string {
  let formatted = content
  formatted = formatted.replace(/@([^\s@]+)/g, '<span class="mention">@$1</span>')
  formatted = formatted.replace(/#([^#]+)#/g, '<span class="topic-tag">#$1#</span>')
  formatted = formatted.replace(/\n/g, '<br>')
  return formatted
}

/** 截断文本 */
export function truncateText(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

/** 格式化时间为相对时间 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}天前`
  return `${d.getMonth() + 1}-${d.getDate()}`
}
