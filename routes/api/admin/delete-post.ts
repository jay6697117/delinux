// 管理员删帖 API

import type { RouteContext } from "fresh";
import type { State } from "../../../utils/state.ts";
import { deletePost } from "../../../utils/posts.ts";

export default async function DeletePostApi(req: Request, ctx: RouteContext<void, State>) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 权限检查
  if (!ctx.state.user || ctx.state.user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const form = await req.formData();
  const postId = form.get("postId") as string;

  if (!postId) {
    return new Response("Bad request", { status: 400 });
  }

  await deletePost(postId);

  const referer = req.headers.get("referer") || "/";
  return new Response(null, { status: 302, headers: { location: referer } });
}
