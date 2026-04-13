// 批量帖子读取测试（纯逻辑层面）
// 注意：getPostsByIds 依赖 Deno KV，需要处理资源清理

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getPostsByIds } from "../utils/posts.ts";

Deno.test("getPostsByIds: 空数组输入返回空数组", async () => {
  const result = await getPostsByIds([]);
  assertEquals(result, []);
  assertEquals(result.length, 0);
});

Deno.test({
  name: "getPostsByIds: 不存在的 ID 被过滤",
  // KV 连接在模块级别被缓存，sanitizeResources 关闭避免误报
  sanitizeResources: false,
  async fn() {
    const result = await getPostsByIds([
      "nonexistent_id_a",
      "nonexistent_id_b",
      "nonexistent_id_c",
    ]);
    assertEquals(result.length, 0);
  },
});
