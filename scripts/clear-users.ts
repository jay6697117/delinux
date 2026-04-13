// 用于单独清空所有用户数据的一次性脚本
// 使用方式：deno run -A scripts/clear-users.ts

import { getDb, initDb } from "../utils/db.ts";

await initDb();
const db = getDb();

console.log("正在清空数据库里的用户数据...");

await db.batch([
  "DELETE FROM sessions",
  "DELETE FROM users",
]);

console.log("✅ 成功！已清空所有用户和登录状态数据。");
