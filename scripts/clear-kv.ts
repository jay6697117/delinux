// 用于清空 Turso 数据库中所有数据的一次性脚本
// 使用方式：deno run -A scripts/clear-kv.ts

import { getDb, initDb } from "../utils/db.ts";

await initDb();
const db = getDb();

console.log("正在清空 Turso 数据库数据...");

await db.batch([
  "DELETE FROM replies",
  "DELETE FROM likes",
  "DELETE FROM favorites",
  "DELETE FROM sessions",
  "DELETE FROM posts",
  "DELETE FROM users",
]);

console.log("✅ 成功！已清空所有表数据。");
