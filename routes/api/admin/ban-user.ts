// 管理员禁言/解禁 API

import { define } from "../../../utils.ts";
import { getDb } from "../../../utils/db.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }
    const form = await ctx.req.formData();
    const userId = form.get("userId") as string;
    const action = form.get("action") as string;
    if (!userId || !action) {
      return new Response("Bad request", { status: 400 });
    }

    const db = getDb();
    const banned = action === "ban" ? 1 : 0;
    const result = await db.execute({
      sql: "UPDATE users SET banned = ? WHERE id = ?",
      args: [banned, userId],
    });

    if (result.rowsAffected === 0) {
      return new Response("User not found", { status: 404 });
    }

    const referer = ctx.req.headers.get("referer") || "/admin";
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
