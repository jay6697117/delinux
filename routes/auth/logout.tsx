// 登出

import { define } from "../../utils.ts";
import { deleteSession, clearSessionCookie } from "../../utils/auth.ts";

export const handler = define.handlers({
  async GET(ctx) {
    if (ctx.state.sessionId) {
      await deleteSession(ctx.state.sessionId);
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
