// 一次性脚本：将第一个注册用户设为管理员
// 使用方式：deno run -A --unstable-kv scripts/set-admin.ts <邮箱>

const email = Deno.args[0];
if (!email) {
  console.log("用法: deno run -A --unstable-kv scripts/set-admin.ts <邮箱>");
  console.log("示例: deno run -A --unstable-kv scripts/set-admin.ts admin@delinux.dev");
  Deno.exit(1);
}

const kv = await Deno.openKv();

// 通过邮箱找用户
const userIdEntry = await kv.get<string>(["users_by_email", email.toLowerCase()]);
if (!userIdEntry.value) {
  console.error(`❌ 未找到邮箱为 ${email} 的用户`);
  Deno.exit(1);
}

const userId = userIdEntry.value;
const userEntry = await kv.get<Record<string, unknown>>(["users", userId]);
if (!userEntry.value) {
  console.error(`❌ 用户数据不存在: ${userId}`);
  Deno.exit(1);
}

const user = userEntry.value;
console.log(`📋 找到用户: ${user.username} (${user.email})`);
console.log(`   当前角色: ${user.role}`);

if (user.role === "admin") {
  console.log("✅ 该用户已经是管理员了");
  Deno.exit(0);
}

// 设为管理员
const updated = { ...user, role: "admin" };
await kv.set(["users", userId], updated);
console.log("✅ 已成功设为管理员！");

kv.close();
