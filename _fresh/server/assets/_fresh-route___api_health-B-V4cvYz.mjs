import { d as define } from "../server-entry.mjs";
const handler$1 = define.handlers({
  async GET(_ctx) {
    const diagnostics = {
      denoVersion: Deno.version,
      env: Deno.env.get("DENO_DEPLOYMENT_ID") || "本地开发",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      const kv = await Deno.openKv();
      const testKey = ["_health_check"];
      await kv.set(testKey, {
        ts: Date.now()
      });
      const result = await kv.get(testKey);
      diagnostics.kv = {
        status: "ok",
        testValue: result.value
      };
      await kv.delete(testKey);
    } catch (err) {
      diagnostics.kv = {
        status: "error",
        message: String(err),
        stack: err.stack
      };
    }
    try {
      const {
        getAllBoards,
        BOARDS
      } = await import("../server-entry.mjs").then((n) => n.p);
      const boards = await getAllBoards();
      diagnostics.boards = {
        status: "ok",
        staticCount: BOARDS.length,
        kvCount: boards.length
      };
    } catch (err) {
      diagnostics.boards = {
        status: "error",
        message: String(err),
        stack: err.stack
      };
    }
    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___api_health = void 0;
export {
  config,
  css,
  _freshRoute___api_health as default,
  handler,
  handlers
};
