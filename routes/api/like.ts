// 点赞 API

import type { RouteContext } from "fresh";
import type { State } from "../../utils/state.ts";
import { toggleLike } from "../../utils/posts.ts";

export default async function LikeApi(req: Request, ctx: RouteContext<void, State>) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!ctx.state.user) {
    return new Response(null, { status: 302, headers: { location: "/auth/login" } });
  }

  const form = await req.formData();
  const postId = form.get("postId") as string;

  if (!postId) {
    return new Response("Bad request", { status: 400 });
  }

  await toggleLike(postId, ctx.state.user.id);

  // 重定向回帖子页面
  const referer = req.headers.get("referer") || `/post/${postId}`;
  return new Response(null, { status: 302, headers: { location: referer } });
}
