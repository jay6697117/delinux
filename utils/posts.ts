// 帖子相关业务逻辑

import { generateId, getKv, invertTimestamp } from "./db.ts";
import { invalidateCache } from "./cache.ts";
import type { Post, Reply } from "./state.ts";

export interface PostKvReader {
  get<T>(key: Deno.KvKey): Promise<{ value: T | null }>;
}

// ===== 帖子操作 =====

// 创建帖子
export async function createPost(
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  boardSlug: string,
): Promise<Post> {
  const kv = await getKv();
  const id = generateId();
  const now = Date.now();
  const invertedTime = invertTimestamp(now);

  const post: Post = {
    id,
    title,
    content,
    authorId,
    authorName,
    boardSlug,
    createdAt: now,
    lastReplyAt: now,
    replyCount: 0,
    likeCount: 0,
  };

  // 原子操作：写入帖子 + 索引 + 更新版块计数
  const boardEntry = await kv.get<{ postCount: number }>(["boards", boardSlug]);
  const currentCount = boardEntry.value?.postCount || 0;

  await kv.atomic()
    .set(["posts", id], post)
    .set(["posts_by_board", boardSlug, invertedTime, id], id)
    .set(["posts_by_user", authorId, invertedTime, id], id)
    .set(["posts_latest", invertedTime, id], id)
    .commit();

  // 单独更新版块计数（避免原子操作过大）
  if (boardEntry.value) {
    const updatedBoard = { ...boardEntry.value, postCount: currentCount + 1 };
    await kv.set(["boards", boardSlug], updatedBoard);
  }

  // 建立搜索索引
  await indexPost(id, title, boardSlug, now);

  // 失效首页和版块缓存
  invalidateCache("home:");
  invalidateCache(`board:${boardSlug}`);

  return post;
}

// 获取帖子
export async function getPost(id: string): Promise<Post | null> {
  const kv = await getKv();
  const entry = await kv.get<Post>(["posts", id], { consistency: "eventual" });
  return entry.value;
}

// 批量获取帖子（使用 getMany 单次请求替代 N 次并行 get，减少网络往返）
export async function getPostsByIds(
  ids: string[],
  kvReader?: PostKvReader,
): Promise<Post[]> {
  if (ids.length === 0) return [];
  const kv = kvReader ?? await getKv();
  // getMany 将 N 次网络请求合并为 1 次
  const keys = ids.map((id) => ["posts", id] as Deno.KvKey);
  const entries = await (kv as Deno.Kv).getMany<Post[]>(keys, {
    consistency: "eventual",
  });
  return entries
    .filter((entry: Deno.KvEntryMaybe<Post>) => entry.value !== null)
    .map((entry: Deno.KvEntryMaybe<Post>) => entry.value as Post);
}

// 删除帖子（管理员）
export async function deletePost(id: string): Promise<boolean> {
  const kv = await getKv();
  const postEntry = await kv.get<Post>(["posts", id], {
    consistency: "eventual",
  });
  if (!postEntry.value) return false;

  const post = postEntry.value;
  const invertedCreated = invertTimestamp(post.lastReplyAt);

  // 删除帖子和相关索引
  await kv.atomic()
    .delete(["posts", id])
    .delete(["posts_by_board", post.boardSlug, invertedCreated, id])
    .delete([
      "posts_by_user",
      post.authorId,
      invertTimestamp(post.createdAt),
      id,
    ])
    .delete(["posts_latest", invertedCreated, id])
    .commit();

  return true;
}

// ===== 回复操作 =====

// 创建回复
export async function createReply(
  postId: string,
  content: string,
  authorId: string,
  authorName: string,
): Promise<Reply | null> {
  const kv = await getKv();

  // 获取帖子（eventual 降低读延迟，atomic 保证写入安全）
  const postEntry = await kv.get<Post>(["posts", postId], {
    consistency: "eventual",
  });
  if (!postEntry.value) return null;

  const post = postEntry.value;
  const id = generateId();
  const now = Date.now();
  const oldInvertedTime = invertTimestamp(post.lastReplyAt);
  const newInvertedTime = invertTimestamp(now);

  const reply: Reply = {
    id,
    postId,
    content,
    authorId,
    authorName,
    createdAt: now,
  };

  // 更新帖子的回复计数和最后回复时间
  const updatedPost: Post = {
    ...post,
    replyCount: post.replyCount + 1,
    lastReplyAt: now,
  };

  await kv.atomic()
    .set(["replies", postId, id], reply)
    .set(["replies_by_user", authorId, invertTimestamp(now)], {
      postId,
      replyId: id,
    })
    .set(["posts", postId], updatedPost)
    // 更新索引：删除旧的，插入新的
    .delete(["posts_by_board", post.boardSlug, oldInvertedTime, postId])
    .set(["posts_by_board", post.boardSlug, newInvertedTime, postId], postId)
    .delete(["posts_latest", oldInvertedTime, postId])
    .set(["posts_latest", newInvertedTime, postId], postId)
    .commit();

  // 失效首页和版块缓存（回复会更新帖子排序）
  invalidateCache("home:");
  invalidateCache(`board:${post.boardSlug}`);

  return reply;
}

// 获取帖子的回复列表
export async function getReplies(
  postId: string,
  cursor?: string,
  limit = 20,
): Promise<{ items: Reply[]; cursor?: string; hasMore: boolean }> {
  const kv = await getKv();
  const entries = kv.list<Reply>({ prefix: ["replies", postId] }, {
    limit: limit + 1,
    cursor,
    consistency: "eventual",
  });

  const items: Reply[] = [];
  let nextCursor: string | undefined;
  let count = 0;

  for await (const entry of entries) {
    count++;
    if (count > limit) break;
    items.push(entry.value);
    nextCursor = entries.cursor;
  }

  return {
    items: items.reverse(), // 最新回复排在上面
    cursor: count > limit ? nextCursor : undefined,
    hasMore: count > limit,
  };
}

// ===== 点赞操作 =====

export async function toggleLike(
  postId: string,
  userId: string,
): Promise<boolean> {
  const kv = await getKv();
  const likeKey: Deno.KvKey = ["likes", postId, userId];
  // 并行读取点赞状态和帖子数据（eventual 降低延迟）
  const [existing, postEntry] = await Promise.all([
    kv.get(likeKey, { consistency: "eventual" }),
    kv.get<Post>(["posts", postId], { consistency: "eventual" }),
  ]);
  if (!postEntry.value) return false;

  const post = postEntry.value;

  if (existing.value) {
    // 取消点赞
    await kv.atomic()
      .delete(likeKey)
      .delete(["likes_by_user", userId, postId])
      .set(["posts", postId], {
        ...post,
        likeCount: Math.max(0, post.likeCount - 1),
      })
      .commit();
    return false; // 返回当前是否已点赞
  } else {
    // 点赞
    await kv.atomic()
      .set(likeKey, true)
      .set(["likes_by_user", userId, postId], true)
      .set(["posts", postId], { ...post, likeCount: post.likeCount + 1 })
      .commit();
    return true;
  }
}

export async function isLiked(
  postId: string,
  userId: string,
): Promise<boolean> {
  const kv = await getKv();
  const entry = await kv.get(["likes", postId, userId], {
    consistency: "eventual",
  });
  return !!entry.value;
}

// ===== 收藏操作 =====

export async function toggleFavorite(
  postId: string,
  userId: string,
): Promise<boolean> {
  const kv = await getKv();
  const favKey: Deno.KvKey = ["favorites", userId, postId];
  const existing = await kv.get(favKey, { consistency: "eventual" });

  if (existing.value) {
    await kv.atomic()
      .delete(favKey)
      .delete(["favorites_by_post", postId, userId])
      .commit();
    return false;
  } else {
    await kv.atomic()
      .set(favKey, true)
      .set(["favorites_by_post", postId, userId], true)
      .commit();
    return true;
  }
}

export async function isFavorited(
  postId: string,
  userId: string,
): Promise<boolean> {
  const kv = await getKv();
  const entry = await kv.get(["favorites", userId, postId], {
    consistency: "eventual",
  });
  return !!entry.value;
}

// 获取用户的收藏列表
export async function getUserFavorites(
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ items: Post[]; cursor?: string; hasMore: boolean }> {
  const kv = await getKv();
  const entries = kv.list<boolean>({ prefix: ["favorites", userId] }, {
    limit: limit + 1,
    cursor,
    consistency: "eventual",
  });

  const postIds: string[] = [];
  let nextCursor: string | undefined;
  let count = 0;

  for await (const entry of entries) {
    count++;
    if (count > limit) break;
    // key 格式：["favorites", userId, postId]
    postIds.push(entry.key[2] as string);
    nextCursor = entries.cursor;
  }

  const posts = await getPostsByIds(postIds);

  return {
    items: posts,
    cursor: count > limit ? nextCursor : undefined,
    hasMore: count > limit,
  };
}

// ===== 搜索索引 =====

// 对标题和内容进行分词并建立索引
async function indexPost(
  postId: string,
  title: string,
  boardSlug: string,
  createdAt: number,
): Promise<void> {
  const kv = await getKv();
  const words = tokenize(title);

  const ops = kv.atomic();
  for (const word of words) {
    ops.set(["search_words", word, postId], { title, boardSlug, createdAt });
  }
  await ops.commit();
}

// 增强分词：中文单字/双字/三字组合，英文按空格，支持前缀匹配
function tokenize(text: string): string[] {
  const words = new Set<string>();
  const lower = text.toLowerCase().trim();

  // 英文单词（支持带连字符的词）
  const enWords = lower.match(/[a-zA-Z0-9][-a-zA-Z0-9]*/g) || [];
  for (const w of enWords) {
    if (w.length >= 2) {
      words.add(w);
      // 添加长词的前缀（用于前缀搜索）
      if (w.length > 4) words.add(w.substring(0, 4));
    }
  }

  // 中文单字、双字和三字组合
  const cnChars = lower.match(/[\u4e00-\u9fa5]/g) || [];
  for (const ch of cnChars) {
    words.add(ch);
  }
  // 双字组合
  for (let i = 0; i < cnChars.length - 1; i++) {
    words.add(cnChars[i] + cnChars[i + 1]);
  }
  // 三字组合（提高长词匹配精度）
  for (let i = 0; i < cnChars.length - 2; i++) {
    words.add(cnChars[i] + cnChars[i + 1] + cnChars[i + 2]);
  }

  return Array.from(words);
}

// 搜索帖子（支持多词交叉搜索 + 相关度排序）
export async function searchPosts(
  query: string,
  limit = 30,
): Promise<Post[]> {
  const kv = await getKv();
  const words = tokenize(query);
  if (words.length === 0) return [];

  // 收集所有匹配的帖子 ID 及匹配词数
  const postScores = new Map<string, number>();

  // 并行查询所有搜索词（替代串行 for...of 循环，减少总延迟）
  const searchResults = await Promise.all(
    words.map(async (word) => {
      const entries = kv.list<
        { title: string; boardSlug: string; createdAt: number }
      >(
        { prefix: ["search_words", word] },
        { limit: 50, consistency: "eventual" },
      );
      const ids: string[] = [];
      for await (const entry of entries) {
        ids.push(entry.key[2] as string);
      }
      return ids;
    }),
  );

  for (const ids of searchResults) {
    for (const postId of ids) {
      postScores.set(postId, (postScores.get(postId) || 0) + 1);
    }
  }

  if (postScores.size === 0) return [];

  // 按匹配词数降序排序
  const sortedIds = Array.from(postScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return await getPostsByIds(sortedIds);
}
