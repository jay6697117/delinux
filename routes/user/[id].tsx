// 用户个人主页

import type { RouteContext } from "fresh";
import type { State, Post } from "../../utils/state.ts";
import { getUserById } from "../../utils/auth.ts";
import { getUserFavorites } from "../../utils/posts.ts";
import { getKv } from "../../utils/db.ts";
import { timeAgo } from "../../utils/time.ts";
import { getAllBoards } from "../../utils/boards.ts";

export default async function UserPage(req: Request, ctx: RouteContext<void, State>) {
  const { id } = ctx.params;
  const user = await getUserById(id);

  if (!user) {
    return ctx.renderNotFound();
  }

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") || "posts";
  const boards = await getAllBoards();

  // 获取用户的帖子
  const kv = await getKv();
  let posts: Post[] = [];

  if (tab === "posts") {
    const entries = kv.list<string>({ prefix: ["posts_by_user", id] }, { limit: 20 });
    const postIds: string[] = [];
    for await (const entry of entries) {
      postIds.push(entry.value as string);
    }
    for (const postId of postIds) {
      const postEntry = await kv.get<Post>(["posts", postId]);
      if (postEntry.value) posts.push(postEntry.value);
    }
  } else if (tab === "favorites" && ctx.state.user?.id === id) {
    const result = await getUserFavorites(id);
    posts = result.items;
  }

  const isOwner = ctx.state.user?.id === id;

  return (
    <div style={{ padding: "var(--space-md) 0" }}>
      <div class="card">
        <div class="user-header">
          <div class="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div class="user-info">
            <h1>
              {user.username}
              {user.role === "admin" && (
                <span class="user-badge admin" style={{ marginLeft: "8px" }}>管理员</span>
              )}
              {user.banned && (
                <span class="user-badge banned" style={{ marginLeft: "8px" }}>已禁言</span>
              )}
            </h1>
            <p>加入于 {timeAgo(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div class="tabs" style={{ marginTop: "var(--space-md)" }}>
        <a href={`/user/${id}?tab=posts`} class={`tab ${tab === "posts" ? "active" : ""}`}>
          📝 帖子
        </a>
        {isOwner && (
          <a href={`/user/${id}?tab=favorites`} class={`tab ${tab === "favorites" ? "active" : ""}`}>
            ⭐ 收藏
          </a>
        )}
      </div>

      {/* 帖子列表 */}
      <div class="card">
        {posts.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">{tab === "posts" ? "📝" : "⭐"}</div>
            <p class="empty-state-text">
              {tab === "posts" ? "还没有发过帖子" : "还没有收藏的帖子"}
            </p>
          </div>
        ) : (
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
                      {boards.find(b => b.slug === post.boardSlug)?.icon} {boards.find(b => b.slug === post.boardSlug)?.name}
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
}
