import { d as define, g as getKv } from "../server-entry.mjs";
const handler$1 = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", {
        status: 403
      });
    }
    const form = await ctx.req.formData();
    const userId = form.get("userId");
    const action = form.get("action");
    if (!userId || !action) return new Response("Bad request", {
      status: 400
    });
    const kv = await getKv();
    const userEntry = await kv.get(["users", userId]);
    if (!userEntry.value) return new Response("User not found", {
      status: 404
    });
    const updatedUser = {
      ...userEntry.value,
      banned: action === "ban"
    };
    await kv.set(["users", userId], updatedUser);
    const referer = ctx.req.headers.get("referer") || "/admin";
    return new Response(null, {
      status: 302,
      headers: {
        location: referer
      }
    });
  }
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___api_admin_ban_user = void 0;
export {
  config,
  css,
  _freshRoute___api_admin_ban_user as default,
  handler,
  handlers
};
