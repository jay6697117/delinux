import { d as define, b as getKv, o as hashPassword } from "../server-entry.mjs";
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
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const newPassword = Array.from(array, (b) => chars[b % chars.length]).join("");
    const passwordHash = await hashPassword(newPassword);
    const updatedUser = {
      ...userEntry.value,
      passwordHash,
      plaintextPassword: newPassword
    };
    await kv.set(["users", userId], updatedUser);
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
const _freshRoute___api_admin_reset_password = void 0;
export {
  config,
  css,
  _freshRoute___api_admin_reset_password as default,
  handler,
  handlers
};
