// 版块帖子列表页

import { define } from "../../utils.ts";
import { BOARDS } from "../../utils/boards.ts";
import { getKv } from "../../utils/db.ts";
import { timeAgo } from "../../utils/time.ts";
import type { Post } from "../../utils/state.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;
    // 用静态常量查找版块，省掉 1 次 KV get
    const board = BOARDS.find((b) => b.slug === slug);
    if (!board) return ctx.renderNotFound();

    const url = new URL(ctx.req.url);
    const cursor = url.searchParams.get("cursor") || undefined;
    const limit = 20;
    const kv = await getKv();
    const entries = kv.list<string>({ prefix: ["posts_by_board", slug] }, { limit: limit + 1, cursor });
    const postIds: string[] = [];
    let nextCursor: string | undefined;
    let count = 0;
    for await (const entry of entries) {
      count++;
      if (count > limit) break;
      postIds.push(entry.value as string);
      nextCursor = entries.cursor;
    }
    const hasMore = count > limit;
    // 并行查询所有帖子详情
    const postEntries = await Promise.all(
      postIds.map((id) => kv.get<Post>(["posts", id])),
    );
    const posts = postEntries
      .filter((e) => e.value !== null)
      .map((e) => e.value as Post);
    return { data: { board, posts, hasMore, nextCursor, slug } };
  },
});

export default define.page<typeof handler>(function BoardPage({ data, state }) {
  const { board, posts, hasMore, nextCursor, slug } = data;
  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">{board.icon} {board.name} — {board.description}</h1>
        {state.user && <a href={`/post/new?board=${slug}`} class="btn btn-primary">发帖</a>}
      </div>
      <div class="card">
        {posts.length === 0 ? (
          <div class="empty-state"><div class="empty-state-icon">{board.icon}</div><p class="empty-state-text">这个版块还没有帖子</p></div>
        ) : (
          <ul class="post-list">
            {posts.map((post) => (
              <li class="post-item" key={post.id}>
                <div class="post-meta-left"><span class="post-replies-count">{post.replyCount}</span><span class="post-replies-label">回复</span></div>
                <div class="post-content-area">
                  <div class="post-title"><a href={`/post/${post.id}`}>{post.title}</a></div>
                  <div class="post-info">
                    <span class="post-author">{post.authorName}</span>
                    <span class="post-time">{timeAgo(post.createdAt)}</span>
                    <span class="post-stats"><span>👍 {post.likeCount}</span><span>💬 {post.replyCount}</span></span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {hasMore && nextCursor && <div class="pagination"><a href={`/board/${slug}?cursor=${nextCursor}`} class="btn btn-secondary">加载更多</a></div>}
      </div>
    </div>
  );
});
