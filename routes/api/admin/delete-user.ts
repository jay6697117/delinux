// 管理员删除用户账号 API

import { define } from "../../../utils.ts";
import { getDb } from "../../../utils/db.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const form = await ctx.req.formData();
    const userId = form.get("userId") as string;

    if (!userId) {
      return new Response("Bad request", { status: 400 });
    }

    const db = getDb();

    // 一条 DELETE 即可，UNIQUE INDEX 的清理由数据库自动完成
    const result = await db.execute({
      sql: "DELETE FROM users WHERE id = ?",
      args: [userId],
    });

    if (result.rowsAffected === 0) {
      return new Response("User not found", { status: 404 });
    }

    // 清理关联的 session
    await db.execute({
      sql: "DELETE FROM sessions WHERE user_id = ?",
      args: [userId],
    });

    const referer = ctx.req.headers.get("referer") || "/admin?tab=users";
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
