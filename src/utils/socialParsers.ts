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

/** Format time as relative time */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return `${d.getMonth() + 1}-${d.getDate()}`
}

// ==================== Music types ====================

export interface MusicTrack {
  id: string
  name: string
  artist: string
  album: string
  duration: number // seconds
}

export interface MusicPlaylist {
  id: string
  name: string
  description: string
  trackNames: string[]
}

export interface MusicData {
  tracks: MusicTrack[]
  playlists: MusicPlaylist[]
}

// ==================== Live types ====================

export interface LiveStreamer {
  id: string
  name: string
  title: string
  category: string
  tags: string[]
  viewers: number
  isLive: boolean
  bgGradient: string
  avatar: string
  followed: boolean
  chatMessages: LiveChatMsg[]
}

export interface LiveChatMsg {
  id: string
  streamerId: string
  user: string
  text: string
  type: 'user' | 'system' | 'gift'
  color: string
}

export interface LiveData {
  streamers: LiveStreamer[]
}

// ==================== Theater types ====================

export interface TheaterDrama {
  id: string
  title: string
  category: string
  episodes: number[]
  rating: number
  desc: string
  emoji: string
  bgGradient: string
  views: number
  comments: TheaterComment[]
}

export interface TheaterComment {
  id: string
  dramaId: string
  author: string
  content: string
  timestamp: string
  likes: number
  liked: boolean
}

export interface TheaterData {
  dramas: TheaterDrama[]
}

// ==================== Music parser ====================

export function parseMusicContent(raw: string): MusicData {
  const tracks: MusicTrack[] = []
  const playlists: MusicPlaylist[] = []

  const startMarker = '<!-- MUSIC_CONTENT_START -->'
  const endMarker = '<!-- MUSIC_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // Parse songs: [song|name|artist|album|duration]
  const songRe = /\[song\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/gi
  while ((m = songRe.exec(content)) !== null) {
    tracks.push({
      id: generateId('trk'),
      name: m[1].trim(),
      artist: m[2].trim(),
      album: m[3].trim(),
      duration: parseInt(m[4].trim()) || 240,
    })
  }

  // Also try Chinese format
  const songReCn = /\[歌曲\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = songReCn.exec(content)) !== null) {
    tracks.push({
      id: generateId('trk'),
      name: m[1].trim(),
      artist: m[2].trim(),
      album: m[3].trim(),
      duration: parseInt(m[4].trim()) || 240,
    })
  }

  // Parse playlists: [playlist|name|desc|songs]
  const plRe = /\[playlist\|([^|]+)\|([^|]+)\|([^\]]+)\]/gi
  while ((m = plRe.exec(content)) !== null) {
    playlists.push({
      id: generateId('pl'),
      name: m[1].trim(),
      description: m[2].trim(),
      trackNames: m[3].split(',').map(s => s.trim()),
    })
  }

  const plReCn = /\[歌单\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = plReCn.exec(content)) !== null) {
    playlists.push({
      id: generateId('pl'),
      name: m[1].trim(),
      description: m[2].trim(),
      trackNames: m[3].split(',').map(s => s.trim()),
    })
  }

  console.log(`[SocialParser] Music: ${tracks.length} tracks, ${playlists.length} playlists`)
  return { tracks, playlists }
}

// ==================== Live parser ====================

const gradients = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)',
  'linear-gradient(135deg, #89f7fe, #66a6ff)',
]

const avatars = ['◎', '♪', '◈', '△', '▶', '◌', '♪', '➤', '◎', '◈']

export function parseLiveContent(raw: string): LiveData {
  const streamers: LiveStreamer[] = []

  const startMarker = '<!-- LIVE_CONTENT_START -->'
  const endMarker = '<!-- LIVE_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // Parse streamers: [streamer|id|name|title|category|tags|viewers]
  const streamerRe = /\[(?:streamer|主播)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/gi
  while ((m = streamerRe.exec(content)) !== null) {
    const sid = m[1].trim()
    streamers.push({
      id: sid,
      name: m[2].trim(),
      title: m[3].trim(),
      category: m[4].trim(),
      tags: m[5].split(',').map(s => s.trim()),
      viewers: parseInt(m[6].trim()) || Math.floor(Math.random() * 50000),
      isLive: true,
      bgGradient: gradients[streamers.length % gradients.length],
      avatar: avatars[streamers.length % avatars.length],
      followed: false,
      chatMessages: [],
    })
  }

  // Parse chat messages: [chat|streamer_id|username|message]
  const chatRe = /\[(?:chat|弹幕)\|([^|]+)\|([^|]+)\|([^\]]+)\]/gi
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#a55eea', '#fd79a8']
  while ((m = chatRe.exec(content)) !== null) {
    const sid = m[1].trim()
    const streamer = streamers.find(s => s.id === sid)
    if (streamer) {
      streamer.chatMessages.push({
        id: generateId('chat'),
        streamerId: sid,
        user: m[2].trim(),
        text: m[3].trim(),
        type: 'user',
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
  }

  // Parse system messages: [system|streamer_id|message]
  const sysRe = /\[(?:system|系统)\|([^|]+)\|([^\]]+)\]/gi
  while ((m = sysRe.exec(content)) !== null) {
    const sid = m[1].trim()
    const streamer = streamers.find(s => s.id === sid)
    if (streamer) {
      streamer.chatMessages.push({
        id: generateId('sys'),
        streamerId: sid,
        user: 'system',
        text: m[2].trim(),
        type: 'system',
        color: '#ffd700',
      })
    }
  }

  console.log(`[SocialParser] Live: ${streamers.length} streamers`)
  return { streamers }
}

// ==================== Theater parser ====================

const dramaEmojis = ['▷', '♥', '✕', '◎', '◠', '★', '◈', '✿']
const dramaGradients = [
  'linear-gradient(135deg, #ff9a9e, #fad0c4)',
  'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)',
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
]

export function parseTheaterContent(raw: string): TheaterData {
  const dramas: TheaterDrama[] = []

  const startMarker = '<!-- THEATER_CONTENT_START -->'
  const endMarker = '<!-- THEATER_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // Parse dramas: [drama|id|title|category|episodes|rating|desc]
  const dramaRe = /\[(?:drama|剧目)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/gi
  while ((m = dramaRe.exec(content)) !== null) {
    const episodeCount = parseInt(m[4].trim()) || 12
    const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1)
    dramas.push({
      id: m[1].trim(),
      title: m[2].trim(),
      category: m[3].trim(),
      episodes,
      rating: parseFloat(m[5].trim()) || 8.0,
      desc: m[6].trim(),
      emoji: dramaEmojis[dramas.length % dramaEmojis.length],
      bgGradient: dramaGradients[dramas.length % dramaGradients.length],
      views: Math.floor(Math.random() * 1000000) + 100000,
      comments: [],
    })
  }

  // Parse comments: [comment|drama_id|author|content]
  const commentRe = /\[(?:comment|评论)\|([^|]+)\|([^|]+)\|([^\]]+)\]/gi
  while ((m = commentRe.exec(content)) !== null) {
    const did = m[1].trim()
    const drama = dramas.find(d => d.id === did)
    if (drama) {
      drama.comments.push({
        id: generateId('tc'),
        dramaId: did,
        author: m[2].trim(),
        content: m[3].trim(),
        timestamp: generateTimestamp(),
        likes: Math.floor(Math.random() * 200),
        liked: false,
      })
    }
  }

  console.log(`[SocialParser] Theater: ${dramas.length} dramas`)
  return { dramas }
}

export interface TakeawayMenuItem {
  name: string
  price: number
}

export interface TakeawayRestaurant {
  id: string
  name: string
  category: string
  rating: number
  delivery_time: string
  min_order: number
  image_url: string
  menu: TakeawayMenuItem[]
}

export interface TakeawayData {
  restaurants: TakeawayRestaurant[]
}

// ==================== 购物数据类型 ====================

export interface ShoppingProduct {
  id: string
  name: string
  category: string
  price: number
  originalPrice: number
  description: string
  iconKey: string
  sales: number
  fav: boolean
}

export interface ShoppingData {
  products: ShoppingProduct[]
}

// ==================== 外卖解析器 ====================

const CATEGORY_ICON_KEYS = ['star', 'fire', 'food', 'bowl', 'pot', 'cake', 'cup']

export function parseTakeawayContent(raw: string): TakeawayData {
  const restaurants: TakeawayRestaurant[] = []

  const startMarker = '<!-- TAKEAWAY_CONTENT_START -->'
  const endMarker = '<!-- TAKEAWAY_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // [餐厅|名称|分类|评分|配送时间|起送价]
  const restRe = /\[餐厅\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = restRe.exec(content)) !== null) {
    restaurants.push({
      id: generateId('r'),
      name: m[1].trim(),
      category: m[2].trim(),
      rating: parseFloat(m[3].trim()) || 4.5,
      delivery_time: m[4].trim(),
      min_order: parseFloat(m[5].trim()) || 0,
      image_url: '',
      menu: [],
    })
  }

  // [菜品|餐厅名称|菜品名称|价格]
  const menuRe = /\[菜品\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = menuRe.exec(content)) !== null) {
    const restName = m[1].trim()
    const rest = restaurants.find(r => r.name === restName)
    if (rest) {
      rest.menu.push({
        name: m[2].trim(),
        price: parseFloat(m[3].trim()) || 15,
      })
    }
  }

  console.log(`[SocialParser] Takeaway: ${restaurants.length} restaurants`)
  return { restaurants }
}

// ==================== 购物解析器 ====================

export function parseShoppingContent(raw: string): ShoppingData {
  const products: ShoppingProduct[] = []

  const startMarker = '<!-- SHOPPING_CONTENT_START -->'
  const endMarker = '<!-- SHOPPING_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  const iconKeys = ['shirt', 'shoe', 'bag', 'phone', 'headphone', 'book', 'watch', 'cosmetic', 'food', 'gift']

  // [商品|名称|分类|价格|原价|描述]
  const prodRe = /\[商品\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = prodRe.exec(content)) !== null) {
    products.push({
      id: generateId('p'),
      name: m[1].trim(),
      category: m[2].trim(),
      price: parseFloat(m[3].trim()) || 99,
      originalPrice: parseFloat(m[4].trim()) || 129,
      description: m[5].trim(),
      iconKey: iconKeys[products.length % iconKeys.length],
      sales: Math.floor(Math.random() * 5000) + 100,
      fav: false,
    })
  }

  console.log(`[SocialParser] Shopping: ${products.length} products`)
  return { products }
}

// ==================== 情侣空间数据类型 ====================

export interface LoveLetter {
  id: string
  from: string
  to: string
  title: string
  content: string
  timestamp: string
}

export interface WishItem {
  id: string
  author: string
  content: string
  category: string
  done: boolean
  timestamp: string
}

export interface FootprintItem {
  id: string
  place: string
  date: string
  note: string
  reason: string
  visited: boolean
}

export interface CoupleData {
  letters: LoveLetter[]
  wishes: WishItem[]
  footprints: FootprintItem[]
}

// ==================== 情侣空间解析器 ====================

export function parseCoupleContent(raw: string): CoupleData {
  const letters: LoveLetter[] = []
  const wishes: WishItem[] = []
  const footprints: FootprintItem[] = []

  const startMarker = '<!-- COUPLE_CONTENT_START -->'
  const endMarker = '<!-- COUPLE_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // [情书|发送人|接收人|情书标题|情书内容]
  const letterRe = /\[情书\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = letterRe.exec(content)) !== null) {
    letters.push({
      id: generateId('lt'),
      from: m[1].trim(),
      to: m[2].trim(),
      title: m[3].trim(),
      content: m[4].trim(),
      timestamp: generateTimestamp(),
    })
  }

  // [心愿|提出人|心愿内容|分类]
  const wishRe = /\[心愿\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = wishRe.exec(content)) !== null) {
    wishes.push({
      id: generateId('ws'),
      author: m[1].trim(),
      content: m[2].trim(),
      category: m[3].trim(),
      done: false,
      timestamp: generateTimestamp(),
    })
  }

  // [足迹|地点名称|日期|备注|推荐理由]
  const footRe = /\[足迹\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = footRe.exec(content)) !== null) {
    footprints.push({
      id: generateId('fp'),
      place: m[1].trim(),
      date: m[2].trim(),
      note: m[3].trim(),
      reason: m[4].trim(),
      visited: false,
    })
  }

  console.log(`[SocialParser] Couple: ${letters.length} letters, ${wishes.length} wishes, ${footprints.length} footprints`)
  return { letters, wishes, footprints }
}

// ==================== 股票数据类型 ====================

export interface StockIndex {
  name: string
  value: number
  change: number
}

export interface StockItem {
  code: string
  name: string
  price: number
  change: number
  volume: string
  marketCap: string
  pe: string
}

export interface StockData {
  indices: StockIndex[]
  stocks: StockItem[]
}

// ==================== 股票解析器 ====================

export function parseStockContent(raw: string): StockData {
  const indices: StockIndex[] = []
  const stocks: StockItem[] = []

  const startMarker = '<!-- STOCK_CONTENT_START -->'
  const endMarker = '<!-- STOCK_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // [指数|指数名称|数值|涨跌幅]
  const idxRe = /\[指数\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = idxRe.exec(content)) !== null) {
    indices.push({
      name: m[1].trim(),
      value: parseFloat(m[2].trim()) || 3000,
      change: parseFloat(m[3].trim()) || 0,
    })
  }

  // [股票|代码|名称|价格|涨跌幅|成交量|市值|市盈率]
  const stockRe = /\[股票\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = stockRe.exec(content)) !== null) {
    stocks.push({
      code: m[1].trim(),
      name: m[2].trim(),
      price: parseFloat(m[3].trim()) || 100,
      change: parseFloat(m[4].trim()) || 0,
      volume: m[5].trim(),
      marketCap: m[6].trim(),
      pe: m[7].trim(),
    })
  }

  console.log(`[SocialParser] Stock: ${indices.length} indices, ${stocks.length} stocks`)
  return { indices, stocks }
}

// ==================== 邮箱数据类型 ====================

export interface EmailItem {
  id: string
  senderName: string
  senderEmail: string
  subject: string
  preview: string
  content: string
  timestamp: string
  isRead: boolean
  isStarred: boolean
  folder: 'inbox' | 'sent' | 'draft'
}

export interface EmailData {
  emails: EmailItem[]
}

// ==================== 邮箱解析器 ====================

export function parseEmailContent(raw: string): EmailData {
  const emails: EmailItem[] = []

  const startMarker = '<!-- EMAIL_CONTENT_START -->'
  const endMarker = '<!-- EMAIL_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // [邮件|发件人姓名|发件人邮箱|主题|预览|正文内容]
  const emailRe6 = /\[邮件\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = emailRe6.exec(content)) !== null) {
    emails.push({
      id: generateId('em'),
      senderName: m[1].trim(),
      senderEmail: m[2].trim(),
      subject: m[3].trim(),
      preview: m[4].trim(),
      content: m[5].trim(),
      timestamp: generateTimestamp(),
      isRead: false,
      isStarred: false,
      folder: 'inbox',
    })
  }

  // 5字段（无预览，预览=正文前30字）
  if (emails.length === 0) {
    const emailRe5 = /\[邮件\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
    while ((m = emailRe5.exec(content)) !== null) {
      const body = m[4].trim()
      emails.push({
        id: generateId('em'),
        senderName: m[1].trim(),
        senderEmail: m[2].trim(),
        subject: m[3].trim(),
        preview: body.slice(0, 60) + (body.length > 60 ? '...' : ''),
        content: body,
        timestamp: generateTimestamp(),
        isRead: false,
        isStarred: false,
        folder: 'inbox',
      })
    }
  }

  // 不完整匹配
  if (emails.length === 0) {
    const incompleteRe = /\[邮件\|([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|?([^|\]]*)/g
    while ((m = incompleteRe.exec(content)) !== null) {
      const body = m[4]?.trim() || '(内容被截断)'
      emails.push({
        id: generateId('em'),
        senderName: m[1].trim(),
        senderEmail: m[2].trim(),
        subject: m[3].trim(),
        preview: body.slice(0, 60),
        content: body,
        timestamp: generateTimestamp(),
        isRead: false,
        isStarred: false,
        folder: 'inbox',
      })
    }
  }

  console.log(`[SocialParser] Email: ${emails.length} emails`)
  return { emails }
}

// ==================== 浏览器数据类型 ====================

export interface BrowserResult {
  id: string
  title: string
  url: string
  summary: string
  content: string
}

export interface BrowserData {
  results: BrowserResult[]
  query: string
}

// ==================== 浏览器解析器 ====================

export function parseBrowserContent(raw: string): BrowserData {
  const results: BrowserResult[] = []

  const startMarker = '<!-- BROWSER_CONTENT_START -->'
  const endMarker = '<!-- BROWSER_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // [搜索结果|标题|网址|摘要|详细内容]
  const resultRe5 = /\[搜索结果\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = resultRe5.exec(content)) !== null) {
    results.push({
      id: generateId('br'),
      title: m[1].trim(),
      url: m[2].trim(),
      summary: m[3].trim(),
      content: m[4].trim(),
    })
  }

  // 4字段（无详细内容）
  if (results.length === 0) {
    const resultRe4 = /\[搜索结果\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
    while ((m = resultRe4.exec(content)) !== null) {
      results.push({
        id: generateId('br'),
        title: m[1].trim(),
        url: m[2].trim(),
        summary: m[3].trim(),
        content: m[3].trim(),
      })
    }
  }

  console.log(`[SocialParser] Browser: ${results.length} results`)
  return { results, query: '' }
}

// ==================== 地图数据类型 ====================

export interface MapLocation {
  id: string
  name: string
  type: string
  description: string
  characters: string[]
  events: string[]
}

export interface MapData {
  locations: MapLocation[]
}

// ==================== 地图解析器 ====================

export function parseMapContent(raw: string): MapData {
  const locations: MapLocation[] = []

  const startMarker = '<!-- MAP_CONTENT_START -->'
  const endMarker = '<!-- MAP_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // [地点|地点名称|类型|描述|在场角色|正在发生的事件]
  const locRe = /\[地点\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = locRe.exec(content)) !== null) {
    locations.push({
      id: generateId('loc'),
      name: m[1].trim(),
      type: m[2].trim(),
      description: m[3].trim(),
      characters: m[4].trim().split(/[,，、]/).map(s => s.trim()).filter(Boolean),
      events: m[5].trim().split(/[,，、]/).map(s => s.trim()).filter(Boolean),
    })
  }

  // 4字段（无事件）
  if (locations.length === 0) {
    const locRe4 = /\[地点\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
    while ((m = locRe4.exec(content)) !== null) {
      locations.push({
        id: generateId('loc'),
        name: m[1].trim(),
        type: m[2].trim(),
        description: m[3].trim(),
        characters: m[4].trim().split(/[,，、]/).map(s => s.trim()).filter(Boolean),
        events: [],
      })
    }
  }

  console.log(`[SocialParser] Map: ${locations.length} locations`)
  return { locations }
}

// ==================== 日历数据类型 ====================

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: string
  description: string
  participants: string[]
}

export interface CalendarData {
  events: CalendarEvent[]
}

// ==================== 日历解析器 ====================

export function parseCalendarContent(raw: string): CalendarData {
  const events: CalendarEvent[] = []

  const startMarker = '<!-- CALENDAR_CONTENT_START -->'
  const endMarker = '<!-- CALENDAR_CONTENT_END -->'
  const startIdx = raw.indexOf(startMarker)
  const endIdx = raw.indexOf(endMarker)
  const content = startIdx >= 0 && endIdx >= 0
    ? raw.slice(startIdx + startMarker.length, endIdx)
    : raw

  let m: RegExpExecArray | null

  // [事件|标题|日期|时间|类型|描述|参与人]
  const evtRe7 = /\[事件\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
  while ((m = evtRe7.exec(content)) !== null) {
    events.push({
      id: generateId('evt'),
      title: m[1].trim(),
      date: m[2].trim(),
      time: m[3].trim(),
      type: m[4].trim(),
      description: m[5].trim(),
      participants: m[6].trim().split(/[,，、]/).map(s => s.trim()).filter(Boolean),
    })
  }

  // 6字段（无参与人）
  if (events.length === 0) {
    const evtRe6 = /\[事件\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
    while ((m = evtRe6.exec(content)) !== null) {
      events.push({
        id: generateId('evt'),
        title: m[1].trim(),
        date: m[2].trim(),
        time: m[3].trim(),
        type: m[4].trim(),
        description: m[5].trim(),
        participants: [],
      })
    }
  }

  console.log(`[SocialParser] Calendar: ${events.length} events`)
  return { events }
}

