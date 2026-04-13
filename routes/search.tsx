// 搜索页面

import { define } from "../utils.ts";
import { searchPosts } from "../utils/posts.ts";
import { getAllBoards } from "../utils/boards.ts";
import { timeAgo } from "../utils/time.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const query = url.searchParams.get("q") || "";
    const boards = getAllBoards();
    const posts = query ? await searchPosts(query) : [];
    return { data: { query, boards, posts } };
  },
});

export default define.page<typeof handler>(function SearchPage({ data }) {
  const { query, boards, posts } = data;
  return (
    <div style={{ padding: "var(--space-md) 0" }}>
      <h1 class="page-title" style={{ marginBottom: "var(--space-md)" }}>🔍 搜索</h1>
      <form method="GET" class="search-bar">
        <input class="form-input" type="text" name="q" value={query} placeholder="搜索帖子标题..." autofocus />
        <button type="submit" class="btn btn-primary">搜索</button>
      </form>
      {query && (
        <div class="card">
          <div class="card-header">搜索 "{query}" 的结果 ({posts.length})</div>
          {posts.length === 0 ? (
            <div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-text">没有找到相关帖子</p></div>
          ) : (
            <ul class="post-list">
              {posts.map((post) => (
                <li class="post-item" key={post.id}>
                  <div class="post-meta-left"><span class="post-replies-count">{post.replyCount}</span><span class="post-replies-label">回复</span></div>
                  <div class="post-content-area">
                    <div class="post-title"><a href={`/post/${post.id}`}>{post.title}</a></div>
                    <div class="post-info">
                      <span class="post-board-tag">{boards.find(b => b.slug === post.boardSlug)?.icon} {boards.find(b => b.slug === post.boardSlug)?.name}</span>
                      <span class="post-author">{post.authorName}</span>
                      <span class="post-time">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});
