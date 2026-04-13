// 缓存策略纯函数测试

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getCacheControl } from "../utils/cache.ts";

Deno.test("缓存策略: /assets/*.js 返回 immutable", () => {
  const result = getCacheControl("/assets/app-abc123.js");
  assertEquals(result, "public, max-age=31536000, immutable");
});

Deno.test("缓存策略: /assets/*.css 返回 immutable", () => {
  const result = getCacheControl("/assets/styles-xyz.css");
  assertEquals(result, "public, max-age=31536000, immutable");
});

Deno.test("缓存策略: /_fresh/chunk-*.js 返回 immutable", () => {
  const result = getCacheControl("/_fresh/chunk-abc.js");
  assertEquals(result, "public, max-age=31536000, immutable");
});

Deno.test("缓存策略: /styles.css 返回短缓存（非 immutable）", () => {
  const result = getCacheControl("/styles.css");
  assertEquals(
    result,
    "public, max-age=604800, stale-while-revalidate=2592000",
  );
  // 确认不是 immutable
  assertEquals(result!.includes("immutable"), false);
});

Deno.test("缓存策略: 首页 / 不设缓存", () => {
  const result = getCacheControl("/");
  assertEquals(result, null);
});

Deno.test("缓存策略: 帖子页 /post/123 不设缓存", () => {
  const result = getCacheControl("/post/123");
  assertEquals(result, null);
});

Deno.test("缓存策略: /search 不设缓存", () => {
  const result = getCacheControl("/search");
  assertEquals(result, null);
});
