import { d as define, j as deleteSession, k as clearSessionCookie } from "../server-entry.mjs";
const handler$1 = define.handlers({
  async GET(ctx) {
    if (ctx.state.sessionId) {
      await deleteSession(ctx.state.sessionId);
    }
    return new Response(null, {
      status: 302,
      headers: {
        location: "/",
        "set-cookie": clearSessionCookie()
      }
    });
  }
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___auth_logout = void 0;
export {
  config,
  css,
  _freshRoute___auth_logout as default,
  handler,
  handlers
};
