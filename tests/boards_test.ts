// 版块查询测试

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { BOARDS, getAllBoards, getBoardBySlug } from "../utils/boards.ts";

Deno.test("getBoardBySlug: 正常 slug 返回正确版块", () => {
  const board = getBoardBySlug("ai");
  assertEquals(board?.slug, "ai");
  assertEquals(board?.name, "AI");
  assertEquals(board?.icon, "🤖");
});

Deno.test("getBoardBySlug: chill slug 返回摸鱼版块", () => {
  const board = getBoardBySlug("chill");
  assertEquals(board?.slug, "chill");
  assertEquals(board?.name, "摸鱼");
});

Deno.test("getBoardBySlug: 未知 slug 返回 undefined", () => {
  const board = getBoardBySlug("nonexistent");
  assertEquals(board, undefined);
});

Deno.test("getBoardBySlug: 空字符串返回 undefined", () => {
  const board = getBoardBySlug("");
  assertEquals(board, undefined);
});

Deno.test("getAllBoards: 返回与 BOARDS 长度一致的数组", () => {
  const boards = getAllBoards();
  assertEquals(boards.length, BOARDS.length);
  assertEquals(boards.length, 5);
});

Deno.test("getAllBoards: 每个版块都有必要字段", () => {
  const boards = getAllBoards();
  for (const b of boards) {
    assertEquals(typeof b.slug, "string");
    assertEquals(typeof b.name, "string");
    assertEquals(typeof b.description, "string");
    assertEquals(typeof b.icon, "string");
    assertEquals(b.slug.length > 0, true);
  }
});
