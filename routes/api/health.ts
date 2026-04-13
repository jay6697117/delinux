// 诊断 API — 检查 Deno Deploy 运行时环境
// 部署后访问 /api/health 查看诊断信息

import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    const diagnostics: Record<string, unknown> = {
      denoVersion: Deno.version,
      env: Deno.env.get("DENO_DEPLOYMENT_ID") || "本地开发",
      timestamp: new Date().toISOString(),
    };

    // 测试 KV 连接
    try {
      const kv = await Deno.openKv();
      const testKey = ["_health_check"];
      await kv.set(testKey, { ts: Date.now() });
      const result = await kv.get(testKey);
      diagnostics.kv = {
        status: "ok",
        testValue: result.value,
      };
      await kv.delete(testKey);
    } catch (err) {
      diagnostics.kv = {
        status: "error",
        message: String(err),
        stack: (err as Error).stack,
      };
    }

    // 测试版块初始化
    try {
      const { getAllBoards, BOARDS } = await import("../../utils/boards.ts");
      const boards = await getAllBoards();
      diagnostics.boards = {
        status: "ok",
        staticCount: BOARDS.length,
        kvCount: boards.length,
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
