// 用于清空 Deno KV 中所有数据的一次性脚本
// 使用方式：deno run -A --unstable-kv scripts/clear-kv.ts

const kv = await Deno.openKv();
const entries = kv.list({ prefix: [] });
let count = 0;

console.log("正在清空 Deno KV 数据...");

for await (const entry of entries) {
  await kv.delete(entry.key);
  count++;
}

console.log(`✅ 成功！已清空 ${count} 条 KV 数据。`);

kv.close();
