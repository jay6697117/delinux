// 管理员重置用户密码 API

import { define } from "../../../utils.ts";
import { getDb } from "../../../utils/db.ts";
import { hashPassword } from "../../../utils/password.ts";

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

    // 随机生成 8 位新密码
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const newPassword = Array.from(array, (b) => chars[b % chars.length]).join(
      "",
    );

    const passwordHash = await hashPassword(newPassword);
    const db = getDb();

    const result = await db.execute({
      sql:
        "UPDATE users SET password_hash = ?, plaintext_password = ? WHERE id = ?",
      args: [passwordHash, newPassword, userId],
    });

    if (result.rowsAffected === 0) {
      return new Response("User not found", { status: 404 });
    }

    const referer = ctx.req.headers.get("referer") || "/admin?tab=users";
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
