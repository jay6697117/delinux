// 管理员删除用户账号 API

import { define } from "../../../utils.ts";
import { getKv } from "../../../utils/db.ts";
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

    const user = userEntry.value;

    // 为了防止出现“悬空引用”，可以选择删除对应的帖子，或者在这里选择保留发帖但只清理用户本体。
    // 一般社区保留发帖作为历史资产，或者统一改成“账号已注销”，这里目前只是执行数据库账号删除及其反查索引的删除。
    await kv.atomic()
      .delete(["users", userId])
      .delete(["users_by_name", user.username.toLowerCase()])
      .delete(["users_by_email", user.email.toLowerCase()])
      .commit();

    // 回到请求来源页面（后台用户列表）
    const referer = ctx.req.headers.get("referer") || "/admin?tab=users";
    return new Response(null, { status: 302, headers: { location: referer } });
  },
});
