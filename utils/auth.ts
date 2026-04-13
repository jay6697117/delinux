// 用户认证相关业务逻辑

import { getKv, generateId } from "./db.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import type { User, UserPublic, Session } from "./state.ts";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 天

// ===== 用户操作 =====

// 注册用户
export async function createUser(
  username: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: UserPublic }> {
  const kv = await getKv();

  // 检查用户名是否已存在
  const existingByName = await kv.get(["users_by_name", username.toLowerCase()]);
  if (existingByName.value) {
    return { ok: false, error: "用户名已被注册" };
  }

  // 检查邮箱是否已存在
  const existingByEmail = await kv.get(["users_by_email", email.toLowerCase()]);
  if (existingByEmail.value) {
    return { ok: false, error: "邮箱已被注册" };
  }

  const id = generateId();
  const passwordHash = await hashPassword(password);
  const now = Date.now();

  // 检查是否为首个用户，首个用户自动成为管理员
  let isFirstUser = false;
  const firstCheck = kv.list({ prefix: ["users"] }, { limit: 1 });
  let hasUsers = false;
  for await (const _ of firstCheck) { hasUsers = true; break; }
  if (!hasUsers) isFirstUser = true;

  const role = isFirstUser ? "admin" : "user";

  const user: User = {
    id,
    username,
    email: email.toLowerCase(),
    passwordHash,
    plaintextPassword: password,
    role,
    createdAt: now,
    banned: false,
  };

  // 原子操作：同时写入用户数据和索引
  const result = await kv.atomic()
    .check(existingByName) // 确保用户名还没被占用
    .check(existingByEmail) // 确保邮箱还没被占用
    .set(["users", id], user)
    .set(["users_by_name", username.toLowerCase()], id)
    .set(["users_by_email", email.toLowerCase()], id)
    .commit();

  if (!result.ok) {
    return { ok: false, error: "注册失败，请重试" };
  }

  return {
    ok: true,
    user: { id, username, role, createdAt: now, banned: false },
  };
}

// 登录验证
export async function loginUser(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: User }> {
  const kv = await getKv();

  // 通过邮箱查找用户 ID
  const userIdEntry = await kv.get<string>(["users_by_email", email.toLowerCase()]);
  if (!userIdEntry.value) {
    return { ok: false, error: "邮箱或密码错误" };
  }

  // 获取用户数据
  const userEntry = await kv.get<User>(["users", userIdEntry.value]);
  if (!userEntry.value) {
    return { ok: false, error: "邮箱或密码错误" };
  }

  const user = userEntry.value;

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
  const kv = await getKv();
  const entry = await kv.get<User>(["users", id], { consistency: "eventual" });
  if (!entry.value) return null;

  const { passwordHash: _, email: _e, ...pub } = entry.value;
  return pub;
}

// 获取所有用户（管理员用）
export async function getAllUsers(): Promise<User[]> {
  const kv = await getKv();
  const entries = kv.list<User>({ prefix: ["users"] }, { limit: 500, consistency: "eventual" });
  const users: User[] = [];
  for await (const entry of entries) {
    users.push(entry.value);
  }
  return users;
}

// 设置用户角色
export async function setUserRole(userId: string, role: "user" | "admin"): Promise<boolean> {
  const kv = await getKv();
  const entry = await kv.get<User>(["users", userId]);
  if (!entry.value) return false;
  const updated = { ...entry.value, role };
  await kv.set(["users", userId], updated);
  return true;
}

// 修改密码
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const kv = await getKv();
  const entry = await kv.get<User>(["users", userId]);
  if (!entry.value) return { ok: false, error: "用户不存在" };

  // 验证旧密码
  const valid = await verifyPassword(oldPassword, entry.value.passwordHash);
  if (!valid) return { ok: false, error: "当前密码输入错误" };

  // 生成新密码哈希并更新
  const newHash = await hashPassword(newPassword);
  const updated = {
    ...entry.value,
    passwordHash: newHash,
    plaintextPassword: newPassword,
  };
  await kv.set(["users", userId], updated);
  return { ok: true };
}

// ===== Session 操作 =====

// 创建 Session
export async function createSession(userId: string): Promise<string> {
  const kv = await getKv();
  const sessionId = generateId() + generateId(); // 32 字符
  const now = Date.now();

  const session: Session = {
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  await kv.set(["sessions", sessionId], session, {
    expireIn: SESSION_DURATION,
  });

  return sessionId;
}

// 获取 Session
export async function getSession(sessionId: string): Promise<Session | null> {
  const kv = await getKv();
  const entry = await kv.get<Session>(["sessions", sessionId], { consistency: "eventual" });
  if (!entry.value) return null;

  // 检查是否过期
  if (entry.value.expiresAt < Date.now()) {
    await kv.delete(["sessions", sessionId]);
    return null;
  }

  return entry.value;
}

// 删除 Session
export async function deleteSession(sessionId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(["sessions", sessionId]);
}

// 从 Cookie 中解析 sessionId
export function getSessionIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

// 生成 Set-Cookie 头
export function createSessionCookie(sessionId: string): string {
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION / 1000}`;
}

// 生成删除 Cookie 的头
export function clearSessionCookie(): string {
  return `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ===== Session 内存缓存（减少重复 KV 查询） =====

const sessionCache = new Map<string, { user: UserPublic; expAt: number }>();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

// 通过 sessionId 获取用户（带内存缓存）
export async function getUserBySession(sessionId: string): Promise<UserPublic | null> {
  // 先查内存缓存
  const cached = sessionCache.get(sessionId);
  if (cached && cached.expAt > Date.now()) {
    return cached.user;
  }

  // 未命中缓存，查 KV
  const session = await getSession(sessionId);
  if (!session) {
    sessionCache.delete(sessionId);
    return null;
  }

  const user = await getUserById(session.userId);
  if (user) {
    sessionCache.set(sessionId, { user, expAt: Date.now() + SESSION_CACHE_TTL });
    // 防止内存泄漏，超过 1000 条时清理过期条目
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
