// 帖子相关业务逻辑（Turso SQL 版本）

import { generateId, getDb } from "./db.ts";
import { invalidateCache } from "./cache.ts";
import type { Post, Reply } from "./state.ts";

// ===== 帖子操作 =====

// 创建帖子
export async function createPost(
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  boardSlug: string,
): Promise<Post> {
  const db = getDb();
  const id = generateId();
  const now = Date.now();

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

  // 一条 INSERT，索引和 FTS5 由数据库自动维护
  await db.execute({
    sql:
      `INSERT INTO posts (id, title, content, author_id, author_name, board_slug, created_at, last_reply_at, reply_count, like_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    args: [id, title, content, authorId, authorName, boardSlug, now, now],
  });

  // 失效首页和版块缓存
  invalidateCache("home:");
  invalidateCache(`board:${boardSlug}`);

  return post;
}

// 获取帖子
export async function getPost(id: string): Promise<Post | null> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM posts WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToPost(result.rows[0]);
}

// 批量获取帖子
export async function getPostsByIds(ids: string[]): Promise<Post[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  // 使用 IN 查询一次获取所有帖子
  const placeholders = ids.map(() => "?").join(", ");
  const result = await db.execute({
    sql: `SELECT * FROM posts WHERE id IN (${placeholders})`,
    args: ids,
  });
  // 按原始 ID 顺序返回
  const postMap = new Map<string, Post>();
  for (const row of result.rows) {
    const post = rowToPost(row);
    postMap.set(post.id, post);
  }
  return ids.map((id) => postMap.get(id)).filter((p): p is Post => p != null);
}

// 获取最新帖子列表（首页用）
export async function getLatestPosts(
  limit = 20,
  offset = 0,
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM posts ORDER BY last_reply_at DESC LIMIT ? OFFSET ?",
    args: [limit + 1, offset],
  });
  const hasMore = result.rows.length > limit;
  const posts = result.rows.slice(0, limit).map(rowToPost);
  return { posts, hasMore };
}

// 获取版块帖子列表
export async function getBoardPosts(
  boardSlug: string,
  limit = 20,
  offset = 0,
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const db = getDb();
  const result = await db.execute({
    sql:
      `SELECT * FROM posts WHERE board_slug = ? ORDER BY last_reply_at DESC LIMIT ? OFFSET ?`,
    args: [boardSlug, limit + 1, offset],
  });
  const hasMore = result.rows.length > limit;
  const posts = result.rows.slice(0, limit).map(rowToPost);
  return { posts, hasMore };
}

// 获取用户的帖子列表
export async function getUserPosts(
  userId: string,
  limit = 20,
): Promise<Post[]> {
  const db = getDb();
  const result = await db.execute({
    sql:
      `SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC LIMIT ?`,
    args: [userId, limit],
  });
  return result.rows.map(rowToPost);
}

// 删除帖子（管理员）
export async function deletePost(id: string): Promise<boolean> {
  const db = getDb();
  const postResult = await db.execute({
    sql: "SELECT board_slug FROM posts WHERE id = ?",
    args: [id],
  });
  if (postResult.rows.length === 0) return false;

  const boardSlug = postResult.rows[0].board_slug as string;

  // 批量删除帖子及关联数据
  await db.batch([
    { sql: "DELETE FROM replies WHERE post_id = ?", args: [id] },
    { sql: "DELETE FROM likes WHERE post_id = ?", args: [id] },
    {
      sql: "DELETE FROM favorites WHERE post_id = ?",
      args: [id],
    },
    { sql: "DELETE FROM posts WHERE id = ?", args: [id] },
  ]);

  invalidateCache("home:");
  invalidateCache(`board:${boardSlug}`);
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
  const db = getDb();

  // 检查帖子是否存在
  const postResult = await db.execute({
    sql: "SELECT board_slug FROM posts WHERE id = ?",
    args: [postId],
  });
  if (postResult.rows.length === 0) return null;

  const boardSlug = postResult.rows[0].board_slug as string;
  const id = generateId();
  const now = Date.now();

  const reply: Reply = {
    id,
    postId,
    content,
    authorId,
    authorName,
    createdAt: now,
  };

  // 插入回复 + 更新帖子统计（batch 保证原子性）
  await db.batch([
    {
      sql:
        `INSERT INTO replies (id, post_id, content, author_id, author_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, postId, content, authorId, authorName, now],
    },
    {
      sql:
        `UPDATE posts SET reply_count = reply_count + 1, last_reply_at = ? WHERE id = ?`,
      args: [now, postId],
    },
  ]);

  // 失效缓存
  invalidateCache("home:");
  invalidateCache(`board:${boardSlug}`);

  return reply;
}

// 获取帖子的回复列表
export async function getReplies(
  postId: string,
  _cursor?: string,
  limit = 20,
): Promise<{ items: Reply[]; cursor?: string; hasMore: boolean }> {
  const db = getDb();
  const result = await db.execute({
    sql:
      `SELECT * FROM replies WHERE post_id = ? ORDER BY created_at ASC LIMIT ?`,
    args: [postId, limit + 1],
  });

  const hasMore = result.rows.length > limit;
  const items = result.rows.slice(0, limit).map(rowToReply);

  return { items, hasMore };
}

// ===== 点赞操作 =====

export async function toggleLike(
  postId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();

  // 检查是否已点赞
  const existing = await db.execute({
    sql: "SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?",
    args: [postId, userId],
  });

  if (existing.rows.length > 0) {
    // 取消点赞
    await db.batch([
      {
        sql: "DELETE FROM likes WHERE post_id = ? AND user_id = ?",
        args: [postId, userId],
      },
      {
        sql:
          "UPDATE posts SET like_count = MAX(0, like_count - 1) WHERE id = ?",
        args: [postId],
      },
    ]);
    return false;
  } else {
    // 点赞
    await db.batch([
      {
        sql: "INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)",
        args: [postId, userId],
      },
      {
        sql: "UPDATE posts SET like_count = like_count + 1 WHERE id = ?",
        args: [postId],
      },
    ]);
    return true;
  }
}

export async function isLiked(
  postId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?",
    args: [postId, userId],
  });
  return result.rows.length > 0;
}

// ===== 收藏操作 =====

export async function toggleFavorite(
  postId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();

  const existing = await db.execute({
    sql: "SELECT 1 FROM favorites WHERE user_id = ? AND post_id = ?",
    args: [userId, postId],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: "DELETE FROM favorites WHERE user_id = ? AND post_id = ?",
      args: [userId, postId],
    });
    return false;
  } else {
    await db.execute({
      sql:
        "INSERT INTO favorites (user_id, post_id, created_at) VALUES (?, ?, ?)",
      args: [userId, postId, Date.now()],
    });
    return true;
  }
}

export async function isFavorited(
  postId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT 1 FROM favorites WHERE user_id = ? AND post_id = ?",
    args: [userId, postId],
  });
  return result.rows.length > 0;
}

// 获取用户的收藏列表
export async function getUserFavorites(
  userId: string,
  _cursor?: string,
  limit = 20,
): Promise<{ items: Post[]; cursor?: string; hasMore: boolean }> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT p.* FROM favorites f
          JOIN posts p ON p.id = f.post_id
          WHERE f.user_id = ?
          ORDER BY f.created_at DESC
          LIMIT ?`,
    args: [userId, limit + 1],
  });

  const hasMore = result.rows.length > limit;
  const items = result.rows.slice(0, limit).map(rowToPost);

  return { items, hasMore };
}

// ===== 搜索 =====

// 搜索帖子（使用 FTS5 全文搜索，替代手动分词方案）
export async function searchPosts(
  query: string,
  limit = 30,
): Promise<Post[]> {
  if (!query.trim()) return [];

  const db = getDb();

  // FTS5 支持中文和英文搜索
  // 将空格分隔的词用 AND 连接提高搜索精度
  const ftsQuery = query.trim().split(/\s+/).join(" AND ");

  try {
    const result = await db.execute({
      sql: `SELECT p.* FROM posts_fts f
            JOIN posts p ON p.rowid = f.rowid
            WHERE posts_fts MATCH ?
            ORDER BY rank
            LIMIT ?`,
      args: [ftsQuery, limit],
    });
    return result.rows.map(rowToPost);
  } catch {
    // FTS5 查询语法错误时回退到 LIKE 搜索
    const result = await db.execute({
      sql: `SELECT * FROM posts
            WHERE title LIKE ? OR content LIKE ?
            ORDER BY last_reply_at DESC
            LIMIT ?`,
      args: [`%${query}%`, `%${query}%`, limit],
    });
    return result.rows.map(rowToPost);
  }
}

// ===== 行数据 → TypeScript 对象转换 =====

// deno-lint-ignore no-explicit-any
function rowToPost(row: any): Post {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    boardSlug: row.board_slug as string,
    createdAt: row.created_at as number,
    lastReplyAt: row.last_reply_at as number,
    replyCount: row.reply_count as number,
    likeCount: row.like_count as number,
  };
}

// deno-lint-ignore no-explicit-any
function rowToReply(row: any): Reply {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    content: row.content as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    createdAt: row.created_at as number,
  };
}
