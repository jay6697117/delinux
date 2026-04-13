// 全局中间件：解析 Session 并注入用户信息到 state

import { type MiddlewareFn } from "fresh";
import { type State } from "../utils/state.ts";
import {
  getSessionIdFromCookie,
  getSession,
} from "../utils/auth.ts";
import { getUserById } from "../utils/auth.ts";
import { initBoards } from "../utils/boards.ts";

// 版块初始化标记
let boardsInitialized = false;

const sessionMiddleware: MiddlewareFn<State> = async (ctx) => {
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
};

export const handler: MiddlewareFn<State>[] = [sessionMiddleware];
