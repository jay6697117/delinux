import { App, staticFiles } from "fresh";
import { type State } from "./utils.ts";
import { getSessionIdFromCookie, getUserBySession } from "./utils/auth.ts";
import { initDb } from "./utils/db.ts";
import { getCacheControl } from "./utils/cache.ts";

export const app = new App<State>();
let dbInitialized = false;

function ensureDbInitialized(): void {
  if (dbInitialized) return;

  dbInitialized = true;
  void initDb().catch((err) => console.error("数据库初始化失败:", err));
}

// P2: 静态资源缓存（必须在 staticFiles 之前注册）
app.use(async (ctx) => {
  const { pathname } = new URL(ctx.req.url);
  const cacheControl = getCacheControl(pathname);
  if (cacheControl) {
    const resp = await ctx.next();
    const headers = new Headers(resp.headers);
    headers.set("cache-control", cacheControl);
    return new Response(resp.body, { status: resp.status, headers });
  }
  return ctx.next();
});

app.use(staticFiles());

// 判断是否为静态资源请求（不需要 session 查询）
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/assets/") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".woff2")
  );
}

// 全局 Session 中间件（带内存缓存 + 错误处理，跳过静态资源）
app.use(async (ctx) => {
  const { pathname } = new URL(ctx.req.url);

  // 静态资源不需要 session，直接跳过
  if (isStaticAsset(pathname)) {
    return ctx.next();
  }

  ensureDbInitialized();

  // 使用带内存缓存的 getUserBySession，减少重复数据库查询
  try {
    const cookieHeader = ctx.req.headers.get("cookie");
    const sessionId = getSessionIdFromCookie(cookieHeader);

    if (sessionId) {
      const user = await getUserBySession(sessionId);
      if (user) {
        ctx.state.user = user;
        ctx.state.sessionId = sessionId;
      }
    }
  } catch (err) {
    console.error("Session 中间件错误:", err);
    // Session 解析失败不影响页面渲染，继续
  }

  // P2: 为 HTML 页面添加短期缓存 + CSS 预加载 Link header
  const resp = await ctx.next();
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("text/html") && resp.status === 200) {
    const headers = new Headers(resp.headers);
    // 如果响应包含 set-cookie（登录/登出等认证状态变化），不缓存页面
    // 避免浏览器缓存旧的认证状态 UI
    if (!resp.headers.has("set-cookie")) {
      headers.set(
        "cache-control",
        "private, no-cache, max-age=0, must-revalidate",
      );
    }
    // 通过 Link header 让浏览器尽早发现并加载 CSS（比解析 HTML 更快）
    headers.set("link", "</styles.css>; rel=preload; as=style");
    return new Response(resp.body, { status: resp.status, headers });
  }
  return resp;
});

// 文件路由
app.fsRoutes();

if (import.meta.main) {
  await app.listen();
}
