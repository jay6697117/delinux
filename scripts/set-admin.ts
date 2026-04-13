// 一次性脚本：将指定邮箱的用户设为管理员
// 使用方式：deno run -A scripts/set-admin.ts <邮箱>

import { getDb, initDb } from "../utils/db.ts";

const email = Deno.args[0];
if (!email) {
  console.log("用法: deno run -A scripts/set-admin.ts <邮箱>");
  console.log("示例: deno run -A scripts/set-admin.ts admin@delinux.dev");
  Deno.exit(1);
}

await initDb();
const db = getDb();

// 通过邮箱找用户
const result = await db.execute({
  sql: "SELECT id, username, email, role FROM users WHERE LOWER(email) = ?",
  args: [email.toLowerCase()],
});

if (result.rows.length === 0) {
  console.error(`❌ 未找到邮箱为 ${email} 的用户`);
  Deno.exit(1);
}

const user = result.rows[0];
console.log(`📋 找到用户: ${user.username} (${user.email})`);
console.log(`   当前角色: ${user.role}`);

if (user.role === "admin") {
  console.log("✅ 该用户已经是管理员了");
  Deno.exit(0);
}

// 设为管理员
await db.execute({
  sql: "UPDATE users SET role = 'admin' WHERE id = ?",
  args: [user.id as string],
});
console.log("✅ 已成功设为管理员！");
