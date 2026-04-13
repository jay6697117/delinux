// Turso (libSQL) 数据库连接与工具函数

import { type Client, createClient } from "@libsql/client";

let _db: Client | null = null;

// 获取 Turso 数据库实例（单例，全局复用）
export function getDb(): Client {
  if (!_db) {
    const isDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
    if (isDeploy) {
      // 生产环境：连接 Turso 云端数据库
      _db = createClient({
        url: Deno.env.get("TURSO_DATABASE_URL")!,
        authToken: Deno.env.get("TURSO_AUTH_TOKEN"),
      });
    } else {
      // 本地开发：使用文件型 SQLite
      _db = createClient({ url: "file:./local.db" });
    }
  }
  return _db;
}

// 生成唯一 ID
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

// 初始化数据库表（首次启动时自动建表）
export async function initDb(): Promise<void> {
  const db = getDb();
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

  // FTS5 全文搜索表（单独执行，因为含 VIRTUAL TABLE 语法）
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

  // 清理过期 Session（每次启动时清理一次）
  await db.execute({
    sql: "DELETE FROM sessions WHERE expires_at < ?",
    args: [Date.now()],
  });
}
