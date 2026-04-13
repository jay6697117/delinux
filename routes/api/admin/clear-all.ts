// 管理员清空所有数据 API

import { define } from "../../../utils.ts";
import { getDb } from "../../../utils/db.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const db = getDb();

    // 批量清空所有表（替代 KV 逐条遍历删除）
    await db.batch([
      "DELETE FROM replies",
      "DELETE FROM likes",
      "DELETE FROM favorites",
      "DELETE FROM sessions",
      "DELETE FROM posts",
      "DELETE FROM users",
    ]);

    return new Response(null, { status: 302, headers: { location: "/" } });
  },
});
