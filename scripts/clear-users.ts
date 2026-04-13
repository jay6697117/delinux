// 用于单独清空所有用户数据的一次性脚本
// 使用方式：deno run -A --unstable-kv scripts/clear-users.ts

const kv = await Deno.openKv();
let count = 0;

console.log("正在清空数据库里的用户数据...");

const prefixes = [["users"], ["users_by_name"], ["users_by_email"], ["sessions"]];

for (const prefix of prefixes) {
  const entries = kv.list({ prefix });
  for await (const entry of entries) {
    await kv.delete(entry.key);
    count++;
  }
}

console.log(`✅ 成功！一共删除了 ${count} 条账号相关数据（包含账号、邮箱索引和登录状态）。`);

kv.close();
