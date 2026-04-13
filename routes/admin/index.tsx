// 管理后台面板

import type { RouteContext } from "fresh";
import type { State, User, Post } from "../utils/state.ts";
import { getKv } from "../utils/db.ts";
import { timeAgo } from "../utils/time.ts";

export default async function AdminPage(req: Request, ctx: RouteContext<void, State>) {
  // 权限检查
  if (!ctx.state.user || ctx.state.user.role !== "admin") {
    return new Response(null, { status: 302, headers: { location: "/" } });
  }

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") || "overview";
  const kv = await getKv();

  // 统计数据
  let userCount = 0;
  let postCount = 0;
  let replyCount = 0;
  const users: User[] = [];
  const posts: Post[] = [];

  if (tab === "overview" || tab === "users") {
    // 遍历用户
    const userEntries = kv.list<User>({ prefix: ["users"] }, { limit: 100 });
    for await (const entry of userEntries) {
      userCount++;
      if (tab === "users") {
        users.push(entry.value);
      }
    }
  }

  if (tab === "overview" || tab === "posts") {
    // 遍历帖子（通过最新索引）
    const postEntries = kv.list<string>({ prefix: ["posts_latest"] }, { limit: 100 });
    for await (const entry of postEntries) {
      postCount++;
      if (tab === "posts") {
        const postEntry = await kv.get<Post>(["posts", entry.value as string]);
        if (postEntry.value) {
          posts.push(postEntry.value);
          replyCount += postEntry.value.replyCount;
        }
      }
    }
  }

  // 概览模式下也统计帖子数
  if (tab === "overview") {
    const postEntries2 = kv.list<string>({ prefix: ["posts_latest"] }, { limit: 1000 });
    postCount = 0;
    for await (const entry of postEntries2) {
      postCount++;
      const pe = await kv.get<Post>(["posts", entry.value as string]);
      if (pe.value) replyCount += pe.value.replyCount;
    }
  }

  return (
    <div style={{ padding: "var(--space-md) 0" }}>
      <h1 class="page-title" style={{ marginBottom: "var(--space-md)" }}>🛡️ 管理后台</h1>

      {/* 标签页 */}
      <div class="tabs">
        <a href="/admin?tab=overview" class={`tab ${tab === "overview" ? "active" : ""}`}>
          📊 数据概览
        </a>
        <a href="/admin?tab=users" class={`tab ${tab === "users" ? "active" : ""}`}>
          👥 用户管理
        </a>
        <a href="/admin?tab=posts" class={`tab ${tab === "posts" ? "active" : ""}`}>
          📝 帖子管理
        </a>
      </div>

      {/* 数据概览 */}
      {tab === "overview" && (
        <div>
          <div class="admin-stats">
            <div class="stat-card">
              <div class="stat-value">{userCount}</div>
              <div class="stat-label">注册用户</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{postCount}</div>
              <div class="stat-label">帖子总数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{replyCount}</div>
              <div class="stat-label">回复总数</div>
            </div>
          </div>
        </div>
      )}

      {/* 用户管理 */}
      {tab === "users" && (
        <div class="card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <a href={`/user/${u.id}`}>{u.username}</a>
                  </td>
                  <td style={{ color: "var(--text-tertiary)" }}>{u.email}</td>
                  <td>
                    <span class={`user-badge ${u.role === "admin" ? "admin" : ""}`}>
                      {u.role === "admin" ? "管理员" : "用户"}
                    </span>
                  </td>
                  <td>
                    {u.banned ? (
                      <span style={{ color: "var(--danger)" }}>已禁言</span>
                    ) : (
                      <span style={{ color: "var(--success)" }}>正常</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-tertiary)" }}>{timeAgo(u.createdAt)}</td>
                  <td>
                    {u.role !== "admin" && (
                      <form method="POST" action="/api/admin/ban-user" style={{ display: "inline" }}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="action" value={u.banned ? "unban" : "ban"} />
                        <button
                          type="submit"
                          class={`btn btn-sm ${u.banned ? "btn-secondary" : "btn-danger"}`}
                        >
                          {u.banned ? "解禁" : "禁言"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 帖子管理 */}
      {tab === "posts" && (
        <div class="card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>版块</th>
                <th>作者</th>
                <th>回复</th>
                <th>点赞</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <a href={`/post/${p.id}`}>{p.title.length > 30 ? p.title.slice(0, 30) + "..." : p.title}</a>
                  </td>
                  <td>{p.boardSlug}</td>
                  <td>{p.authorName}</td>
                  <td>{p.replyCount}</td>
                  <td>{p.likeCount}</td>
                  <td style={{ color: "var(--text-tertiary)" }}>{timeAgo(p.createdAt)}</td>
                  <td>
                    <form method="POST" action="/api/admin/delete-post" style={{ display: "inline" }}>
                      <input type="hidden" name="postId" value={p.id} />
                      <button
                        type="submit"
                        class="btn btn-sm btn-danger"
                        onclick="return confirm('确定删除这个帖子？')"
                      >
                        删除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
