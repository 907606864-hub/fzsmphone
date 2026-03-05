# 更新日志 (Changelog)

## [Unreleased] - 2026-03-05

### 新增 (Added)

- **AI后台生图代理**：在 `server/internal/handlers/ai_proxy.go` 中新增 `/api/ai/image` 接口代理，彻底解决直接调用生图平台的跨域和HTTPS问题（涵盖 NovelAI、OpenAI DALL-E 3、GeminiImagen 引擎支持）。
- **统一的前端生图服务接口**：新增 `imageGenService.ts` 与 `imageGeneration.ts`，为多模块和跨引擎调用提供标准化的 `generateImageFromPrompt` 统一调用封装，并支持全局“生图配置”读取。
- **聊天模式自动生图**：
  - 在 `aiService.ts` 的聊天 Prompt 中让 AI 输出特定的 `<img prompt="xxx">` 标签。
  - 在 `ChatPage.vue` 对话框内实现了正则解析器拦截图片标签，自动渲染带 loading/ error/ default 状态的交互式生图卡片组件。
  - 可前往【设置(CustomizePage)】开启**“聊天自动生成图片”**开关，AI发图后将静默自动触发实际生图流程。
- **12 个社交 App 的自动化配图**：
  - 扩展 `socialPrompts.ts` 中的12种系统模板（包括朋友圈、微博、知乎、贴吧小红书等），促使AI带回含有 `[图片提示|id|提示词]` 属性的内容。
  - 在 `socialParsers.ts` 中增强了20多个数据类型的接口，统一接收 `imagePrompt` 字段与展示用的图片列表 `images` 字段，并新增提取逻辑。
  - 在 `socialAI.ts` 层引入了 `handleImagePromptsGenerically` 后台静默守护进程逻辑。若开启了设置里的**“社交自动带图”**开关，那么在刷新朋友圈、微博时一旦探测到 AI 分配的图片提示词将会发起异步代理请求自动补图。

### 修复 (Fixed)

- 修复了此前直接发往类似 NovelAI 等第三方生图 API 偶尔存在的浏览器的 CORS 跨域报错。
- 修复并增强了部分社交解析模版因无图片而导致的纯文字乏味体验。
