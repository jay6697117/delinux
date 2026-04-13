import { d as define, b as getKv } from "../server-entry.mjs";
const handler$1 = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", {
        status: 403
      });
    }
    const kv = await getKv();
    const entries = kv.list({
      prefix: []
    });
    for await (const entry of entries) {
      await kv.delete(entry.key);
    }
    return new Response(null, {
      status: 302,
      headers: {
        location: "/"
      }
    });
  }
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___api_admin_clear_all = void 0;
export {
  config,
  css,
  _freshRoute___api_admin_clear_all as default,
  handler,
  handlers
};
