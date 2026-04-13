// 管理员删帖 API

import { define } from "../../../utils.ts";
import { deletePost } from "../../../utils/posts.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }
    const form = await ctx.req.formData();
    const postId = form.get("postId") as string;
    if (!postId) return new Response("Bad request", { status: 400 });

    await deletePost(postId);
    const referer = ctx.req.headers.get("referer") || "/";
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
