// 管理员重置用户密码 API（同时保存明文密码）

import { define } from "../../../utils.ts";
import { getKv } from "../../../utils/db.ts";
import { hashPassword } from "../../../utils/password.ts";
import type { User } from "../../../utils/state.ts";

export const handler = define.handlers({
  async POST(ctx) {
    // 权限校验：必须是 admin
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const form = await ctx.req.formData();
    const userId = form.get("userId") as string;

    if (!userId) {
      return new Response("Bad request", { status: 400 });
    }

    const kv = await getKv();
    const userEntry = await kv.get<User>(["users", userId]);

    if (!userEntry.value) {
      return new Response("User not found", { status: 404 });
    }

    // 随机生成一个 8 位字符的新密码（包含字母和数字）
    const newPassword = Math.random().toString(36).slice(-8);

    // 重新哈希密码，并同时保存明文
    const passwordHash = await hashPassword(newPassword);
    const updatedUser: User = {
      ...userEntry.value,
      passwordHash,
      plaintextPassword: newPassword,
    };

    await kv.set(["users", userId], updatedUser);

    const referer = ctx.req.headers.get("referer") || "/admin?tab=users";
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
