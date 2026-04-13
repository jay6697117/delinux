// 帖子详情页

import { define } from "../../utils.ts";
import { getPost, getReplies, isLiked, isFavorited, createReply } from "../../utils/posts.ts";
import { getBoardBySlug } from "../../utils/boards.ts";
import { timeAgo, formatDate } from "../../utils/time.ts";
import { renderMarkdown } from "../../utils/markdown.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { id } = ctx.params;

    // 先获取帖子（必须先确认存在性）
    const post = await getPost(id);
    if (!post) return ctx.renderNotFound();

    // O(1) 查找版块
    const board = getBoardBySlug(post.boardSlug);

    // 并行查询回复、点赞、收藏（登录/未登录都用 Promise.all 并行）
    const userId = ctx.state.user?.id;
    const [repliesResult, liked, favorited] = await Promise.all([
      getReplies(id),
      userId ? isLiked(id, userId) : Promise.resolve(false),
      userId ? isFavorited(id, userId) : Promise.resolve(false),
    ]);

    const htmlContent = renderMarkdown(post.content);
    return { data: { post, board, replies: repliesResult.items, htmlContent, liked, favorited, replyError: "" } };
  },
  async POST(ctx) {
    const { id } = ctx.params;
    if (!ctx.state.user) return new Response(null, { status: 302, headers: { location: "/auth/login" } });
    const form = await ctx.req.formData();
    const content = (form.get("content") as string || "").trim();
    if (!content) {
      const post = await getPost(id);
      if (!post) return ctx.renderNotFound();
      const board = getBoardBySlug(post.boardSlug);
      // 并行查询
      const [repliesResult, liked, favorited] = await Promise.all([
        getReplies(id),
        isLiked(id, ctx.state.user.id),
        isFavorited(id, ctx.state.user.id),
      ]);
      const htmlContent = renderMarkdown(post.content);
      return { data: { post, board, replies: repliesResult.items, htmlContent, liked, favorited, replyError: "回复内容不能为空" } };
    }
    await createReply(id, content, ctx.state.user.id, ctx.state.user.username);
    return new Response(null, { status: 302, headers: { location: `/post/${id}` } });
  },
});

export default define.page<typeof handler>(function PostDetail({ data, state }) {
  const { post, board, replies, htmlContent, liked, favorited, replyError } = data;
  return (
    <div style={{ padding: "var(--space-md) 0" }}>
      <div class="card">
        <div class="post-detail">
          <div style={{ marginBottom: "var(--space-sm)" }}>
            <a href={`/board/${post.boardSlug}`} class="post-board-tag">{board?.icon} {board?.name}</a>
          </div>
          <h1 class="post-detail-title">{post.title}</h1>
          <div class="post-detail-meta">
            <a href={`/user/${post.authorId}`} class="post-author">{post.authorName}</a>
            <span>发布于 {formatDate(post.createdAt)}</span>
            <span>👍 {post.likeCount}</span>
            <span>💬 {post.replyCount}</span>
          </div>
          <div class="post-detail-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
        {state.user && (
          <div class="action-bar">
            <form method="POST" action="/api/like" style={{ display: "inline" }}><input type="hidden" name="postId" value={post.id} /><button type="submit" class={`action-btn ${liked ? "active" : ""}`}>{liked ? "👍 已赞" : "👍 点赞"} {post.likeCount}</button></form>
            <form method="POST" action="/api/favorite" style={{ display: "inline" }}><input type="hidden" name="postId" value={post.id} /><button type="submit" class={`action-btn ${favorited ? "active" : ""}`}>{favorited ? "⭐ 已收藏" : "☆ 收藏"}</button></form>
            {state.user.role === "admin" && (
              <form method="POST" action="/api/admin/delete-post" style={{ display: "inline", marginLeft: "auto" }}><input type="hidden" name="postId" value={post.id} /><button type="submit" class="action-btn" style={{ color: "var(--danger)" }}>🗑️ 删帖</button></form>
            )}
          </div>
        )}
      </div>
      <div class="card" style={{ marginTop: "var(--space-md)" }}>
        <div class="card-header">💬 回复 ({post.replyCount})</div>
        {replies.length === 0 ? (
          <div class="empty-state" style={{ padding: "var(--space-lg)" }}><p class="empty-state-text">还没有回复，来说两句吧</p></div>
        ) : replies.map((reply, i) => (
          <div class="reply-item" key={reply.id}>
            <div class="reply-header">
              <a href={`/user/${reply.authorId}`} class="reply-author">{reply.authorName}</a>
              <span class="reply-time">{timeAgo(reply.createdAt)}</span>
              <span class="reply-floor">#{replies.length - i}</span>
            </div>
            <div class="reply-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.content) }} />
          </div>
        ))}
      </div>
      {state.user ? (
        <div class="card" style={{ marginTop: "var(--space-md)" }}>
          <div class="card-body">
            {replyError && <div class="alert alert-error">{replyError}</div>}
            <form method="POST">
              <div class="form-group"><textarea class="form-input" name="content" placeholder="写下你的回复（支持 Markdown）" style={{ minHeight: "100px" }} required></textarea></div>
              <button type="submit" class="btn btn-primary">回复</button>
            </form>
          </div>
        </div>
      ) : (
        <div class="card" style={{ marginTop: "var(--space-md)", textAlign: "center", padding: "var(--space-lg)" }}>
          <p style={{ color: "var(--text-secondary)" }}><a href="/auth/login">登录</a> 后参与讨论</p>
        </div>
      )}
    </div>
  );
});
