import { d as define } from "../server-entry.mjs";
import { t as toggleFavorite } from "./posts-DP3b7mwx.mjs";
const handler$1 = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/auth/login"
        }
      });
    }
    const form = await ctx.req.formData();
    const postId = form.get("postId");
    if (!postId) return new Response("Bad request", {
      status: 400
    });
    await toggleFavorite(postId, ctx.state.user.id);
    const referer = ctx.req.headers.get("referer") || `/post/${postId}`;
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
const _freshRoute___api_favorite = void 0;
export {
  config,
  css,
  _freshRoute___api_favorite as default,
  handler,
  handlers
};
