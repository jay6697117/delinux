// 全局布局

import { define } from "../utils.ts";
import { BOARDS } from "../utils/boards.ts";
import { Partial } from "fresh/runtime";

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
        {/* 关键 CSS 内联：消除首屏渲染阻塞 */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root{--bg-primary:#0d1117;--bg-secondary:#161b22;--bg-tertiary:#21262d;--bg-hover:#292e36;--border-color:#30363d;--text-primary:#e6edf3;--text-secondary:#8b949e;--text-tertiary:#6e7681;--text-link:#58a6ff;--accent:#58a6ff;--space-xs:4px;--space-sm:8px;--space-md:16px;--space-lg:24px;--space-xl:32px;--radius-md:6px;--radius-lg:12px;--font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",Helvetica,Arial,sans-serif;--max-width:960px;--header-height:56px}
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{font-size:14px;-webkit-font-smoothing:antialiased}
          body{font-family:var(--font-sans);background:var(--bg-primary);color:var(--text-primary);line-height:1.6;min-height:100vh}
          .header{height:var(--header-height);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);background:rgba(22,27,34,.85);border-bottom:1px solid var(--border-color)}
          .header-inner{max-width:var(--max-width);margin:0 auto;padding:0 var(--space-md);height:100%;display:flex;align-items:center;justify-content:space-between}
          .container{max-width:var(--max-width);margin:0 auto;padding:0 var(--space-md)}
        ` }} />
        <link rel="preload" href="/styles.css" as="style" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
      </head>
      <body f-client-nav>
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

        {/* 页面内容（Partial 区域：切换板块时只替换此区域，无需全页面刷新） */}
        <main class="container">
          <Partial name="body">
            <Component />
          </Partial>
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

        {/* 页面跳转进度条（兼容 Partial 客户端导航 + 传统全页面刷新） */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // 创建进度条 DOM
            var bar = document.createElement('div');
            bar.id = 'nprogress-bar';
            var s = bar.style;
            s.position = 'fixed';
            s.top = '0';
            s.left = '0';
            s.width = '0';
            s.height = '2.5px';
            s.background = 'linear-gradient(90deg, #58a6ff, #79c0ff, #a5d6ff)';
            s.zIndex = '99999';
            s.transition = 'width 0.4s ease, opacity 0.3s ease';
            s.boxShadow = '0 0 8px rgba(88,166,255,0.6)';
            s.opacity = '0';
            s.pointerEvents = 'none';
            document.body.appendChild(bar);

            var rafId = null;
            var progress = 0;

            function start() {
              progress = 0;
              bar.style.opacity = '1';
              bar.style.width = '0';
              function tick() {
                if (progress < 30) progress += 3;
                else if (progress < 60) progress += 1.5;
                else if (progress < 85) progress += 0.5;
                bar.style.width = progress + '%';
                if (progress < 85) rafId = requestAnimationFrame(tick);
              }
              rafId = requestAnimationFrame(tick);
            }

            function done() {
              if (rafId) cancelAnimationFrame(rafId);
              bar.style.width = '100%';
              setTimeout(function() {
                bar.style.opacity = '0';
                setTimeout(function() { bar.style.width = '0'; }, 300);
              }, 200);
            }

            // 拦截 fetch 以监听 Partial 导航请求
            var _fetch = window.fetch;
            window.fetch = function() {
              var url = arguments[0];
              if (typeof url === 'string' && url.includes('fresh-partial=true')) {
                start();
                return _fetch.apply(this, arguments).then(function(resp) {
                  done();
                  return resp;
                }).catch(function(err) {
                  done();
                  throw err;
                });
              }
              return _fetch.apply(this, arguments);
            };

            // 传统全页面刷新的降级处理
            window.addEventListener('beforeunload', function() {
              if (rafId) cancelAnimationFrame(rafId);
              progress = 90;
              bar.style.width = '90%';
            });
            window.addEventListener('pageshow', function() { done(); });
          })();
        `}} />
      </body>
    </html>
  );
});
