// 全局布局

import { define } from "../utils.ts";
import { BOARDS } from "../utils/boards.ts";

export default define.page(function App({ Component, state, url }) {
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
              {BOARDS.map((board) => (
                <a
                  href={`/board/${board.slug}`}
                  class={`nav-link ${currentPath.startsWith(`/board/${board.slug}`) ? "active" : ""}`}
                  key={board.slug}
                >
                  {board.icon} {board.name}
                </a>
              ))}
            </nav>

            <div class="header-actions">
              <a href="/search" class="btn btn-ghost btn-icon" title="搜索">🔍</a>
              {/* 汉堡菜单按钮（移动端显示） */}
              <button
                class="menu-toggle"
                id="menuToggle"
                aria-label="打开菜单"
              >
                ☰
              </button>
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

        {/* 移动端导航抽屉 */}
        <div class="mobile-nav" id="mobileNav">
          <ul class="mobile-nav-links">
            <li>
              <a href="/" class={`mobile-nav-link ${currentPath === "/" ? "active" : ""}`}>
                🏠 首页
              </a>
            </li>
            {BOARDS.map((board) => (
              <li key={board.slug}>
                <a
                  href={`/board/${board.slug}`}
                  class={`mobile-nav-link ${currentPath.startsWith(`/board/${board.slug}`) ? "active" : ""}`}
                >
                  {board.icon} {board.name}
                </a>
              </li>
            ))}
            <li><div class="mobile-nav-divider" /></li>
            <li>
              <a href="/search" class={`mobile-nav-link ${currentPath === "/search" ? "active" : ""}`}>
                🔍 搜索
              </a>
            </li>
            {user ? (
              <>
                <li>
                  <a href="/post/new" class={`mobile-nav-link ${currentPath === "/post/new" ? "active" : ""}`}>
                    ✍️ 发帖
                  </a>
                </li>
                <li>
                  <a href={`/user/${user.id}`} class="mobile-nav-link">
                    👤 {user.username}
                  </a>
                </li>
                {user.role === "admin" && (
                  <li>
                    <a href="/admin" class="mobile-nav-link">
                      🛡️ 管理后台
                    </a>
                  </li>
                )}
                <li><div class="mobile-nav-divider" /></li>
                <li>
                  <a href="/auth/logout" class="mobile-nav-link">
                    🚪 登出
                  </a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <a href="/auth/login" class="mobile-nav-link">
                    🔑 登录
                  </a>
                </li>
                <li>
                  <a href="/auth/register" class="mobile-nav-link">
                    📝 注册
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>

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

        {/* 汉堡菜单脚本 */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var btn = document.getElementById('menuToggle');
            var nav = document.getElementById('mobileNav');
            if (!btn || !nav) return;
            btn.addEventListener('click', function() {
              var isOpen = nav.classList.toggle('open');
              btn.textContent = isOpen ? '✕' : '☰';
              btn.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
            });
            // 点击导航链接后自动关闭菜单
            nav.querySelectorAll('a').forEach(function(a) {
              a.addEventListener('click', function() {
                nav.classList.remove('open');
                btn.textContent = '☰';
              });
            });
          })();
        `}} />
      </body>
    </html>
  );
});
