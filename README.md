# 📱 fzsmphone

高仿 iOS 风格手机模拟器 Web 应用，专为角色扮演和沉浸式社交模拟打造。

## 技术栈

**前端** Vue 3 + TypeScript + Vite + Pinia　｜　**后端** Go 1.22 + Chi v5 + PostgreSQL 16　｜　**认证** Discord OAuth2　｜　**部署** Docker / Zeabur

## 已实装功能

| 分类 | 功能 |
|------|------|
| 💬 聊天 | 好友列表、私聊、群聊（接入 OpenAI 兼容 API，支持流式 SSE） |
| 🧩 角色 | 创建/编辑 AI 角色（人设、系统提示词、开场白、示例对话、标签） |
| 👤 人设 | 用户人设管理，多人设切换 |
| 📖 世界书 | 关键词触发的背景知识库，支持角色绑定 |
| ⚡ 预设 | 系统提示词模板，支持 `{{char}}`/`{{user}}` 变量、预填充 |
| 📋 论坛 | AI 生成帖子与回复，楼中楼讨论，自定义提示词，截断容错解析 |
| 📡 微博 | 微博信息流 + 热搜 + 榜单 + 评论互动，全部 AI 生成，自定义提示词 |
| 🟢 朋友圈 | 仿微信朋友圈动态，AI 生成点赞/评论/回复评论，自定义提示词 |
| ⚙️ 设置 | API 配置、主题、深色模式、壁纸、气泡样式等 |
| 🛡 管理 | 管理员功能开关面板，实时启用/禁用功能模块 |

## 快速开始

```bash
git clone https://github.com/907606864-hub/fzsmphone.git
cd fzsmphone
docker-compose up -d postgres          # 启动 PostgreSQL
cp server/.env.example server/.env     # 编辑填入 Discord OAuth 配置
cd server && go run ./cmd/api &        # 后端 :8080
cd .. && npm install && npm run dev    # 前端 :3000
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `DISCORD_CLIENT_ID` | Discord 应用 ID |
| `DISCORD_CLIENT_SECRET` | Discord 应用密钥 |
| `DISCORD_REDIRECT_URI` | OAuth 回调地址 |
| `DISCORD_GUILD_ID` | 限制登录的服务器 ID |
| `DISCORD_REQUIRED_ROLE_IDS` | 必须拥有的身份组 |
| `DISCORD_ADMIN_IDS` | 管理员 Discord ID |
| `FRONTEND_URL` | 前端地址 (CORS) |

完整列表见 `server/.env.example`

## 部署

项目已配置 `Dockerfile` + `zbpack.json`，支持 Zeabur 一键部署。也可 `docker-compose up -d` 本地启动全部服务。
