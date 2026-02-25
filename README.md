# fzsmphone

iOS 风格手机模拟器 Web 应用，集聊天、社交、生活、娱乐、工具于一体。

## 技术栈

**前端** Vue 3 + TypeScript + Vite + Pinia  
**后端** Go 1.22 + Chi v5 + PostgreSQL 16  
**认证** Discord OAuth2 (服务器 + 身份组验证)  
**部署** Docker / Zeabur

## 功能 (35+)

| 分类 | 功能 |
|------|------|
| 💬 聊天 | 好友列表、私聊、群聊、AI角色、人设、世界书 |
| 🌐 社交 | 论坛、微博、QQ空间、帖子详情、情侣空间 |
| 🍜 生活 | 外卖点餐、餐厅、订单、钱包、购物 |
| 🎮 娱乐 | 一起听歌、游戏、直播、赌场、迷你剧场 |
| 🛠 工具 | 日记、电话、短信、股票、汇率、通话、偷看手机、线下约会 |
| ⚙️ 系统 | 个人主页、自定义主题、预设管理、管理员功能开关 |

## 快速开始

```bash
git clone https://github.com/907606864-hub/fzsmphone.git
cd fzsmphone
cp server/.env.example .env   # 编辑填入 Discord OAuth 等配置
docker-compose up -d           # 启动 PostgreSQL
npm install && npm run dev     # 前端 http://localhost:3000
```

后端单独启动: `cd server && go run ./cmd/api`

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
| `DISCORD_ADMIN_IDS` | 自动管理员 Discord ID |
| `FRONTEND_URL` | 前端地址 (CORS) |

完整列表见 `server/.env.example`

## 部署

项目已配置 `Dockerfile` + `zbpack.json`，支持 Zeabur 一键部署：

1. Zeabur 添加 PostgreSQL 服务
2. 添加 Git 服务 → 连接本仓库
3. 配置环境变量 → 自动构建部署

## License

MIT
