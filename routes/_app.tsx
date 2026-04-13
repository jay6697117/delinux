// 全局布局：HTML 外壳、导航栏、页脚

import type { PageProps } from "fresh";
import type { State } from "../utils/state.ts";

export default function App({ Component, state, url }: PageProps<unknown, State>) {
  const user = state?.user;
  const currentPath = url.pathname;

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DeLinux — AI + 生活社区</title>
        <meta name="description" content="DeLinux 是一个 AI 与生活交流的纯文字论坛社区" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        {/* 导航栏 */}
        <header class="header">
          <div class="header-inner">
            <a href="/" class="logo">
              <span class="logo-icon">⚡</span>
              <span>DeLinux</span>
            </a>

            <nav class="nav-links">
              <a href="/" class={`nav-link ${currentPath === "/" ? "active" : ""}`}>
                首页
              </a>
              <a href="/board/ai" class={`nav-link ${currentPath.startsWith("/board/ai") ? "active" : ""}`}>
                🤖 AI
              </a>
              <a href="/board/chill" class={`nav-link ${currentPath.startsWith("/board/chill") ? "active" : ""}`}>
                🐟 摸鱼
              </a>
              <a href="/board/deals" class={`nav-link ${currentPath.startsWith("/board/deals") ? "active" : ""}`}>
                🐑 羊毛
              </a>
              <a href="/board/share" class={`nav-link ${currentPath.startsWith("/board/share") ? "active" : ""}`}>
                📢 分享
              </a>
              <a href="/board/team" class={`nav-link ${currentPath.startsWith("/board/team") ? "active" : ""}`}>
                🤝 组队
              </a>
            </nav>

            <div class="header-actions">
              <a href="/search" class="btn btn-ghost btn-icon" title="搜索">🔍</a>
              {user ? (
                <>
                  <a href="/post/new" class="btn btn-primary">发帖</a>
                  <a href={`/user/${user.id}`} class="btn btn-ghost">{user.username}</a>
                  {user.role === "admin" && (
                    <a href="/admin" class="btn btn-ghost btn-sm">管理</a>
                  )}
                  <a href="/auth/logout" class="btn btn-ghost btn-sm">登出</a>
                </>
              ) : (
                <>
                  <a href="/auth/login" class="btn btn-secondary">登录</a>
                  <a href="/auth/register" class="btn btn-primary">注册</a>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main class="container">
          <Component />
        </main>

        {/* 页脚 */}
        <footer class="footer">
          <div class="container">
            <p>© 2026 DeLinux — AI + 生活社区 · 部署在 Deno Deploy 上</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
