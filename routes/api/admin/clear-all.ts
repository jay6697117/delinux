import { define } from "../../../utils.ts";
import { getKv } from "../../../utils/db.ts";

export const handler = define.handlers({
  async POST(ctx) {
    // 权限校验：必须是最顶级的 admin
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const kv = await getKv();
    
    // 获取根前缀下所有数据
    const entries = kv.list({ prefix: [] });
    
    // 遍历强行删除所有 KV 条目（极度危险的操作，会清空一切，包括当前管理员的账号）
    for await (const entry of entries) {
      await kv.delete(entry.key);
    }

    // 清空完成后，由于当前管理员自身数据也已被核弹级清除，强行跳回首页重新开始。
    return new Response(null, { status: 302, headers: { location: "/" } });
  },
});
