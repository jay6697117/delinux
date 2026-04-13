// 数据迁移脚本：从 Deno KV 迁移到 Turso
// 使用方式：deno run -A --unstable-kv scripts/migrate-kv-to-turso.ts
//
// 注意事项：
// 1. 先确保 Turso 数据库已创建并配置好环境变量
// 2. 在 .env 或环境变量中设置 TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN
// 3. 本地迁移不需要环境变量（自动使用 local.db）

import { type Client, createClient } from "npm:@libsql/client/node";

// 打开 KV（本地文件）
const kv = await Deno.openKv("./local.sqlite");

// 创建 Turso 客户端
const tursoUrl = Deno.env.get("TURSO_DATABASE_URL");
let db: Client;
if (tursoUrl) {
  db = createClient({
    url: tursoUrl,
    authToken: Deno.env.get("TURSO_AUTH_TOKEN"),
  });
} else {
  // 本地开发：使用 node 入口支持 file: URL
  db = createClient({ url: "file:./local.db" });
}

console.log("🔧 初始化 Turso 数据库表...");

// 建表（与 db.ts 中 initDb 一致）
await db.batch([
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
  `CREATE TABLE IF NOT EXISTS replies (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_replies_post ON replies(post_id, created_at ASC)`,
  `CREATE TABLE IF NOT EXISTS likes (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id, post_id)`,
  `CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, post_id)
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`,
]);

await db.execute(`CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title, content, content=posts, content_rowid=rowid
)`);

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

console.log("✅ 表结构创建完成");

// ===== 迁移用户 =====
console.log("\n📦 迁移用户...");
let userCount = 0;
const userEntries = kv.list<{
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  plaintextPassword?: string;
  role: string;
  createdAt: number;
  banned: boolean;
}>({ prefix: ["users"] });

for await (const entry of userEntries) {
  const u = entry.value;
  try {
    await db.execute({
      sql:
        `INSERT OR IGNORE INTO users (id, username, email, password_hash, plaintext_password, role, created_at, banned)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        u.id,
        u.username,
        u.email,
        u.passwordHash,
        u.plaintextPassword || null,
        u.role,
        u.createdAt,
        u.banned ? 1 : 0,
      ],
    });
    userCount++;
  } catch (err) {
    console.warn(`  ⚠️ 跳过用户 ${u.username}: ${err}`);
  }
}
console.log(`  ✅ 迁移了 ${userCount} 个用户`);

// ===== 迁移帖子 =====
console.log("\n📦 迁移帖子...");
let postCount = 0;
const postEntries = kv.list<{
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  boardSlug: string;
  createdAt: number;
  lastReplyAt: number;
  replyCount: number;
  likeCount: number;
}>({ prefix: ["posts"] });

for await (const entry of postEntries) {
  // 过滤掉索引 key（只处理帖子数据 key）
  if (entry.key.length !== 2 || entry.key[0] !== "posts") continue;
  const p = entry.value;
  try {
    await db.execute({
      sql:
        `INSERT OR IGNORE INTO posts (id, title, content, author_id, author_name, board_slug, created_at, last_reply_at, reply_count, like_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.id,
        p.title,
        p.content,
        p.authorId,
        p.authorName,
        p.boardSlug,
        p.createdAt,
        p.lastReplyAt,
        p.replyCount,
        p.likeCount,
      ],
    });
    postCount++;
  } catch (err) {
    console.warn(`  ⚠️ 跳过帖子 ${p.id}: ${err}`);
  }
}
console.log(`  ✅ 迁移了 ${postCount} 篇帖子`);

// ===== 迁移回复 =====
console.log("\n📦 迁移回复...");
let replyCount = 0;
const replyEntries = kv.list<{
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}>({ prefix: ["replies"] });

for await (const entry of replyEntries) {
  // key 格式 ["replies", postId, replyId]
  if (entry.key.length !== 3) continue;
  const r = entry.value;
  try {
    await db.execute({
      sql:
        `INSERT OR IGNORE INTO replies (id, post_id, content, author_id, author_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [r.id, r.postId, r.content, r.authorId, r.authorName, r.createdAt],
    });
    replyCount++;
  } catch (err) {
    console.warn(`  ⚠️ 跳过回复 ${r.id}: ${err}`);
  }
}
console.log(`  ✅ 迁移了 ${replyCount} 条回复`);

// ===== 迁移点赞 =====
console.log("\n📦 迁移点赞...");
let likeCount = 0;
const likeEntries = kv.list<boolean>({ prefix: ["likes"] });

for await (const entry of likeEntries) {
  // key 格式 ["likes", postId, userId]
  if (entry.key.length !== 3 || !entry.value) continue;
  const postId = entry.key[1] as string;
  const userId = entry.key[2] as string;
  try {
    await db.execute({
      sql: "INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)",
      args: [postId, userId],
    });
    likeCount++;
  } catch (err) {
    console.warn(`  ⚠️ 跳过点赞: ${err}`);
  }
}
console.log(`  ✅ 迁移了 ${likeCount} 条点赞`);

// ===== 迁移收藏 =====
console.log("\n📦 迁移收藏...");
let favCount = 0;
const favEntries = kv.list<boolean>({ prefix: ["favorites"] });

for await (const entry of favEntries) {
  // key 格式 ["favorites", userId, postId]
  if (entry.key.length !== 3 || !entry.value) continue;
  const userId = entry.key[1] as string;
  const postId = entry.key[2] as string;
  try {
    await db.execute({
      sql:
        "INSERT OR IGNORE INTO favorites (user_id, post_id, created_at) VALUES (?, ?, ?)",
      args: [userId, postId, Date.now()],
    });
    favCount++;
  } catch (err) {
    console.warn(`  ⚠️ 跳过收藏: ${err}`);
  }
}
console.log(`  ✅ 迁移了 ${favCount} 条收藏`);

// ===== 迁移活跃 Session =====
console.log("\n📦 迁移 Session...");
let sessionCount = 0;
const now = Date.now();
const sessionEntries = kv.list<{
  userId: string;
  createdAt: number;
  expiresAt: number;
}>({ prefix: ["sessions"] });

for await (const entry of sessionEntries) {
  if (entry.key.length !== 2) continue;
  const s = entry.value;
  // 只迁移未过期的 session
  if (s.expiresAt < now) continue;
  const sessionId = entry.key[1] as string;
  try {
    await db.execute({
      sql:
        "INSERT OR IGNORE INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
      args: [sessionId, s.userId, s.createdAt, s.expiresAt],
    });
    sessionCount++;
  } catch (err) {
    console.warn(`  ⚠️ 跳过 session: ${err}`);
  }
}
console.log(`  ✅ 迁移了 ${sessionCount} 条活跃 Session`);

// ===== 完成 =====
console.log("\n🎉 迁移完成！");
console.log(`  用户: ${userCount}`);
console.log(`  帖子: ${postCount}`);
console.log(`  回复: ${replyCount}`);
console.log(`  点赞: ${likeCount}`);
console.log(`  收藏: ${favCount}`);
console.log(`  Session: ${sessionCount}`);

kv.close();
