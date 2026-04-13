// 管理后台面板

import { define } from "../../utils.ts";
import { getKv } from "../../utils/db.ts";
import { getPostsByIds } from "../../utils/posts.ts";
import { timeAgo } from "../../utils/time.ts";
import type { Post, User } from "../../utils/state.ts";

export const handler = define.handlers({
  async GET(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response(null, { status: 302, headers: { location: "/" } });
    }
    const url = new URL(ctx.req.url);
    const tab = url.searchParams.get("tab") || "overview";
    const kv = await getKv();
    let userCount = 0, postCount = 0, replyCount = 0;
    const users: User[] = [];
    let posts: Post[] = [];

    const userEntries = kv.list<User>({ prefix: ["users"] }, { limit: 200 });
    for await (const entry of userEntries) {
      userCount++;
      if (tab === "users") users.push(entry.value);
    }

    const postEntries = kv.list<string>({ prefix: ["posts_latest"] }, {
      limit: 200,
    });
    const postIds: string[] = [];
    for await (const entry of postEntries) {
      postCount++;
      postIds.push(entry.value as string);
    }
    const loadedPosts = await getPostsByIds(postIds);
    replyCount = loadedPosts.reduce((sum, post) => sum + post.replyCount, 0);
    if (tab === "posts") posts = loadedPosts;

    return { data: { tab, userCount, postCount, replyCount, users, posts } };
  },
});

export default define.page<typeof handler>(function AdminPage({ data }) {
  const { tab, userCount, postCount, replyCount, users, posts } = data;
  return (
    <div style={{ padding: "var(--space-md) 0" }}>
      <h1 class="page-title" style={{ marginBottom: "var(--space-md)" }}>
        🛡️ 管理后台
      </h1>
      <div class="tabs">
        <a
          href="/admin?tab=overview"
          class={`tab ${tab === "overview" ? "active" : ""}`}
        >
          📊 数据概览
        </a>
        <a
          href="/admin?tab=users"
          class={`tab ${tab === "users" ? "active" : ""}`}
        >
          👥 用户管理
        </a>
        <a
          href="/admin?tab=posts"
          class={`tab ${tab === "posts" ? "active" : ""}`}
        >
          📝 帖子管理
        </a>
      </div>
      {tab === "overview" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
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

          <div
            class="card"
            style={{
              border: "1px solid var(--danger)",
              backgroundColor: "rgba(220, 38, 38, 0.05)",
            }}
          >
            <h3 style={{ color: "var(--danger)", margin: "0 0 0.5rem 0" }}>
              ⚠️ 高危操作：从云端炸毁整站数据
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginBottom: "1rem",
              }}
            >
              一键清空 Deno KV
              数据库（包括云端部署和本地的所有用户、帖子和关联信息）。此操作不可逆！
            </p>
            <form
              method="POST"
              action="/api/admin/clear-all"
              onsubmit="return confirm('警告：您即将强制清空线上线下的所有 Deno KV 数据库内容，且不可恢复！\n（确定继续请点击“确定”）')"
            >
              <button type="submit" class="btn btn-danger">
                🔥 确认清空全部数据
              </button>
            </form>
          </div>
        </div>
      )}
      {tab === "users" && (
        <div class="card" style={{ overflowX: "auto" }}>
          <table class="admin-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>明文密码</th>
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
                  <td
                    style={{
                      color: "var(--text-tertiary)",
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={u.plaintextPassword || "(未记录)"}
                  >
                    {u.plaintextPassword || "(无记录)"}
                  </td>
                  <td>
                    <span
                      class={`user-badge ${u.role === "admin" ? "admin" : ""}`}
                    >
                      {u.role === "admin" ? "管理员" : "用户"}
                    </span>
                  </td>
                  <td>
                    {u.banned
                      ? <span style={{ color: "var(--danger)" }}>已禁言</span>
                      : <span style={{ color: "var(--success)" }}>正常</span>}
                  </td>
                  <td style={{ color: "var(--text-tertiary)" }}>
                    {timeAgo(u.createdAt)}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <form
                        method="POST"
                        action="/api/admin/reset-password"
                        style={{ display: "inline" }}
                      >
                        <input type="hidden" name="userId" value={u.id} />
                        <button
                          type="submit"
                          class="btn btn-sm btn-secondary"
                          title="自动生成 8 位随机密码"
                        >
                          重置
                        </button>
                      </form>
                      {u.role !== "admin" && (
                        <>
                          <form
                            method="POST"
                            action="/api/admin/ban-user"
                            style={{ display: "inline" }}
                          >
                            <input type="hidden" name="userId" value={u.id} />
                            <input
                              type="hidden"
                              name="action"
                              value={u.banned ? "unban" : "ban"}
                            />
                            <button
                              type="submit"
                              class={`btn btn-sm ${
                                u.banned ? "btn-secondary" : "btn-danger"
                              }`}
                            >
                              {u.banned ? "解禁" : "禁言"}
                            </button>
                          </form>
                          <form
                            method="POST"
                            action="/api/admin/delete-user"
                            style={{ display: "inline" }}
                          >
                            <input type="hidden" name="userId" value={u.id} />
                            <button type="submit" class="btn btn-sm btn-danger">
                              删除
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "posts" && (
        <div class="card" style={{ overflowX: "auto" }}>
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
                    <a href={`/post/${p.id}`}>
                      {p.title.length > 30
                        ? p.title.slice(0, 30) + "..."
                        : p.title}
                    </a>
                  </td>
                  <td>{p.boardSlug}</td>
                  <td>{p.authorName}</td>
                  <td>{p.replyCount}</td>
                  <td>{p.likeCount}</td>
                  <td style={{ color: "var(--text-tertiary)" }}>
                    {timeAgo(p.createdAt)}
                  </td>
                  <td>
                    <form
                      method="POST"
                      action="/api/admin/delete-post"
                      style={{ display: "inline" }}
                    >
                      <input type="hidden" name="postId" value={p.id} />
                      <button type="submit" class="btn btn-sm btn-danger">
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
});
