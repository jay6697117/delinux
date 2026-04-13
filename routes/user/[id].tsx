// 用户个人主页

import { define } from "../../utils.ts";
import { getUserById } from "../../utils/auth.ts";
import { getUserFavorites, getUserPosts } from "../../utils/posts.ts";
import { timeAgo } from "../../utils/time.ts";
import { getBoardBySlug } from "../../utils/boards.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { id } = ctx.params;
    const user = await getUserById(id);
    if (!user) return ctx.renderNotFound();
    const url = new URL(ctx.req.url);
    const tab = url.searchParams.get("tab") || "posts";

    let posts: Awaited<ReturnType<typeof getUserPosts>> = [];
    if (tab === "posts") {
      // 一条 SQL 直接查询用户帖子
      posts = await getUserPosts(id);
    } else if (tab === "favorites" && ctx.state.user?.id === id) {
      const result = await getUserFavorites(id);
      posts = result.items;
    }
    const isOwner = ctx.state.user?.id === id;
    return { data: { profileUser: user, tab, posts, isOwner } };
  },
});

export default define.page<typeof handler>(function UserPage({ data }) {
  const { profileUser, tab, posts, isOwner } = data;
  return (
    <div style={{ padding: "var(--space-md) 0" }}>
      <div class="card">
        <div class="user-header">
          <div class="user-avatar">
            {profileUser.username.charAt(0).toUpperCase()}
          </div>
          <div class="user-info">
            <h1>
              {profileUser.username}
              {profileUser.role === "admin" && (
                <span
                  class="user-badge admin"
                  style={{ marginLeft: "8px" }}
                >
                  管理员
                </span>
              )}
              {profileUser.banned && (
                <span
                  class="user-badge banned"
                  style={{ marginLeft: "8px" }}
                >
                  已禁言
                </span>
              )}
            </h1>
            <p>加入于 {timeAgo(profileUser.createdAt)}</p>
          </div>
          {isOwner && (
            <a
              href="/auth/change-password"
              class="btn btn-secondary btn-sm"
              style={{ marginLeft: "auto", alignSelf: "center" }}
            >
              🔑 修改密码
            </a>
          )}
        </div>
      </div>
      <div class="tabs" style={{ marginTop: "var(--space-md)" }}>
        <a
          href={`/user/${profileUser.id}?tab=posts`}
          class={`tab ${tab === "posts" ? "active" : ""}`}
        >
          📝 帖子
        </a>
        {isOwner && (
          <a
            href={`/user/${profileUser.id}?tab=favorites`}
            class={`tab ${tab === "favorites" ? "active" : ""}`}
          >
            ⭐ 收藏
          </a>
        )}
      </div>
      <div class="card">
        {posts.length === 0
          ? (
            <div class="empty-state">
              <div class="empty-state-icon">
                {tab === "posts" ? "📝" : "⭐"}
              </div>
              <p class="empty-state-text">
                {tab === "posts" ? "还没有发过帖子" : "还没有收藏的帖子"}
              </p>
            </div>
          )
          : (
            <ul class="post-list">
              {posts.map((post) => (
                <li class="post-item" key={post.id}>
                  <div class="post-meta-left">
                    <span class="post-replies-count">{post.replyCount}</span>
                    <span class="post-replies-label">回复</span>
                  </div>
                  <div class="post-content-area">
                    <div class="post-title">
                      <a href={`/post/${post.id}`}>{post.title}</a>
                    </div>
                    <div class="post-info">
                      <span class="post-board-tag">
                        {getBoardBySlug(post.boardSlug)?.icon}{" "}
                        {getBoardBySlug(post.boardSlug)?.name}
                      </span>
                      <span class="post-time">{timeAgo(post.createdAt)}</span>
                      <span class="post-stats">
                        <span>👍 {post.likeCount}</span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
});
