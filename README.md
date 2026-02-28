# fzsmphone

高仿 iOS 风格手机模拟器 Web 应用，专为角色扮演和沉浸式社交模拟打造。集成 AI 生成内容，覆盖聊天、社交、娱乐、生活、工具五大模块，45+ 功能页面。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite + Pinia |
| 后端 | Go 1.22 + Chi v5 + PostgreSQL 16 |
| AI | OpenAI 兼容 API（流式 SSE） |
| 认证 | Discord OAuth2 + JWT |
| 部署 | Docker / Zeabur 一键部署 |
| 图标 | CSS 渐变图标系统（GradientIcon） |

## 快速开始

```bash
git clone https://github.com/907606864-hub/fzsmphone.git
cd fzsmphone

# 启动数据库
docker-compose up -d postgres

# 后端
cp server/.env.example server/.env    # 编辑填入配置
cd server && go run ./cmd/api &       # 启动在 :8080

# 前端
cd .. && npm install && npm run dev   # 启动在 :3000
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

## 项目结构

```
fzsmphone/
  src/
    api/            # API 客户端和类型定义
    components/     # 可复用组件 (NavBar, GradientIcon 等)
    pages/          # 45+ 功能页面
      chat/         # 聊天模块 (6 页面)
      social/       # 社交模块 (7 页面)
      entertainment/# 娱乐模块 (6 页面)
      lifestyle/    # 生活模块 (5 页面)
      tools/        # 工具模块 (10 页面)
      admin/        # 管理模块 (4 页面)
    stores/         # Pinia 状态管理
    utils/          # 工具函数 (AI服务, 图标系统, 社交解析器)
    router/         # Vue Router 路由配置
  server/
    cmd/api/        # Go 主入口
    internal/
      database/     # 数据库连接和迁移
      handlers/     # API 路由处理器
      middleware/   # 认证中间件
      router/       # 路由注册
```

## 部署

项目已配置 `Dockerfile` + `zbpack.json`，支持 Zeabur 一键部署。也可 `docker-compose up -d` 本地启动全部服务。

