import { assertEquals } from "jsr:@std/assert@^1.0.19";
import type { Post } from "./state.ts";

// 基础工具函数测试
function createPost(id: string): Post {
  return {
    id,
    title: `title-${id}`,
    content: `content-${id}`,
    authorId: `author-${id}`,
    authorName: `author-${id}`,
    boardSlug: "ai",
    createdAt: 1,
    lastReplyAt: 1,
    replyCount: 0,
    likeCount: 0,
  };
}

Deno.test("createPost helper generates correct structure", () => {
  const post = createPost("test1");
  assertEquals(post.id, "test1");
  assertEquals(post.title, "title-test1");
  assertEquals(post.boardSlug, "ai");
  assertEquals(post.replyCount, 0);
  assertEquals(post.likeCount, 0);
});
