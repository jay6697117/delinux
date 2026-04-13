import { assertEquals } from "jsr:@std/assert@^1.0.19";

import { getBoardBySlug } from "./boards.ts";

Deno.test("getBoardBySlug returns board for known slug", () => {
  assertEquals(getBoardBySlug("ai")?.name, "AI");
});

Deno.test("getBoardBySlug returns undefined for unknown slug", () => {
  assertEquals(getBoardBySlug("missing-board"), undefined);
});
