// Turso (libSQL) 数据库连接与工具函数
//
// 策略：
//   生产环境 (Deno Deploy) → 静态 import @libsql/client (web 版)，走 HTTP/WebSocket
//   本地开发 → 动态 import npm:@libsql/client/node，支持 file: URL 本地 SQLite
//
// 生产环境跳过建表（表已通过 initDb 或迁移脚本创建），减少冷启动耗时

// 静态导入 web 版客户端用于生产环境（不含原生模块，Deno Deploy 兼容）
import { type Client, createClient as createWebClient } from "@libsql/client";

let _db: Client | null = null;

// 获取 Turso 数据库实例（必须先调用 initDb）
export function getDb(): Client {
  if (!_db) {
    throw new Error("数据库未初始化，请先调用 initDb()");
  }
  return _db;
}

// 生成唯一 ID
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

// 初始化数据库
export async function initDb(): Promise<void> {
  if (_db) return;

  const tursoUrl = Deno.env.get("TURSO_DATABASE_URL");

  if (tursoUrl) {
    // 生产环境：静态 import 的 web 客户端，零冷启动 import 开销
    _db = createWebClient({
      url: tursoUrl,
      authToken: Deno.env.get("TURSO_AUTH_TOKEN"),
    });
    // 生产环境跳过建表（表已存在），只做轻量级 session 清理
    await _db.execute({
      sql: "DELETE FROM sessions WHERE expires_at < ?",
      args: [Date.now()],
    });
    return;
  }

  // 本地开发：动态导入 node 客户端，支持 file: URL
  const { createClient } = await import("npm:@libsql/client/node");
  _db = createClient({ url: "file:./local.db" });

  // 本地开发才需要建表（首次运行时自动创建）
  await createTables(_db);
}

// 建表逻辑（仅本地开发 / 迁移脚本使用）
export async function createTables(db: Client): Promise<void> {
  await db.batch([
    // 用户表
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      plaintext_password TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL,
      banned INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username))`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email))`,

    // 帖子表
    `CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      board_slug TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_reply_at INTEGER NOT NULL,
      reply_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS idx_posts_latest ON posts(last_reply_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_board ON posts(board_slug, last_reply_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(author_id, created_at DESC)`,

    // 回复表
    `CREATE TABLE IF NOT EXISTS replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_replies_post ON replies(post_id, created_at ASC)`,

    // 点赞表
    `CREATE TABLE IF NOT EXISTS likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id, post_id)`,

    // 收藏表
    `CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, post_id)
    )`,

    // Session 表
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`,
  ]);

  // FTS5 全文搜索表
  await db.execute(`CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
    title, content, content=posts, content_rowid=rowid
  )`);

  // FTS5 同步触发器
  await db.batch([
    `CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
      INSERT INTO posts_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
    END`,
    `CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
    END`,
    `CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
      INSERT INTO posts_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
    END`,
  ]);

  // 清理过期 Session
  await db.execute({
    sql: "DELETE FROM sessions WHERE expires_at < ?",
    args: [Date.now()],
  });
}
