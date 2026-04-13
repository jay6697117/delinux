// 帖子详情页

import type { RouteContext } from "fresh";
import type { State } from "../../utils/state.ts";
import { getPost, getReplies, isLiked, isFavorited } from "../../utils/posts.ts";
import { getAllBoards } from "../../utils/boards.ts";
import { timeAgo, formatDate } from "../../utils/time.ts";
import { renderMarkdown } from "../../utils/markdown.ts";

export default async function PostDetail(req: Request, ctx: RouteContext<void, State>) {
  const { id } = ctx.params;
  const post = await getPost(id);

  if (!post) {
    return ctx.renderNotFound();
  }

  const url = new URL(req.url);
  const replyCursor = url.searchParams.get("replyCursor") || undefined;

  const boards = await getAllBoards();
  const board = boards.find(b => b.slug === post.boardSlug);
  const repliesResult = await getReplies(id, replyCursor);
  const htmlContent = renderMarkdown(post.content);

  // 当前用户的点赞/收藏状态
  let liked = false;
  let favorited = false;
  if (ctx.state.user) {
    liked = await isLiked(id, ctx.state.user.id);
    favorited = await isFavorited(id, ctx.state.user.id);
  }

  // 处理回帖提交
  let replyError = "";
  if (req.method === "POST" && ctx.state.user) {
    const form = await req.formData();
    const action = form.get("action") as string;

    if (action === "reply") {
      const content = (form.get("content") as string || "").trim();
      if (!content) {
        replyError = "回复内容不能为空";
      } else if (content.length > 5000) {
        replyError = "回复不能超过 5000 个字符";
      } else {
        const { createReply } = await import("../../utils/posts.ts");
        await createReply(id, content, ctx.state.user.id, ctx.state.user.username);
        return new Response(null, {
          status: 302,
          headers: { location: `/post/${id}` },
        });
      }
    }
  }

  return (
    <div style={{ padding: "var(--space-md) 0" }}>
      <div class="card">
        {/* 帖子主体 */}
        <div class="post-detail">
          <div style={{ marginBottom: "var(--space-sm)" }}>
            <a href={`/board/${post.boardSlug}`} class="post-board-tag">
              {board?.icon} {board?.name}
            </a>
          </div>
          <h1 class="post-detail-title">{post.title}</h1>
          <div class="post-detail-meta">
            <a href={`/user/${post.authorId}`} class="post-author">{post.authorName}</a>
            <span>发布于 {formatDate(post.createdAt)}</span>
            <span>👍 {post.likeCount}</span>
            <span>💬 {post.replyCount}</span>
          </div>
          <div
            class="post-detail-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* 互动按钮 */}
        {ctx.state.user && (
          <div class="action-bar">
            <form method="POST" action={`/api/like`} style={{ display: "inline" }}>
              <input type="hidden" name="postId" value={id} />
              <button type="submit" class={`action-btn ${liked ? "active" : ""}`}>
                {liked ? "👍 已赞" : "👍 点赞"} {post.likeCount}
              </button>
            </form>
            <form method="POST" action={`/api/favorite`} style={{ display: "inline" }}>
              <input type="hidden" name="postId" value={id} />
              <button type="submit" class={`action-btn ${favorited ? "active" : ""}`}>
                {favorited ? "⭐ 已收藏" : "☆ 收藏"}
              </button>
            </form>
            {ctx.state.user.role === "admin" && (
              <form method="POST" action={`/api/admin/delete-post`} style={{ display: "inline", marginLeft: "auto" }}>
                <input type="hidden" name="postId" value={id} />
                <button type="submit" class="action-btn" style={{ color: "var(--danger)" }}
                  onclick="return confirm('确定删除这个帖子？')">
                  🗑️ 删帖
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 回复列表 */}
      <div class="card" style={{ marginTop: "var(--space-md)" }}>
        <div class="card-header">💬 回复 ({post.replyCount})</div>

        {repliesResult.items.length === 0 && !replyError ? (
          <div class="empty-state" style={{ padding: "var(--space-lg)" }}>
            <p class="empty-state-text">还没有回复，来说两句吧</p>
          </div>
        ) : (
          repliesResult.items.map((reply, i) => (
            <div class="reply-item" key={reply.id}>
              <div class="reply-header">
                <a href={`/user/${reply.authorId}`} class="reply-author">{reply.authorName}</a>
                <span class="reply-time">{timeAgo(reply.createdAt)}</span>
                <span class="reply-floor">#{i + 1}</span>
              </div>
              <div
                class="reply-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.content) }}
              />
            </div>
          ))
        )}

        {repliesResult.hasMore && repliesResult.cursor && (
          <div class="pagination">
            <a href={`/post/${id}?replyCursor=${repliesResult.cursor}`} class="btn btn-secondary">更多回复</a>
          </div>
        )}
      </div>

      {/* 回帖表单 */}
      {ctx.state.user ? (
        <div class="card" style={{ marginTop: "var(--space-md)" }}>
          <div class="card-body">
            {replyError && <div class="alert alert-error">{replyError}</div>}
            <form method="POST">
              <input type="hidden" name="action" value="reply" />
              <div class="form-group">
                <textarea
                  class="form-input"
                  name="content"
                  placeholder="写下你的回复（支持 Markdown）"
                  style={{ minHeight: "100px" }}
                  required
                ></textarea>
              </div>
              <button type="submit" class="btn btn-primary">回复</button>
            </form>
          </div>
        </div>
      ) : (
        <div class="card" style={{ marginTop: "var(--space-md)", textAlign: "center", padding: "var(--space-lg)" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            <a href="/auth/login">登录</a> 后参与讨论
          </p>
        </div>
      )}
    </div>
  );
}
