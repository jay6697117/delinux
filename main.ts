import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import {
  getSessionIdFromCookie,
  getUserBySession,
} from "./utils/auth.ts";
import { initBoards } from "./utils/boards.ts";

export const app = new App<State>();

// P2: 静态资源缓存（必须在 staticFiles 之前注册）
app.use(async (ctx) => {
  const { pathname } = new URL(ctx.req.url);

  // styles.css 缓存 7 天
  if (pathname === "/styles.css") {
    const resp = await ctx.next();
    const headers = new Headers(resp.headers);
    headers.set(
      "cache-control",
      "public, max-age=604800, stale-while-revalidate=2592000",
    );
    return new Response(resp.body, { status: resp.status, headers });
  }

  // /_fresh/ 和 /assets/ 下的 hashed 资源：永久缓存
  // Vite 构建产物在 /assets/ 路径下，文件名包含 hash，内容变化后 URL 自动变化
  if (pathname.startsWith("/_fresh/") || pathname.startsWith("/assets/")) {
    const resp = await ctx.next();
    const headers = new Headers(resp.headers);
    headers.set(
      "cache-control",
      "public, max-age=31536000, immutable",
    );
    return new Response(resp.body, { status: resp.status, headers });
  }

  return ctx.next();
});

app.use(staticFiles());

// 版块初始化标记
let boardsInitialized = false;

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

  // 静态资源不需要 session 和版块初始化，直接跳过
  if (isStaticAsset(pathname)) {
    return ctx.next();
  }

  // 首次请求时初始化版块数据
  if (!boardsInitialized) {
    try {
      await initBoards();
      boardsInitialized = true;
    } catch (err) {
      console.error("版块初始化失败:", err);
      // 即使初始化失败也标记完成，避免每次请求重试
      boardsInitialized = true;
    }
  }

  // P3: 使用带内存缓存的 getUserBySession，减少重复 KV 查询
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
      headers.set("cache-control", "private, no-cache, max-age=0, must-revalidate");
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
