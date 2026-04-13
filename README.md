<div align="center">

# ⚡ DeLinux

**AI + 生活社区 — 一个纯文字论坛**

[![Deno](https://img.shields.io/badge/Deno-2.x-000000?style=flat-square&logo=deno)](https://deno.com)
[![Fresh](https://img.shields.io/badge/Fresh-2.x-FFDB1E?style=flat-square)](https://fresh.deno.dev)
[![Preact](https://img.shields.io/badge/Preact-10.x-673AB8?style=flat-square&logo=preact)](https://preactjs.com)
[![Deno KV](https://img.shields.io/badge/Deno_KV-内置数据库-70FFAF?style=flat-square)](https://deno.com/kv)
[![Deploy](https://img.shields.io/badge/Deno_Deploy-已部署-000000?style=flat-square&logo=deno)](https://deno.com/deploy)

DeLinux 是一个使用 Deno + Fresh 构建的轻量级中文论坛社区，专注于 **AI
技术交流**和**日常生活分享**。无需外部数据库，开箱即用。

</div>

---

## 📖 目录

- [✨ 功能特性](#-功能特性)
- [🛠 技术栈](#-技术栈)
- [⚡ 快速开始](#-快速开始)
- [📂 项目结构](#-项目结构)
- [🗃 数据模型](#-数据模型)
- [🧩 内置版块](#-内置版块)
- [📡 API 接口](#-api-接口)
- [🚀 部署到 Deno Deploy](#-部署到-deno-deploy)
- [🔧 管理员操作](#-管理员操作)
- [🧪 运行测试](#-运行测试)
- [🤝 贡献指南](#-贡献指南)
- [📜 开源协议](#-开源协议)

---

## ✨ 功能特性

### 社区核心

- 🗂 **多版块分类** — 支持 AI、摸鱼、羊毛、分享、组队等版块，帖子自动归类
- ✍️ **发帖与回复** — 支持 Markdown 渲染，发帖即时可见
- 👍 **点赞与收藏** — 一键点赞/取消，收藏帖子方便回顾
- 🔍 **全文搜索** — 中文分词 + 英文单词前缀匹配，支持多词交叉搜索并按相关度排序

### 用户系统

- 🔐 **注册 / 登录 / 登出** — 基于 Cookie + Session 的认证机制
- 🔑 **修改密码** — 用户可在个人页面修改密码
- 👤 **个人主页** — 查看用户发布的帖子和收藏

### 管理后台

- 📊 **数据概览** — 查看注册用户数、帖子总数、回复总数
- 👥 **用户管理** — 禁言 / 解禁 / 删除用户、重置密码、设置管理员
- 📝 **帖子管理** — 管理员可删除违规帖子
- 🔥 **清空数据** — 高危操作：一键清空 KV 数据库

### 性能优化

- ⚡ **关键 CSS 内联** — 首屏渲染零阻塞
- 📦 **静态资源缓存** — 精细化 Cache-Control 策略
- 🧠 **Session 内存缓存** — 减少重复 KV 查询，5分钟 TTL
- 🔗 **链接悬停预取** — PC 端 80ms 延迟预取，移动端 touchstart 预取
- 📊 **页面跳转进度条** — 模拟 SPA 级丝滑体验
- 🏗 **批量并行查询** — 帖子详情批量并行获取，O(1) 版块查找

---

## 🛠 技术栈

| 技术                                   | 说明                                  |
| :------------------------------------- | :------------------------------------ |
| [Deno](https://deno.com)               | JavaScript / TypeScript 运行时        |
| [Fresh 2.x](https://fresh.deno.dev)    | Deno 全栈 Web 框架，基于 Islands 架构 |
| [Preact](https://preactjs.com)         | 轻量级 UI 层（3kB），React 兼容 API   |
| [Vite](https://vite.dev)               | 前端构建工具，Fresh 2.x 内置集成      |
| [Deno KV](https://deno.com/kv)         | 无需外部数据库，内置键值存储          |
| [Deno Deploy](https://deno.com/deploy) | 边缘计算部署平台，全球 CDN            |
| [marked](https://marked.js.org)        | Markdown 渲染引擎                     |

---

## ⚡ 快速开始

### 前置要求

- [Deno](https://deno.com) >=
  2.x（[安装指南](https://docs.deno.com/runtime/getting_started/installation/)）

```bash
# macOS / Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows（PowerShell）
irm https://deno.land/install.ps1 | iex
```

### 克隆项目

```bash
git clone https://github.com/jay6697117/delinux.git
cd delinux
```

### 安装依赖

```bash
deno install
```

### 启动开发服务器

```bash
deno task dev
```

浏览器打开 [http://localhost:8000](http://localhost:8000) 即可看到运行效果。

> **💡 提示**：本地开发模式会自动使用 `./local.sqlite`
> 作为数据库文件，数据与线上环境完全隔离。

### 其他常用命令

```bash
# 代码检查（格式化 + lint + 类型检查）
deno task check

# 生产构建
deno task build

# 启动生产服务
deno task start

# 设置管理员（通过邮箱）
deno task set-admin <邮箱>

# 更新 Fresh 框架
deno task update
```

---

## 📂 项目结构

```
delinux/
├── main.ts                    # 应用主入口 + 中间件（Session、缓存）
├── client.ts                  # 客户端 entry（Hydration）
├── utils.ts                   # Fresh 状态类型 + define helper
├── vite.config.ts             # Vite 构建配置
├── deno.json                  # Deno 配置（依赖、任务、编译选项）
│
├── routes/                    # 文件路由（页面 + API）
│   ├── _app.tsx               #   全局布局（Header、Footer、脚本）
│   ├── _404.tsx               #   404 页面
│   ├── _500.tsx               #   500 错误页面
│   ├── index.tsx              #   首页（版块导航 + 最新帖子）
│   ├── search.tsx             #   搜索页面
│   ├── auth/                  #   认证模块
│   │   ├── login.tsx          #     登录
│   │   ├── register.tsx       #     注册
│   │   ├── logout.tsx         #     登出
│   │   └── change-password.tsx #    修改密码
│   ├── board/
│   │   └── [slug].tsx         #   版块详情（帖子列表）
│   ├── post/
│   │   ├── new.tsx            #   发帖页面
│   │   └── [id].tsx           #   帖子详情（含回复、点赞、收藏）
│   ├── user/
│   │   └── [id].tsx           #   用户主页
│   ├── admin/
│   │   └── index.tsx          #   管理后台
│   └── api/                   #   API 接口
│       ├── like.ts            #     点赞 / 取消点赞
│       ├── favorite.ts        #     收藏 / 取消收藏
│       ├── health.ts          #     健康检查
│       └── admin/             #     管理员 API
│           ├── ban-user.ts    #       禁言 / 解禁用户
│           ├── delete-user.ts #       删除用户
│           ├── delete-post.ts #       删除帖子
│           ├── reset-password.ts #    重置密码
│           └── clear-all.ts   #       清空数据库
│
├── utils/                     # 业务逻辑工具库
│   ├── state.ts               #   全局类型定义（User, Post, Reply, Board...）
│   ├── db.ts                  #   Deno KV 连接 + 分页查询工具
│   ├── auth.ts                #   认证逻辑（注册、登录、Session管理）
│   ├── boards.ts              #   版块数据定义与初始化
│   ├── posts.ts               #   帖子 CRUD + 搜索 + 点赞收藏
│   ├── password.ts            #   密码哈希与验证
│   ├── markdown.ts            #   Markdown 渲染
│   ├── cache.ts               #   静态资源缓存策略
│   └── time.ts                #   时间格式化（timeAgo）
│
├── scripts/                   # 运维脚本
│   ├── set-admin.ts           #   手动设置管理员
│   ├── clear-kv.ts            #   清空 KV 数据
│   └── clear-users.ts         #   清空用户数据
│
├── static/                    # 静态资源
│   └── styles.css             #   全局样式表
│
├── tests/                     # 单元测试
│   ├── boards_test.ts         #   版块逻辑测试
│   ├── posts_test.ts          #   帖子逻辑测试
│   └── cache_test.ts          #   缓存策略测试
│
└── _fresh/                    # Fresh 构建产物（自动生成，已 gitignore）
```

---

## 🗃 数据模型

项目使用 Deno KV 键值存储。以下是核心数据结构：

```typescript
// 用户
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: number;
  banned: boolean;
}

// 帖子
interface Post {
  id: string;
  title: string;
  content: string; // 支持 Markdown
  authorId: string;
  authorName: string;
  boardSlug: string; // 所属版块
  createdAt: number;
  lastReplyAt: number;
  replyCount: number;
  likeCount: number;
}

// 回复
interface Reply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}
```

### KV 键设计

| 键前缀                                        | 说明                     |
| :-------------------------------------------- | :----------------------- |
| `["users", id]`                               | 用户数据                 |
| `["users_by_name", name]`                     | 用户名索引 → userId      |
| `["users_by_email", email]`                   | 邮箱索引 → userId        |
| `["sessions", sessionId]`                     | 会话数据（7天TTL）       |
| `["boards", slug]`                            | 版块数据                 |
| `["posts", id]`                               | 帖子数据                 |
| `["posts_latest", invertedTime, id]`          | 全站最新帖子索引（倒序） |
| `["posts_by_board", slug, invertedTime, id]`  | 版块帖子索引             |
| `["posts_by_user", userId, invertedTime, id]` | 用户帖子索引             |
| `["replies", postId, replyId]`                | 回复数据                 |
| `["likes", postId, userId]`                   | 点赞记录                 |
| `["favorites", userId, postId]`               | 收藏记录                 |
| `["search_words", word, postId]`              | 搜索分词索引             |

---

## 🧩 内置版块

| 图标 | Slug    | 名称 | 说明                            |
| :--: | :------ | :--- | :------------------------------ |
|  🤖  | `ai`    | AI   | AI 技术讨论、模型分享、工具推荐 |
|  🐟  | `chill` | 摸鱼 | 日常闲聊、轻松话题              |
|  🐑  | `deals` | 羊毛 | 优惠信息、薅羊毛攻略            |
|  📢  | `share` | 分享 | 资源分享、经验心得              |
|  🤝  | `team`  | 组队 | 拼车、合作、找搭档              |

> 版块数据在 `utils/boards.ts` 中以静态常量定义，应用启动时自动同步到 KV。

---

## 📡 API 接口

|  方法  | 路径                        | 说明          |  鉴权  |
| :----: | :-------------------------- | :------------ | :----: |
| `GET`  | `/api/health`               | 健康检查      |   ❌   |
| `POST` | `/api/like`                 | 切换点赞状态  |   ✅   |
| `POST` | `/api/favorite`             | 切换收藏状态  |   ✅   |
| `POST` | `/api/admin/ban-user`       | 禁言/解禁用户 | 管理员 |
| `POST` | `/api/admin/delete-user`    | 删除用户      | 管理员 |
| `POST` | `/api/admin/delete-post`    | 删除帖子      | 管理员 |
| `POST` | `/api/admin/reset-password` | 重置用户密码  | 管理员 |
| `POST` | `/api/admin/clear-all`      | 清空全部数据  | 管理员 |

---

## 🚀 部署到 Deno Deploy

DeLinux 天然适配 [Deno Deploy](https://deno.com/deploy)，零配置部署：

### 方式一：通过 GitHub 自动部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 登录 [Deno Deploy](https://dash.deno.com/projects)
3. 创建新项目，关联 GitHub 仓库
4. 设置入口文件为 `main.ts`
5. 选择 **Fresh (Vite)** 框架预设
6. 点击部署 🚀

部署后，Deno KV 会自动使用云端存储，数据全球多节点同步。

### 方式二：通过 CLI 部署

```bash
# 安装 deployctl
deno install -Arf jsr:@deno/deployctl

# 构建并部署
deno task build
deployctl deploy
```

---

## 🔧 管理员操作

### 首个用户自动成为管理员

系统设计为：**第一个注册的用户自动获得管理员权限**，后续注册的用户默认为普通用户。

### 手动设置管理员

如果需要手动将某个用户设为管理员：

```bash
deno task set-admin user@example.com
```

### 运维脚本

```bash
# 清空所有 KV 数据
deno run -A --unstable-kv scripts/clear-kv.ts

# 仅清空用户数据
deno run -A --unstable-kv scripts/clear-users.ts
```

---

## 🧪 运行测试

```bash
# 运行全部测试
deno test -A --unstable-kv

# 运行特定测试文件
deno test -A --unstable-kv tests/boards_test.ts
deno test -A --unstable-kv tests/posts_test.ts
deno test -A --unstable-kv tests/cache_test.ts

# 代码质量检查（格式化 + lint + 类型）
deno task check
```

---

## 🤝 贡献指南

非常欢迎你参与 DeLinux 的开发！无论是修复
Bug、改进功能、完善文档，都是宝贵的贡献。

### 贡献流程

```
┌──────────────────┐
│   Fork 仓库       │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  创建功能分支      │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  编写代码 & 测试   │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  提交代码         │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  提交 PR          │
└────────┘─────────┘
```

### 1. Fork & Clone

```bash
# Fork 仓库后克隆到本地
git clone https://github.com/<your-username>/delinux.git
cd delinux
```

### 2. 创建功能分支

```bash
# 从 main 分支创建新分支
git checkout -b feat/your-feature-name
```

分支命名规范：

| 前缀        | 说明     | 示例                   |
| :---------- | :------- | :--------------------- |
| `feat/`     | 新功能   | `feat/dark-mode`       |
| `fix/`      | Bug 修复 | `fix/login-redirect`   |
| `docs/`     | 文档更新 | `docs/api-reference`   |
| `refactor/` | 代码重构 | `refactor/auth-module` |
| `perf/`     | 性能优化 | `perf/kv-batch-query`  |
| `test/`     | 测试相关 | `test/add-post-tests`  |

### 3. 编写代码

请遵循以下规范：

- **代码风格**：使用 `deno fmt` 自动格式化
- **代码检查**：使用 `deno lint` 确保没有 lint 警告
- **类型安全**：TypeScript 严格模式，避免 `any` 类型
- **代码注释**：使用中文注释，简洁明了
- **组件职责**：每个文件职责单一，工具函数集中在 `utils/` 目录

### 4. 提交代码

提交信息使用中文，格式遵循
[Conventional Commits](https://www.conventionalcommits.org/)：

```bash
git add .
git commit -m "feat: 添加暗色模式切换功能"
```

提交类型说明：

| 类型       | 说明                         |
| :--------- | :--------------------------- |
| `feat`     | 新增功能                     |
| `fix`      | 修复 Bug                     |
| `docs`     | 文档更新                     |
| `style`    | 样式调整（不影响逻辑）       |
| `refactor` | 代码重构（不改变行为）       |
| `perf`     | 性能优化                     |
| `test`     | 添加/修改测试                |
| `chore`    | 杂项（构建流程、依赖更新等） |

### 5. 提交前检查

```bash
# 确保以下命令全部通过
deno fmt --check .      # 格式化检查
deno lint .             # 代码检查
deno test -A --unstable-kv  # 运行测试
```

### 6. 发起 Pull Request

1. 将分支推送到你的 Fork 仓库：
   ```bash
   git push origin feat/your-feature-name
   ```
2. 在 GitHub 上发起 Pull Request，目标分支为 `main`
3. 在 PR 描述中清晰说明：
   - **做了什么**：改动的目的和内容
   - **为什么做**：解决了什么问题或带来了什么改进
   - **如何测试**：如何验证改动的正确性

### 🐛 报告 Bug

如果你发现了 Bug，请在 [Issues](https://github.com/jay6697117/delinux/issues)
中创建 issue，并包含：

- **Bug 描述**：简要说明
- **复现步骤**：如何触发该 Bug
- **期望行为**：正确的表现应该是什么
- **环境信息**：Deno 版本、操作系统等

### 💡 功能建议

欢迎在 [Issues](https://github.com/jay6697117/delinux/issues)
中提出功能建议，标注 `enhancement` 标签。

---

## 📜 开源协议

本项目使用 [MIT](./LICENSE) 协议开源。

---

<div align="center">

**用 ❤️ 和 Deno 构建 · © 2026 DeLinux**

[⬆ 回到顶部](#-delinux)

</div>
