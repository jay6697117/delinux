import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import {
  getSessionIdFromCookie,
  getSession,
  getUserById,
} from "./utils/auth.ts";
import { initBoards } from "./utils/boards.ts";

export const app = new App<State>();

// P0: 为 styles.css 添加缓存头（必须在 staticFiles 之前注册）
app.use(async (ctx) => {
  const { pathname } = new URL(ctx.req.url);
  if (pathname === "/styles.css") {
    const resp = await ctx.next();
    const headers = new Headers(resp.headers);
    headers.set(
      "cache-control",
      "public, max-age=3600, stale-while-revalidate=86400",
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

// 全局 Session 中间件（带错误处理，跳过静态资源）
app.use(async (ctx) => {
  const { pathname } = new URL(ctx.req.url);

  // P2: 静态资源不需要 session 和版块初始化，直接跳过
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

  // 从 Cookie 中获取 sessionId
  try {
    const cookieHeader = ctx.req.headers.get("cookie");
    const sessionId = getSessionIdFromCookie(cookieHeader);

    if (sessionId) {
      const session = await getSession(sessionId);
      if (session) {
        const user = await getUserById(session.userId);
        if (user) {
          ctx.state.user = user;
          ctx.state.sessionId = sessionId;
        }
      }
    }
  } catch (err) {
    console.error("Session 中间件错误:", err);
    // Session 解析失败不影响页面渲染，继续
  }

  return ctx.next();
});

// 文件路由
app.fsRoutes();

if (import.meta.main) {
  await app.listen();
}
