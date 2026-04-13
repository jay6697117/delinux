// 登出

import type { RouteContext } from "fresh";
import type { State } from "../../utils/state.ts";
import { deleteSession, clearSessionCookie } from "../../utils/auth.ts";

export default async function Logout(_req: Request, ctx: RouteContext<void, State>) {
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
}
