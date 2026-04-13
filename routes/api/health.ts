// 诊断 API — 检查 Deno Deploy 运行时环境
// 部署后访问 /api/health 查看诊断信息

import { define } from "../../utils.ts";
import { getDb } from "../../utils/db.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    const diagnostics: Record<string, unknown> = {
      denoVersion: Deno.version,
      env: Deno.env.get("DENO_DEPLOYMENT_ID") || "本地开发",
      timestamp: new Date().toISOString(),
    };

    // 测试 Turso 数据库连接
    try {
      const db = getDb();
      const result = await db.execute(
        "SELECT COUNT(*) as cnt FROM users",
      );
      diagnostics.database = {
        status: "ok",
        type: "turso",
        userCount: result.rows[0].cnt,
      };
    } catch (err) {
      diagnostics.database = {
        status: "error",
        message: String(err),
        stack: (err as Error).stack,
      };
    }

    // 测试版块配置
    try {
      const { getAllBoards, BOARDS } = await import("../../utils/boards.ts");
      const boards = getAllBoards();
      diagnostics.boards = {
        status: "ok",
        count: BOARDS.length,
        loaded: boards.length,
      };
    } catch (err) {
      diagnostics.boards = {
        status: "error",
        message: String(err),
        stack: (err as Error).stack,
      };
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
