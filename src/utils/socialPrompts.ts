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
  music: 'social-prompt-music',
  live: 'social-prompt-live',
  theater: 'social-prompt-theater',
  takeaway: 'social-prompt-takeaway',
  shopping: 'social-prompt-shopping',
  couple: 'social-prompt-couple',
  stock: 'social-prompt-stock',
  email: 'social-prompt-email',
  browser: 'social-prompt-browser',
  map: 'social-prompt-map',
  calendar: 'social-prompt-calendar',
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
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- FORUM_CONTENT_END -->

要求：
1. 生成3-5个帖子，每个帖子有1-3条回复
2. 帖子id用简短的字母数字组合（如 t01, t02）
3. 内容要符合角色性格，生动自然
4. 可以有楼中楼回复（回复其他回复）
5. 内容主题多样化：日常闲聊、求助、分享、吐槽等
6. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
7. 不要输出格式之外的任何内容`

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
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- WEIBO_CONTENT_END -->

要求：
1. 生成5-8条热搜，热度值用数字表示（如 5234万）
2. 生成2-3个榜单（如 音乐榜、影视榜）
3. 生成3-5条博文，每条有0-3条评论
4. 博文id用简短的字母数字组合（如 w01, w02）
5. 热搜内容要贴近角色世界观
6. 博文内容风格多样：日常、感悟、分享、互动等
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

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
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- ZHIHU_CONTENT_END -->

要求：
1. 生成3-5个问题，每个问题有1-3个回答
2. 问题id用简短的字母数字组合（如 q01, q02）
3. 部分回答有1-2条评论
4. 问题风格多样：经验分享、观点讨论、知识科普、情感故事等
5. 回答要有深度，符合角色性格和知识背景
6. 回答可以较长，有条理有论点
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

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
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- XHS_CONTENT_END -->

要求：
1. 生成4-6条笔记，内容丰富多彩
2. 笔记id用简短的字母数字组合（如 n01, n02）
3. 每条笔记有2-4个标签
4. 笔记标题要吸引眼球，使用emoji装饰
5. 内容风格贴近小红书：种草推荐、生活分享、穿搭美妆、美食探店、旅行攻略、日常碎碎念
6. 评论要生动活泼，多用emoji和网络用语
7. 部分评论有回复互动
8. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
9. 不要输出格式之外的任何内容`

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
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- DOUYIN_CONTENT_END -->

要求：
1. 生成3-5条视频描述，内容有趣
2. 视频id用简短的字母数字组合（如 v01, v02）
3. 视频描述要简短有趣，配合话题标签
4. 每条视频有2-5条热门评论
5. 评论风格像抖音：幽默、玩梗、互动性强
6. 部分评论有回复互动和"作者回复"
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

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
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- MOMENTS_CONTENT_END -->

要求：
1. 生成4-6条动态，内容丰富多样
2. 动态id用简短的字母数字组合（如 m01, m02）
3. 每条动态有1-4个点赞
4. 部分动态有1-3条评论
5. 部分评论有回复评论
6. 内容要符合角色性格：生活日常、心情分享、美食、风景、感悟等
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

export const DEFAULT_MUSIC_PROMPT = `You need to simulate a music platform. Based on the character settings and world view, generate a music playlist.

**Character list:**
{{characters}}

**User identity:** {{user}}

{{action}}

Please output music content in this format:

<!-- MUSIC_CONTENT_START -->
[song|song_name|artist|album|duration_seconds]
[playlist|playlist_name|description|song_name1,song_name2,song_name3]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- MUSIC_CONTENT_END -->

Requirements:
1. Generate 10-15 songs with diverse genres
2. Generate 2-3 playlist recommendations
3. Duration in seconds (e.g. 240 = 4 minutes)
4. Content should match the character world
5. DO NOT output anything outside the format`

export const DEFAULT_LIVE_PROMPT = `You need to simulate a live streaming platform. Based on the character settings, generate live rooms and chat messages.

**Character list:**
{{characters}}

**User identity:** {{user}}

{{action}}

Please output live content in this format:

<!-- LIVE_CONTENT_START -->
[streamer|streamer_id|name|title|category|tag1,tag2|viewer_count]
[chat|streamer_id|username|message]
[system|streamer_id|system_message]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- LIVE_CONTENT_END -->

Requirements:
1. Generate 4-6 live rooms with diverse categories (gaming, music, chat, food, outdoor)
2. Each room has 3-5 chat messages
3. streamer_id uses short alphanumeric (like s01, s02)
4. viewer_count is a number
5. Chat style should be like real live streams
6. DO NOT output anything outside the format`

export const DEFAULT_THEATER_PROMPT = `You need to simulate a short drama platform. Based on character settings, generate drama listings and comments.

**Character list:**
{{characters}}

**User identity:** {{user}}

{{action}}

Please output theater content in this format:

<!-- THEATER_CONTENT_START -->
[drama|drama_id|title|category|total_episodes|rating|description]
[comment|drama_id|commenter_name|comment_content]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- THEATER_CONTENT_END -->

Requirements:
1. Generate 4-6 short dramas of diverse categories
2. drama_id uses short alphanumeric (like d01, d02)
3. Each drama has 8-20 episodes
4. Rating is a number (like 6.5-9.8)
5. Each drama has 1-3 comments
6. Description should be engaging and match characters world
7. DO NOT output anything outside the format`

export const DEFAULT_TAKEAWAY_PROMPT = `你现在需要模拟一个外卖平台的餐厅列表和菜单。请根据角色设定和世界观，生成符合当前世界观的餐厅和菜品数据。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出外卖内容：

<!-- TAKEAWAY_CONTENT_START -->
[餐厅|餐厅名称|分类|评分|配送时间|起送价]
[菜品|餐厅名称|菜品名称|价格]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- TAKEAWAY_CONTENT_END -->

要求：
1. 生成10-15个餐厅
2. 分类包括：快餐、中餐、火锅、烧烤、甜品、饮品等
3. 评分用数字（如4.5、4.8）
4. 配送时间用文字表示（如"25-35分钟"）
5. 起送价用数字（如20、0表示无起送）
6. 每个餐厅生成3-5个菜品，菜品价格用数字（如28、15.9）
7. 菜品名称要具体（如"红烧排骨"而非"套餐A"）
8. 餐厅名称要生动有特色，符合角色世界观
9. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
10. 不要输出格式之外的任何内容`

export const DEFAULT_COUPLE_PROMPT = `你现在需要为情侣空间生成内容。请根据角色设定和世界观，生成情书、心愿和足迹数据。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出情侣空间内容：

<!-- COUPLE_CONTENT_START -->
[情书|发送人|接收人|情书标题|情书内容]
[心愿|提出人|心愿内容|分类]
[足迹|地点名称|日期|备注|推荐理由]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- COUPLE_CONTENT_END -->

要求：
1. 生成3-5封情书，内容要浪漫动人，符合角色性格
2. 生成5-8个心愿，分类包括：旅行、美食、体验、纪念、日常
3. 生成5-8个足迹/约会地点，包含推荐理由
4. 情书内容要有文学性，可以引用诗句或使用修辞
5. 心愿要有创意，既有简单日常的也有浪漫特别的
6. 足迹地点要有趣，备注要温馨
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

export const DEFAULT_SHOPPING_PROMPT = `你现在需要模拟一个购物平台的商品列表。请根据角色设定和世界观，生成符合当前世界观的商品数据。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出购物内容：

<!-- SHOPPING_CONTENT_START -->
[商品|商品名称|分类|价格|原价|商品描述]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- SHOPPING_CONTENT_END -->

要求：
1. 生成12-20个商品
2. 分类包括：服饰、数码、美妆、食品、生活、书籍等
3. 价格和原价用数字（妆99.9、129.0）
4. 商品描述要简短吸引人
5. 商品名称要生动有特色，符合角色世界观
6. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
7. 不要输出格式之外的任何内容`

export const DEFAULT_STOCK_PROMPT = `你现在需要模拟一个股票行情平台的数据。请根据角色设定和世界观，生成符合当前世界观的股票和指数数据。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出股票内容：

<!-- STOCK_CONTENT_START -->
[指数|指数名称|数值|涨跌幅]
[股票|股票代码|股票名称|当前价格|涨跌幅|成交量|市值|市盈率]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- STOCK_CONTENT_END -->

要求：
1. 生成3个指数（如上证指数、深证成指、创业板指）
2. 生成8-12只股票
3. 涨跌幅用百分比数字表示（如1.25、-0.68）
4. 价格用数字表示（如1688.50）
5. 成交量用文字表示（如"3.2万手"）
6. 市值用文字表示（如"2.12万亿"、"6088亿"）
7. 市盈率用数字表示（如33.5）
8. 股票名称和数据要符合角色世界观
9. 涨跌要有正有负，真实自然
10. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
11. 不要输出格式之外的任何内容`

export const DEFAULT_EMAIL_PROMPT = `你现在需要模拟一个邮箱系统的收件箱。请根据角色设定和世界观，生成用户收到的邮件。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出邮件内容：

<!-- EMAIL_CONTENT_START -->
[邮件|发件人姓名|发件人邮箱|主题|预览|正文内容]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- EMAIL_CONTENT_END -->

要求：
1. 生成5-8封邮件，类型多样
2. 发件人邮箱用合理的格式（如 name@example.com）
3. 邮件类型包括：朋友来信、工作邮件、广告推送、系统通知、订阅内容等
4. 预览是正文的简短摘要（一句话）
5. 正文内容要完整自然，符合邮件书写风格
6. 内容要符合角色世界观
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

export const DEFAULT_BROWSER_PROMPT = `你现在需要模拟一个浏览器搜索引擎。请根据角色设定和世界观，生成搜索结果页面。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出搜索结果：

<!-- BROWSER_CONTENT_START -->
[搜索结果|标题|网址|摘要|详细内容]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- BROWSER_CONTENT_END -->

要求：
1. 生成8-12条搜索结果
2. 网址用符合世界观的虚构域名（如 www.example.com/article/xxx）
3. 摘要简短、突出关键词
4. 详细内容是文章的主要内容（3-5句话）
5. 结果类型多样：新闻、百科、论坛、博客、视频描述等
6. 内容要贴合角色世界观
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

export const DEFAULT_MAP_PROMPT = `你现在需要模拟一个地图应用。请根据角色设定和世界观，生成当前可见的地点及其实时状态。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出地图内容：

<!-- MAP_CONTENT_START -->
[地点|地点名称|类型|描述|在场角色|正在发生的事件]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- MAP_CONTENT_END -->

要求：
1. 生成6-10个地点
2. 类型包括：住宅、商业、学校、公园、餐厅、景点、办公、娱乐等
3. 描述要生动，营造场景感
4. 在场角色用角色名，多人用逗号分隔，无人时写"无"
5. 事件简述当前正在发生的事，无事件写"平静"
6. 地点要符合角色世界观
7. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
8. 不要输出格式之外的任何内容`

export const DEFAULT_CALENDAR_PROMPT = `你现在需要模拟一个日历应用。请根据角色设定和世界观，生成近期的日程事件。

**角色列表：**
{{characters}}

**用户身份：** {{user}}

{{action}}

请严格按照以下格式输出日历内容：

<!-- CALENDAR_CONTENT_START -->
[事件|标题|日期|时间|类型|描述|参与人]
[图片提示|关联id|图片的英文提示词描述(用逗号分隔的短语，相片级质量)]
<!-- CALENDAR_CONTENT_END -->

要求：
1. 生成8-15个事件
2. 日期从今天起前后7天内，格式为 YYYY-MM-DD
3. 时间格式为 HH:MM（如 09:30）
4. 类型包括：约会、工作、学习、社交、节日、私人、娱乐
5. 描述简述事件内容
6. 参与人用角色名，多人用逗号分隔
7. 事件要符合角色关系和世界观
8. 事件时间要合理分布，不能全部集中在同一天
9. 如果某条内容适合配图（如分享相片、展示画面等），请务必生成一条相应的[图片提示]数据，关联id为你这配图对应的主体id（如帖子id、博文id等），提示词必须是英文且为stable diffusion风格（如：1girl, selfie, sunny day, high quality）
10. 不要输出格式之外的任何内容`

// ==================== Prompt management functions ====================

export type SocialType = 'forum' | 'weibo' | 'moments' | 'zhihu' | 'xiaohongshu' | 'douyin' | 'music' | 'live' | 'theater' | 'takeaway' | 'shopping' | 'couple' | 'stock' | 'email' | 'browser' | 'map' | 'calendar'

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
    case 'music': return DEFAULT_MUSIC_PROMPT
    case 'live': return DEFAULT_LIVE_PROMPT
    case 'theater': return DEFAULT_THEATER_PROMPT
    case 'takeaway': return DEFAULT_TAKEAWAY_PROMPT
    case 'shopping': return DEFAULT_SHOPPING_PROMPT
    case 'couple': return DEFAULT_COUPLE_PROMPT
    case 'stock': return DEFAULT_STOCK_PROMPT
    case 'email': return DEFAULT_EMAIL_PROMPT
    case 'browser': return DEFAULT_BROWSER_PROMPT
    case 'map': return DEFAULT_MAP_PROMPT
    case 'calendar': return DEFAULT_CALENDAR_PROMPT
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
