// 点赞 API

import { define } from "../../utils.ts";
import { toggleLike } from "../../utils/posts.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user) {
      return new Response(null, { status: 302, headers: { location: "/auth/login" } });
    }
    const form = await ctx.req.formData();
    const postId = form.get("postId") as string;
    if (!postId) return new Response("Bad request", { status: 400 });

    await toggleLike(postId, ctx.state.user.id);
    const referer = ctx.req.headers.get("referer") || `/post/${postId}`;
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
