import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import {
  getSessionIdFromCookie,
  getSession,
  getUserById,
} from "./utils/auth.ts";
import { initBoards } from "./utils/boards.ts";

export const app = new App<State>();

app.use(staticFiles());

// 版块初始化标记
let boardsInitialized = false;

// 全局 Session 中间件
app.use(async (ctx) => {
  // 首次请求时初始化版块数据
  if (!boardsInitialized) {
    await initBoards();
    boardsInitialized = true;
  }

  // 从 Cookie 中获取 sessionId
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

  return ctx.next();
});

// 文件路由
app.fsRoutes();

if (import.meta.main) {
  await app.listen();
}
