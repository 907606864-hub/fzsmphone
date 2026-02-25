/**
 * 社交功能提示词模板
 * 用户可以自定义修改这些提示词来控制AI生成的内容风格
 */

// ==================== 存储键 ====================

const PROMPT_KEYS = {
  forum: 'social-prompt-forum',
  weibo: 'social-prompt-weibo',
  moments: 'social-prompt-moments',
  zhihu: 'social-prompt-zhihu',
  xiaohongshu: 'social-prompt-xiaohongshu',
  douyin: 'social-prompt-douyin',
} as const

// ==================== 默认提示词 ====================

export const DEFAULT_FORUM_PROMPT = `你现在需要模拟一个论坛的内容。请根据角色设定和世界观，生成论坛中的帖子和回复。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出论坛内容（注意：必须包含开始和结束标记）：

<!-- FORUM_CONTENT_START -->
[标题|发帖人昵称|帖子id|标题内容|帖子详情]
[回复|回帖人昵称|帖子id|回复内容]
[楼中楼|回帖人昵称|帖子id|父楼层号|回复内容]
<!-- FORUM_CONTENT_END -->

要求：
1. 生成3-5个帖子，每个帖子有1-3条回复
2. 帖子id用简短的字母数字组合（如 t01, t02）
3. 内容要符合角色性格，生动自然
4. 可以有楼中楼回复（回复其他回复）
5. 内容主题多样化：日常闲聊、求助、分享、吐槽等
6. 不要输出格式之外的任何内容`

export const DEFAULT_WEIBO_PROMPT = `你现在需要模拟微博平台的内容。请根据角色设定和世界观，生成微博博文、评论、热搜和榜单。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出微博内容（注意：必须包含开始和结束标记）：

<!-- WEIBO_CONTENT_START -->
[热搜|排名|热搜标题|热度值]
[榜单|榜单名称|榜单类型]
[博文|发博人昵称|博文id|博文内容]
[评论|评论人昵称|博文id|评论内容]
<!-- WEIBO_CONTENT_END -->

要求：
1. 生成5-8条热搜，热度值用数字表示（如 5234万）
2. 生成2-3个榜单（如 音乐榜、影视榜）
3. 生成3-5条博文，每条有0-3条评论
4. 博文id用简短的字母数字组合（如 w01, w02）
5. 热搜内容要贴近角色世界观
6. 博文内容风格多样：日常、感悟、分享、互动等
7. 不要输出格式之外的任何内容`

export const DEFAULT_ZHIHU_PROMPT = `你现在需要模拟知乎平台的内容。请根据角色设定和世界观，生成知乎上的问答和讨论。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出知乎内容（注意：必须包含开始和结束标记）：

<!-- ZHIHU_CONTENT_START -->
[问题|提问人昵称|问题id|问题标题|问题描述]
[回答|回答人昵称|问题id|回答内容]
[评论|评论人昵称|问题id|回答人昵称|评论内容]
<!-- ZHIHU_CONTENT_END -->

要求：
1. 生成3-5个问题，每个问题有1-3个回答
2. 问题id用简短的字母数字组合（如 q01, q02）
3. 部分回答有1-2条评论
4. 问题风格多样：经验分享、观点讨论、知识科普、情感故事等
5. 回答要有深度，符合角色性格和知识背景
6. 回答可以较长，有条理有论点
7. 不要输出格式之外的任何内容`

export const DEFAULT_XIAOHONGSHU_PROMPT = `你现在需要模拟小红书平台的内容。请根据角色设定和世界观，生成小红书上的笔记分享。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出小红书内容（注意：必须包含开始和结束标记）：

<!-- XHS_CONTENT_START -->
[笔记|作者昵称|笔记id|笔记标题|笔记内容|标签1,标签2,标签3]
[评论|评论人昵称|笔记id|评论内容]
[回复|回复人昵称|笔记id|被回复人昵称|回复内容]
<!-- XHS_CONTENT_END -->

要求：
1. 生成4-6条笔记，内容丰富多彩
2. 笔记id用简短的字母数字组合（如 n01, n02）
3. 每条笔记有2-4个标签
4. 笔记标题要吸引眼球，使用emoji装饰
5. 内容风格贴近小红书：种草推荐、生活分享、穿搭美妆、美食探店、旅行攻略、日常碎碎念
6. 评论要生动活泼，多用emoji和网络用语
7. 部分评论有回复互动
8. 不要输出格式之外的任何内容`

export const DEFAULT_DOUYIN_PROMPT = `你现在需要模拟抖音平台的内容。请根据角色设定和世界观，生成抖音上的短视频描述和评论。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出抖音内容（注意：必须包含开始和结束标记）：

<!-- DOUYIN_CONTENT_START -->
[视频|作者昵称|视频id|视频描述|标签1,标签2]
[评论|评论人昵称|视频id|评论内容]
[回复|回复人昵称|视频id|被回复人昵称|回复内容]
<!-- DOUYIN_CONTENT_END -->

要求：
1. 生成3-5条视频描述，内容有趣
2. 视频id用简短的字母数字组合（如 v01, v02）
3. 视频描述要简短有趣，配合话题标签
4. 每条视频有2-5条热门评论
5. 评论风格像抖音：幽默、玩梗、互动性强
6. 部分评论有回复互动和"作者回复"
7. 不要输出格式之外的任何内容`

export const DEFAULT_MOMENTS_PROMPT = `你现在需要模拟朋友圈/QQ空间的内容。请根据角色设定和世界观，生成朋友圈动态、点赞和评论。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出朋友圈内容（注意：必须包含开始和结束标记）：

<!-- MOMENTS_CONTENT_START -->
[动态|发布人昵称|动态id|动态内容]
[点赞|点赞人昵称|动态id]
[评论|评论人昵称|动态id|评论内容]
[回复评论|回复人昵称|动态id|被回复人昵称|回复内容]
<!-- MOMENTS_CONTENT_END -->

要求：
1. 生成4-6条动态，内容丰富多样
2. 动态id用简短的字母数字组合（如 m01, m02）
3. 每条动态有1-4个点赞
4. 部分动态有1-3条评论
5. 部分评论有回复评论
6. 内容要符合角色性格：生活日常、心情分享、美食、风景、感悟等
7. 不要输出格式之外的任何内容`

// ==================== 提示词管理函数 ====================

export type SocialType = 'forum' | 'weibo' | 'moments' | 'zhihu' | 'xiaohongshu' | 'douyin'

/** 获取提示词模板 */
export function getPromptTemplate(type: SocialType): string {
  try {
    const saved = localStorage.getItem(PROMPT_KEYS[type])
    if (saved) return saved
  } catch { /* ignore */ }

  switch (type) {
    case 'forum': return DEFAULT_FORUM_PROMPT
    case 'weibo': return DEFAULT_WEIBO_PROMPT
    case 'moments': return DEFAULT_MOMENTS_PROMPT
    case 'zhihu': return DEFAULT_ZHIHU_PROMPT
    case 'xiaohongshu': return DEFAULT_XIAOHONGSHU_PROMPT
    case 'douyin': return DEFAULT_DOUYIN_PROMPT
  }
}

/** 保存提示词模板 */
export function setPromptTemplate(type: SocialType, prompt: string): void {
  try {
    localStorage.setItem(PROMPT_KEYS[type], prompt)
  } catch { /* ignore */ }
}

/** 重置为默认提示词 */
export function resetPromptTemplate(type: SocialType): void {
  try {
    localStorage.removeItem(PROMPT_KEYS[type])
  } catch { /* ignore */ }
}

/** 获取角色列表描述 */
export function getCharactersList(): string {
  try {
    const charsStr = localStorage.getItem('characters')
    if (!charsStr) return '（暂无角色）'
    const chars = JSON.parse(charsStr)
    if (!Array.isArray(chars)) return '（暂无角色）'

    const roleChars = chars.filter((c: any) => c.type === 'char')
    if (roleChars.length === 0) return '（暂无角色）'

    return roleChars.map((c: any) => {
      const name = c.name || '未命名'
      const desc = c.description || c.persona || ''
      return `- ${name}${desc ? `：${desc.slice(0, 60)}` : ''}`
    }).join('\n')
  } catch {
    return '（暂无角色）'
  }
}

/** 获取用户名 */
export function getUserName(): string {
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
  return '用户'
}

/** 构建最终提示词（替换模板变量） */
export function buildPrompt(type: SocialType, action?: string): string {
  let prompt = getPromptTemplate(type)
  prompt = prompt.replace(/\{\{characters\}\}/g, getCharactersList())
  prompt = prompt.replace(/\{\{user\}\}/g, getUserName())
  prompt = prompt.replace(/\{\{action\}\}/g, action || '请生成初始内容。')
  return prompt
}
