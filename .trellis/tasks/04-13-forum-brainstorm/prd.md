# DeLinux 纯文字论坛

## Goal

构建一个 AI + 生活风格的**纯文字论坛**，部署在 Deno Deploy 上。
使用 Deno Fresh 2.0 框架 + Deno KV 数据库，提供类似 NodeSeek / DeepFlood 的帖子列表式体验。

## Decisions Made

### 论坛定位与版块 ✅
- **定位**：AI + 生活风
- **版块**：
  1. **AI** — AI 技术讨论、模型分享、工具推荐
  2. **摸鱼** — 日常闲聊、轻松话题
  3. **羊毛** — 优惠信息、薅羊毛攻略
  4. **分享** — 资源分享、经验心得
  5. **组队** — 拼车、合作、找搭档

### 用户登录方式 ✅
- **方式**：仅邮箱注册（用户名 + 邮箱 + 密码）
- 不使用 OAuth

### MVP 范围 ✅
- 方案 A（最小可用）+ 帖子点赞/收藏 + 搜索功能

## Requirements

### 1. 用户系统
- [x] 邮箱注册（用户名 + 邮箱 + 密码）
- [x] 登录 / 登出（Cookie Session）
- [x] 用户个人主页（查看发帖记录）
- [x] 密码哈希存储（bcrypt/scrypt）

### 2. 版块与帖子
- [x] 5 个固定版块（AI、摸鱼、羊毛、分享、组队）
- [x] 发帖（标题 + 正文，支持 Markdown 渲染）
- [x] 帖子列表（按最新回复排序，分页）
- [x] 帖子详情页

### 3. 回帖
- [x] 帖子下方回复
- [x] 回复列表（按时间正序，分页）
- [x] 回复计数显示

### 4. 点赞与收藏
- [x] 帖子点赞（每人一次，可取消）
- [x] 帖子收藏（每人一次，可取消）
- [x] 个人收藏列表

### 5. 搜索
- [x] 按标题关键词搜索帖子
- [x] 搜索结果分页

### 6. 管理功能
- [x] 管理员删帖
- [x] 管理员禁言用户

### 7. UI / UX
- [x] 暗色主题（类 NodeSeek 风格）
- [x] 移动端响应式
- [x] SSR 渲染，首屏性能好

## Acceptance Criteria

- [ ] 用户可以注册账号、登录、登出
- [ ] 用户可以在 5 个版块中浏览帖子列表
- [ ] 用户可以发帖（Markdown）并收到回帖
- [ ] 用户可以点赞和收藏帖子
- [ ] 用户可以通过关键词搜索帖子
- [ ] 管理员可以删帖和禁言
- [ ] 暗色主题 UI，移动端适配
- [ ] 成功部署到 Deno Deploy 并正常运行

## Definition of Done

- 功能完整可用
- 部署到 Deno Deploy 正常运行
- 基本安全措施（XSS 防护、CSRF、密码哈希）
- 移动端响应式设计

## Out of Scope

- 图片 / 文件上传（纯文字版）
- 实时聊天 / WebSocket
- 积分系统 / 签到
- 站内通知 / @提及
- 第三方支付
- OAuth 登录
- 原生移动应用

## Technical Approach

### 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 运行时 | Deno 2.x | 原生 TypeScript |
| 框架 | Fresh 2.0 | SSR + Islands 架构 |
| 数据库 | Deno KV | 内置 KV 存储，零配置 |
| UI | Preact + 原生 CSS | Fresh 默认 JSX 引擎 |
| Markdown | marked / markdown-it | 帖子内容渲染 |
| 密码 | bcrypt (deno) | 密码哈希 |
| 部署 | Deno Deploy | 边缘计算 |

### Deno KV 数据模型

```
// ===== 用户 =====
["users", <id>]                              → { id, username, email, passwordHash, role, createdAt }
["users_by_email", <email>]                  → userId
["users_by_name", <username>]                → userId

// ===== 版块 =====
["boards", <slug>]                           → { slug, name, description, icon, postCount }

// ===== 帖子 =====
["posts", <id>]                              → { id, title, content, authorId, boardSlug, createdAt, replyCount, likeCount, lastReplyAt }
["posts_by_board", <boardSlug>, <lastReplyAt_desc>, <id>]  → postId    // 按最新回复排序
["posts_by_user", <userId>, <createdAt_desc>, <id>]        → postId    // 用户帖子列表
["posts_latest", <lastReplyAt_desc>, <id>]                 → postId    // 全站最新

// ===== 回复 =====
["replies", <postId>, <replyId>]             → { id, content, authorId, createdAt }
["replies_by_user", <userId>, <createdAt_desc>]  → { postId, replyId }

// ===== 点赞 =====
["likes", <postId>, <userId>]                → true
["likes_by_user", <userId>, <postId>]        → true

// ===== 收藏 =====
["favorites", <userId>, <postId>]            → true
["favorites_by_post", <postId>, <userId>]    → true

// ===== 搜索索引 (简单倒排) =====
["search_words", <word>, <postId>]           → { title, boardSlug, createdAt }

// ===== Session =====
["sessions", <sessionId>]                    → { userId, createdAt, expiresAt }
```

### 关键设计决策

1. **Key 设计支持排序**：时间戳使用反转值（`MAX_TIMESTAMP - timestamp`）使 `kv.list()` 的字典序等于时间倒序
2. **搜索采用简单的逻辑**：对标题分词后建立倒排索引，适合 KV 存储，不需要外部搜索引擎
3. **SSR 优先**：大部分页面为服务端渲染，只有点赞/收藏按钮等交互用 Islands
4. **Session 认证**：Cookie 中存 sessionId，服务端用 KV 存储 session 数据

### 路由结构

```
routes/
├── _app.tsx              # 全局布局（导航栏、页脚）
├── _middleware.ts         # 全局中间件（session 解析）
├── index.tsx              # 首页（全站最新帖子列表）
├── board/
│   └── [slug].tsx         # 版块帖子列表
├── post/
│   ├── new.tsx            # 发帖页面
│   └── [id].tsx           # 帖子详情 + 回复列表
├── user/
│   └── [id].tsx           # 用户个人主页
├── search.tsx             # 搜索页面
├── auth/
│   ├── login.tsx          # 登录
│   ├── register.tsx       # 注册
│   └── logout.tsx         # 登出
├── admin/
│   └── ...                # 管理功能
└── api/
    ├── like.ts            # 点赞 API
    ├── favorite.ts        # 收藏 API
    └── reply.ts           # 回帖 API
```

## Implementation Plan

### PR1: 项目基础 + 用户认证
- Fresh 2.0 项目初始化
- Deno KV 连接与工具函数
- 用户注册 / 登录 / 登出
- Session 中间件
- 全局布局（暗色主题导航栏）

### PR2: 版块 + 帖子 CRUD
- 版块数据初始化
- 首页帖子列表（全站最新）
- 版块帖子列表 + 分页
- 发帖页面 + Markdown 渲染
- 帖子详情页

### PR3: 回帖 + 互动
- 回帖功能 + 分页
- 点赞 / 收藏（Islands 交互）
- 用户个人主页
- 个人收藏列表

### PR4: 搜索 + 管理 + 部署
- 搜索功能（标题分词倒排索引）
- 管理员删帖 / 禁言
- 移动端响应式优化
- 部署到 Deno Deploy
