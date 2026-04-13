import { assertEquals } from "jsr:@std/assert@^1.0.19";

import { getStaticAssetCacheControl } from "./main.ts";

Deno.test("getStaticAssetCacheControl returns immutable for hashed asset js", () => {
  assertEquals(
    getStaticAssetCacheControl("/assets/app-123.js"),
    "public, max-age=31536000, immutable",
  );
});

Deno.test("getStaticAssetCacheControl keeps styles.css on short cache", () => {
  assertEquals(
    getStaticAssetCacheControl("/styles.css"),
    "public, max-age=604800, stale-while-revalidate=2592000",
  );
});
