import { d as define, b as getKv } from "../server-entry.mjs";
const handler$1 = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", {
        status: 403
      });
    }
    const form = await ctx.req.formData();
    const userId = form.get("userId");
    if (!userId) {
      return new Response("Bad request", {
        status: 400
      });
    }
    const kv = await getKv();
    const userEntry = await kv.get(["users", userId]);
    if (!userEntry.value) {
      return new Response("User not found", {
        status: 404
      });
    }
    const user = userEntry.value;
    await kv.atomic().delete(["users", userId]).delete(["users_by_name", user.username.toLowerCase()]).delete(["users_by_email", user.email.toLowerCase()]).commit();
    const referer = ctx.req.headers.get("referer") || "/admin?tab=users";
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
const _freshRoute___api_admin_delete_user = void 0;
export {
  config,
  css,
  _freshRoute___api_admin_delete_user as default,
  handler,
  handlers
};
