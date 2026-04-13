// 管理员禁言/解禁 API

import { define } from "../../../utils.ts";
import { getKv } from "../../../utils/db.ts";
import type { User } from "../../../utils/state.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }
    const form = await ctx.req.formData();
    const userId = form.get("userId") as string;
    const action = form.get("action") as string;
    if (!userId || !action) return new Response("Bad request", { status: 400 });

    const kv = await getKv();
    const userEntry = await kv.get<User>(["users", userId]);
    if (!userEntry.value) return new Response("User not found", { status: 404 });

    const updatedUser: User = { ...userEntry.value, banned: action === "ban" };
    await kv.set(["users", userId], updatedUser);

    const referer = ctx.req.headers.get("referer") || "/admin";
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
