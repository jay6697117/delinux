import { assertEquals } from "jsr:@std/assert@^1.0.19";

import { getPostsByIds } from "./posts.ts";
import type { Post } from "./state.ts";

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

Deno.test("getPostsByIds filters missing posts and preserves input order", async () => {
  const posts = new Map([
    ["a", createPost("a")],
    ["b", createPost("b")],
  ]);

  const fakeKv = {
    get<T>(key: Deno.KvKey): Promise<{ value: T | null }> {
      return Promise.resolve({
        value: (posts.get(String(key[1])) ?? null) as T | null,
      });
    },
  };

  const result = await getPostsByIds(["a", "missing", "b"], fakeKv);

  assertEquals(result.map((post) => post.id), ["a", "b"]);
});
