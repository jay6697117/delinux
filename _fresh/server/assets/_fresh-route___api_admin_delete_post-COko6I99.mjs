import { d as define } from "../server-entry.mjs";
import { f as deletePost } from "./posts-CtOzPUAj.mjs";
const handler$1 = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", {
        status: 403
      });
    }
    const form = await ctx.req.formData();
    const postId = form.get("postId");
    if (!postId) return new Response("Bad request", {
      status: 400
    });
    await deletePost(postId);
    const referer = ctx.req.headers.get("referer") || "/";
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
const _freshRoute___api_admin_delete_post = void 0;
export {
  config,
  css,
  _freshRoute___api_admin_delete_post as default,
  handler,
  handlers
};
