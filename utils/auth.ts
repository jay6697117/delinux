// 用户认证相关业务逻辑（Turso SQL 版本）

import { generateId, getDb } from "./db.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import type { Session, User, UserPublic } from "./state.ts";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 天

// ===== 用户操作 =====

// 注册用户
export async function createUser(
  username: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: UserPublic }> {
  const db = getDb();

  // UNIQUE INDEX 自动防重，无需手动检查
  // 但为了返回友好的错误信息，先查一下
  const [existingName, existingEmail] = await Promise.all([
    db.execute({
      sql: "SELECT 1 FROM users WHERE LOWER(username) = ?",
      args: [username.toLowerCase()],
    }),
    db.execute({
      sql: "SELECT 1 FROM users WHERE LOWER(email) = ?",
      args: [email.toLowerCase()],
    }),
  ]);

  if (existingName.rows.length > 0) {
    return { ok: false, error: "用户名已被注册" };
  }
  if (existingEmail.rows.length > 0) {
    return { ok: false, error: "邮箱已被注册" };
  }

  const id = generateId();
  const passwordHash = await hashPassword(password);
  const now = Date.now();

  // 检查是否为首个用户（首个用户自动成为管理员）
  const countResult = await db.execute(
    "SELECT COUNT(*) as cnt FROM users",
  );
  const isFirstUser = (countResult.rows[0].cnt as number) === 0;
  const role = isFirstUser ? "admin" : "user";

  try {
    await db.execute({
      sql:
        `INSERT INTO users (id, username, email, password_hash, plaintext_password, role, created_at, banned)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [
        id,
        username,
        email.toLowerCase(),
        passwordHash,
        password,
        role,
        now,
      ],
    });
  } catch {
    // UNIQUE 约束冲突（并发注册场景）
    return { ok: false, error: "注册失败，请重试" };
  }

  return {
    ok: true,
    user: {
      id,
      username,
      role: role as "user" | "admin",
      createdAt: now,
      banned: false,
    },
  };
}

// 登录验证
export async function loginUser(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: User }> {
  const db = getDb();

  // 一条 SQL 直接按 email 查询（不再需要 users_by_email 二级索引）
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE LOWER(email) = ?",
    args: [email.toLowerCase()],
  });

  if (result.rows.length === 0) {
    return { ok: false, error: "邮箱或密码错误" };
  }

  const user = rowToUser(result.rows[0]);

  // 检查是否被禁言
  if (user.banned) {
    return { ok: false, error: "账号已被禁止登录" };
  }

  // 验证密码
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "邮箱或密码错误" };
  }

  return { ok: true, user };
}

// 获取用户（公开信息）
export async function getUserById(id: string): Promise<UserPublic | null> {
  const db = getDb();
  const result = await db.execute({
    sql:
      "SELECT id, username, role, created_at, banned FROM users WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    username: row.username as string,
    role: row.role as "user" | "admin",
    createdAt: row.created_at as number,
    banned: !!(row.banned as number),
  };
}

// 获取所有用户（管理员用）
export async function getAllUsers(): Promise<User[]> {
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM users ORDER BY created_at DESC LIMIT 500",
  );
  return result.rows.map(rowToUser);
}

// 设置用户角色
export async function setUserRole(
  userId: string,
  role: "user" | "admin",
): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: "UPDATE users SET role = ? WHERE id = ?",
    args: [role, userId],
  });
  return result.rowsAffected > 0;
}

// 修改密码
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT password_hash FROM users WHERE id = ?",
    args: [userId],
  });
  if (result.rows.length === 0) return { ok: false, error: "用户不存在" };

  // 验证旧密码
  const valid = await verifyPassword(
    oldPassword,
    result.rows[0].password_hash as string,
  );
  if (!valid) return { ok: false, error: "当前密码输入错误" };

  // 生成新密码哈希并更新
  const newHash = await hashPassword(newPassword);
  await db.execute({
    sql:
      "UPDATE users SET password_hash = ?, plaintext_password = ? WHERE id = ?",
    args: [newHash, newPassword, userId],
  });
  return { ok: true };
}

// ===== Session 操作 =====

// 创建 Session
export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = generateId() + generateId(); // 32 字符
  const now = Date.now();

  await db.execute({
    sql:
      "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    args: [sessionId, userId, now, now + SESSION_DURATION],
  });

  return sessionId;
}

// 获取 Session
export async function getSession(sessionId: string): Promise<Session | null> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM sessions WHERE id = ? AND expires_at > ?",
    args: [sessionId, Date.now()],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    userId: row.user_id as string,
    createdAt: row.created_at as number,
    expiresAt: row.expires_at as number,
  };
}

// 删除 Session
export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM sessions WHERE id = ?",
    args: [sessionId],
  });
}

// 从 Cookie 中解析 sessionId
export function getSessionIdFromCookie(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

// 生成 Set-Cookie 头
export function createSessionCookie(sessionId: string): string {
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
    SESSION_DURATION / 1000
  }`;
}

// 生成删除 Cookie 的头
export function clearSessionCookie(): string {
  return `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ===== Session 内存缓存（减少重复查询） =====

const sessionCache = new Map<string, { user: UserPublic; expAt: number }>();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

// 通过 sessionId 获取用户（带内存缓存）
export async function getUserBySession(
  sessionId: string,
): Promise<UserPublic | null> {
  // 先查内存缓存
  const cached = sessionCache.get(sessionId);
  if (cached && cached.expAt > Date.now()) {
    return cached.user;
  }

  // 未命中缓存，查数据库
  const session = await getSession(sessionId);
  if (!session) {
    sessionCache.delete(sessionId);
    return null;
  }

  const user = await getUserById(session.userId);
  if (user) {
    sessionCache.set(sessionId, {
      user,
      expAt: Date.now() + SESSION_CACHE_TTL,
    });
    // 防止内存泄漏
    if (sessionCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of sessionCache) {
        if (v.expAt < now) sessionCache.delete(k);
      }
    }
  }
  return user;
}

// 登出时清除缓存
export function clearSessionCache(sessionId: string): void {
  sessionCache.delete(sessionId);
}

// ===== 行数据 → TypeScript 对象转换 =====

// deno-lint-ignore no-explicit-any
function rowToUser(row: any): User {
  return {
    id: row.id as string,
    username: row.username as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    plaintextPassword: row.plaintext_password as string | undefined,
    role: row.role as "user" | "admin",
    createdAt: row.created_at as number,
    banned: !!(row.banned as number),
  };
}
