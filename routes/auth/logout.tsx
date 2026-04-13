// 登出

import { define } from "../../utils.ts";
import { deleteSession, clearSessionCookie, clearSessionCache } from "../../utils/auth.ts";

export const handler = define.handlers({
  async GET(ctx) {
    if (ctx.state.sessionId) {
      await deleteSession(ctx.state.sessionId);
      // 同步清除内存缓存
      clearSessionCache(ctx.state.sessionId);
    }
    return new Response(null, {
      status: 302,
      headers: {
        location: "/",
        "set-cookie": clearSessionCookie(),
      },
    });
  },
});
